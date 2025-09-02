import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  error: {
    type: string;
    message: string;
    details?: any;
  };
  request_id: string;
  timestamp: string;
  path: string;
  status: number;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // Generate request ID if not exists
    const requestId = request.headers['x-request-id'] as string || 
                     Math.random().toString(36).substring(7);

    let status: number;
    let errorResponse: ErrorResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      errorResponse = {
        error: {
          type: this.getErrorType(status),
          message: typeof exceptionResponse === 'string' 
            ? exceptionResponse 
            : (exceptionResponse as any)?.message || exception.message,
          details: typeof exceptionResponse === 'object' 
            ? exceptionResponse 
            : undefined,
        },
        request_id: requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
        status,
      };

      // Log client errors (4xx) as warnings, server errors (5xx) as errors
      if (status >= 500) {
        this.logger.error(
          `${status} ${request.method} ${request.url} - ${exception.message}`,
          {
            requestId,
            method: request.method,
            url: request.url,
            userAgent: request.headers['user-agent'],
            ip: request.ip,
            body: this.sanitizeBody(request.body),
            query: request.query,
            headers: this.sanitizeHeaders(request.headers),
            stack: exception.stack,
          },
        );
      } else if (status >= 400) {
        this.logger.warn(
          `${status} ${request.method} ${request.url} - ${exception.message}`,
          {
            requestId,
            method: request.method,
            url: request.url,
            userAgent: request.headers['user-agent'],
            ip: request.ip,
          },
        );
      }
    } else {
      // Unhandled exception
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      
      errorResponse = {
        error: {
          type: 'internal_server_error',
          message: 'An unexpected error occurred',
        },
        request_id: requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
        status,
      };

      this.logger.error(
        `500 ${request.method} ${request.url} - Unhandled exception`,
        {
          requestId,
          method: request.method,
          url: request.url,
          userAgent: request.headers['user-agent'],
          ip: request.ip,
          body: this.sanitizeBody(request.body),
          query: request.query,
          headers: this.sanitizeHeaders(request.headers),
          error: exception,
          stack: (exception as Error)?.stack,
        },
      );
    }

    response.status(status).json(errorResponse);
  }

  private getErrorType(status: number): string {
    switch (status) {
      case 400:
        return 'bad_request';
      case 401:
        return 'unauthorized';
      case 403:
        return 'forbidden';
      case 404:
        return 'not_found';
      case 409:
        return 'conflict';
      case 422:
        return 'validation_error';
      case 429:
        return 'rate_limited';
      case 500:
        return 'internal_server_error';
      case 502:
        return 'bad_gateway';
      case 503:
        return 'service_unavailable';
      default:
        return status >= 500 ? 'server_error' : 'client_error';
    }
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'secret', 'token', 'api_key', 'apiKey'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie'];
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}