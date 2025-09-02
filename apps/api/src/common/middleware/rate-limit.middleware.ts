import { Injectable, NestMiddleware, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly store: RateLimitStore = {};
  
  constructor(private configService: ConfigService) {
    // Clean up expired entries every minute
    setInterval(() => this.cleanupExpiredEntries(), 60000);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const isRateLimitEnabled = this.configService.get<boolean>('security.rateLimitEnabled') !== false;
    
    if (!isRateLimitEnabled) {
      return next();
    }

    const identifier = this.getIdentifier(req);
    const limits = this.getLimitsForRequest(req);
    
    if (!limits) {
      return next();
    }

    const now = Date.now();
    const windowMs = limits.windowMs;
    const maxRequests = limits.max;

    // Get or initialize rate limit entry
    if (!this.store[identifier] || now >= this.store[identifier].resetTime) {
      this.store[identifier] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    const entry = this.store[identifier];
    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > maxRequests) {
      this.logger.warn(`Rate limit exceeded for ${identifier}`, {
        identifier,
        count: entry.count,
        limit: maxRequests,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });

      res.setHeader('Retry-After', Math.ceil((entry.resetTime - now) / 1000));
      
      throw new HttpException(
        {
          error: 'rate_limited',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }

  private getIdentifier(req: Request): string {
    // Use API key if available (for authenticated requests)
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    if (apiKey) {
      return `api:${apiKey.substring(0, 10)}...`; // Truncate for privacy
    }
    
    // Fall back to IP address
    return `ip:${req.ip}`;
  }

  private getLimitsForRequest(req: Request): { max: number; windowMs: number } | null {
    const path = req.path;
    const method = req.method;

    // Different rate limits for different endpoints
    if (path.startsWith('/v1/payment_intents') && method === 'POST') {
      // Payment creation: 100 requests per hour per API key
      return {
        max: this.configService.get<number>('security.rateLimits.paymentCreation') || 100,
        windowMs: 60 * 60 * 1000, // 1 hour
      };
    }

    if (path.startsWith('/v1/payment_intents') && method === 'GET') {
      // Payment retrieval: 1000 requests per hour per API key
      return {
        max: this.configService.get<number>('security.rateLimits.paymentRetrieval') || 1000,
        windowMs: 60 * 60 * 1000, // 1 hour
      };
    }

    if (path.startsWith('/v1/public')) {
      // Public endpoints: 500 requests per hour per IP
      return {
        max: this.configService.get<number>('security.rateLimits.publicApi') || 500,
        windowMs: 60 * 60 * 1000, // 1 hour
      };
    }

    // Default rate limit: 200 requests per hour
    return {
      max: this.configService.get<number>('security.rateLimits.default') || 200,
      windowMs: 60 * 60 * 1000, // 1 hour
    };
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys = Object.keys(this.store).filter(
      key => this.store[key].resetTime <= now
    );
    
    for (const key of expiredKeys) {
      delete this.store[key];
    }

    if (expiredKeys.length > 0) {
      this.logger.debug(`Cleaned up ${expiredKeys.length} expired rate limit entries`);
    }
  }
}