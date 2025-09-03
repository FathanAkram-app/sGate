import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

@Injectable()
export class RedisRateLimitMiddleware implements NestMiddleware {
  private redis: Redis;
  private readonly rateLimitConfigs: Map<string, RateLimitOptions> = new Map();

  constructor(private configService: ConfigService) {
    this.initializeRedis();
    this.initializeRateLimitConfigs();
  }

  private initializeRedis() {
    const redisUrl = this.configService.get<string>('redis.url');
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: this.configService.get<number>('redis.connectTimeout'),
        keyPrefix: this.configService.get<string>('redis.prefix') + ':ratelimit:',
      });

      this.redis.on('error', (error) => {
        console.error('Redis rate limit error:', error);
      });
    }
  }

  private initializeRateLimitConfigs() {
    const windowMs = this.configService.get<number>('rateLimit.windowMs');

    // Payment Intent Creation
    this.rateLimitConfigs.set('/v1/payment_intents:POST', {
      windowMs,
      max: this.configService.get<number>('rateLimit.paymentCreation'),
      keyGenerator: (req) => `payment-creation:${this.getClientId(req)}`,
    });

    // Payment Intent Retrieval
    this.rateLimitConfigs.set('/v1/payment_intents:GET', {
      windowMs,
      max: this.configService.get<number>('rateLimit.paymentRetrieval'),
      keyGenerator: (req) => `payment-retrieval:${this.getClientId(req)}`,
    });

    // Public API
    this.rateLimitConfigs.set('/public/*:*', {
      windowMs,
      max: this.configService.get<number>('rateLimit.publicApi'),
      keyGenerator: (req) => `public-api:${this.getClientIp(req)}`,
    });

    // Default rate limit
    this.rateLimitConfigs.set('*:*', {
      windowMs,
      max: this.configService.get<number>('rateLimit.default'),
      keyGenerator: (req) => `default:${this.getClientId(req)}`,
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip rate limiting in development or if Redis is not available
    if (
      this.configService.get<string>('nodeEnv') === 'development' ||
      !this.configService.get<boolean>('rateLimit.enabled') ||
      !this.redis
    ) {
      return next();
    }

    try {
      const routeKey = this.getRouteKey(req);
      const config = this.getRateLimitConfig(routeKey);
      
      if (!config) {
        return next();
      }

      const key = config.keyGenerator(req);
      const result = await this.checkRateLimit(key, config);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', config.max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - result.count));
      res.setHeader('X-RateLimit-Reset', result.resetTime);
      res.setHeader('X-RateLimit-Window', Math.floor(config.windowMs / 1000));

      if (result.exceeded) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter);

        throw new HttpException(
          {
            error: {
              type: 'rate_limit_exceeded',
              message: 'Too many requests. Please try again later.',
            },
            request_id: req.headers['x-request-id'] || this.generateRequestId(),
            timestamp: new Date().toISOString(),
            retry_after: retryAfter,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // If Redis fails, log error but don't block request
      console.error('Rate limiting error:', error);
      next();
    }
  }

  private async checkRateLimit(
    key: string,
    config: RateLimitOptions,
  ): Promise<{ count: number; resetTime: number; exceeded: boolean }> {
    const now = Date.now();
    const window = Math.floor(now / config.windowMs);
    const redisKey = `${key}:${window}`;

    // Use Redis pipeline for atomic operations
    const pipeline = this.redis.pipeline();
    pipeline.incr(redisKey);
    pipeline.expire(redisKey, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();
    const count = results[0][1] as number;

    const resetTime = (window + 1) * config.windowMs;

    return {
      count,
      resetTime,
      exceeded: count > config.max,
    };
  }

  private getRouteKey(req: Request): string {
    const path = req.route?.path || req.path;
    const method = req.method.toUpperCase();
    return `${path}:${method}`;
  }

  private getRateLimitConfig(routeKey: string): RateLimitOptions | null {
    // Try exact match first
    if (this.rateLimitConfigs.has(routeKey)) {
      return this.rateLimitConfigs.get(routeKey);
    }

    // Try pattern matches
    for (const [pattern, config] of this.rateLimitConfigs.entries()) {
      if (this.matchesPattern(routeKey, pattern)) {
        return config;
      }
    }

    return null;
  }

  private matchesPattern(routeKey: string, pattern: string): boolean {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\//g, '\\/')
      .replace(/:/g, ':');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(routeKey);
  }

  private getClientId(req: Request): string {
    // Try to get merchant ID from authenticated request
    if (req['merchant']?.id) {
      return `merchant:${req['merchant'].id}`;
    }

    // Fall back to API key hash
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const apiKey = authHeader.substring(7);
      // Use first 8 characters of API key as identifier
      return `apikey:${apiKey.substring(0, 8)}`;
    }

    // Fall back to IP address
    return `ip:${this.getClientIp(req)}`;
  }

  private getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.ip ||
      'unknown'
    ).split(',')[0].trim();
  }

  private generateRequestId(): string {
    return 'req_' + Math.random().toString(36).substring(2, 15);
  }

  // Public method to get current rate limit status
  async getRateLimitStatus(req: Request): Promise<{
    limit: number;
    remaining: number;
    resetTime: number;
    windowMs: number;
  } | null> {
    if (!this.redis || !this.configService.get<boolean>('rateLimit.enabled')) {
      return null;
    }

    try {
      const routeKey = this.getRouteKey(req);
      const config = this.getRateLimitConfig(routeKey);
      
      if (!config) {
        return null;
      }

      const key = config.keyGenerator(req);
      const now = Date.now();
      const window = Math.floor(now / config.windowMs);
      const redisKey = `${key}:${window}`;

      const count = await this.redis.get(redisKey);
      const resetTime = (window + 1) * config.windowMs;

      return {
        limit: config.max,
        remaining: Math.max(0, config.max - (parseInt(count) || 0)),
        resetTime,
        windowMs: config.windowMs,
      };
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return null;
    }
  }

  // Method to clear rate limits for testing
  async clearRateLimit(key: string): Promise<void> {
    if (this.redis) {
      const pattern = `${this.configService.get<string>('redis.prefix')}:ratelimit:${key}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }
}