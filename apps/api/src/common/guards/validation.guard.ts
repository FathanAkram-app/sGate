import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ValidationGuard implements CanActivate {
  private readonly logger = new Logger(ValidationGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Validate request size
    if (request.headers['content-length']) {
      const contentLength = parseInt(request.headers['content-length']);
      const maxSize = 1024 * 1024; // 1MB limit
      
      if (contentLength > maxSize) {
        this.logger.warn(`Request too large: ${contentLength} bytes from ${request.ip}`);
        throw new BadRequestException({
          error: 'request_too_large',
          message: 'Request payload too large',
          maxSize,
          actualSize: contentLength,
        });
      }
    }

    // Validate required headers for API requests
    if (request.path.startsWith('/v1/') && !request.path.startsWith('/v1/public')) {
      if (!request.headers.authorization) {
        throw new BadRequestException({
          error: 'missing_authorization',
          message: 'Authorization header is required',
        });
      }

      if (!request.headers.authorization.startsWith('Bearer ')) {
        throw new BadRequestException({
          error: 'invalid_authorization_format',
          message: 'Authorization header must use Bearer token format',
        });
      }
    }

    // Validate Content-Type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers['content-type'];
      
      if (!contentType) {
        throw new BadRequestException({
          error: 'missing_content_type',
          message: 'Content-Type header is required',
        });
      }

      if (!contentType.includes('application/json')) {
        throw new BadRequestException({
          error: 'invalid_content_type',
          message: 'Content-Type must be application/json',
          received: contentType,
        });
      }
    }

    // Validate request body structure for payment intent creation
    if (request.path === '/v1/payment_intents' && request.method === 'POST') {
      return this.validatePaymentIntentCreation(request);
    }

    return true;
  }

  private validatePaymentIntentCreation(request: Request): boolean {
    const body = request.body;

    // Required fields validation
    if (!body.amount_sats) {
      throw new BadRequestException({
        error: 'missing_required_field',
        message: 'amount_sats is required',
        field: 'amount_sats',
      });
    }

    if (!body.currency) {
      throw new BadRequestException({
        error: 'missing_required_field',
        message: 'currency is required',
        field: 'currency',
      });
    }

    // Type validation
    if (typeof body.amount_sats !== 'number' || body.amount_sats <= 0) {
      throw new BadRequestException({
        error: 'invalid_field_type',
        message: 'amount_sats must be a positive number',
        field: 'amount_sats',
        received: typeof body.amount_sats,
        expected: 'positive number',
      });
    }

    // Range validation
    const minAmount = 1000; // 1,000 sats minimum (0.00001 sBTC)
    const maxAmount = 100000000; // 1 sBTC maximum
    
    if (body.amount_sats < minAmount || body.amount_sats > maxAmount) {
      throw new BadRequestException({
        error: 'amount_out_of_range',
        message: `amount_sats must be between ${minAmount} and ${maxAmount} sats`,
        field: 'amount_sats',
        min: minAmount,
        max: maxAmount,
        received: body.amount_sats,
      });
    }

    // Currency validation
    if (body.currency !== 'sbtc') {
      throw new BadRequestException({
        error: 'invalid_currency',
        message: 'Only sbtc currency is supported',
        field: 'currency',
        received: body.currency,
        supported: ['sbtc'],
      });
    }

    // Optional fields validation
    if (body.description && typeof body.description !== 'string') {
      throw new BadRequestException({
        error: 'invalid_field_type',
        message: 'description must be a string',
        field: 'description',
        received: typeof body.description,
        expected: 'string',
      });
    }

    if (body.description && body.description.length > 500) {
      throw new BadRequestException({
        error: 'field_too_long',
        message: 'description must be 500 characters or less',
        field: 'description',
        maxLength: 500,
        actualLength: body.description.length,
      });
    }

    // URL validation
    if (body.success_url && !this.isValidUrl(body.success_url)) {
      throw new BadRequestException({
        error: 'invalid_url',
        message: 'success_url must be a valid HTTPS URL',
        field: 'success_url',
        received: body.success_url,
      });
    }

    if (body.cancel_url && !this.isValidUrl(body.cancel_url)) {
      throw new BadRequestException({
        error: 'invalid_url',
        message: 'cancel_url must be a valid HTTPS URL',
        field: 'cancel_url',
        received: body.cancel_url,
      });
    }

    // Metadata validation
    if (body.metadata) {
      if (typeof body.metadata !== 'object' || Array.isArray(body.metadata)) {
        throw new BadRequestException({
          error: 'invalid_field_type',
          message: 'metadata must be an object',
          field: 'metadata',
          received: typeof body.metadata,
          expected: 'object',
        });
      }

      const metadataStr = JSON.stringify(body.metadata);
      if (metadataStr.length > 2048) {
        throw new BadRequestException({
          error: 'metadata_too_large',
          message: 'metadata must be 2048 characters or less when serialized',
          field: 'metadata',
          maxSize: 2048,
          actualSize: metadataStr.length,
        });
      }
    }

    return true;
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}