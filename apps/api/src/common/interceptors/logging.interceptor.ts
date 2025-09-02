import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    const { method, url, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const ip = request.ip;
    const startTime = Date.now();
    
    // Generate request ID
    const requestId = headers['x-request-id'] as string || 
                     Math.random().toString(36).substring(7);
    
    // Add request ID to response headers
    response.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const { statusCode } = response;
          const contentLength = response.get('content-length') || 0;
          const responseTime = Date.now() - startTime;

          // Log successful requests
          this.logger.log(
            `${statusCode} ${method} ${url} - ${responseTime}ms`,
            {
              requestId,
              method,
              url,
              statusCode,
              responseTime,
              contentLength,
              userAgent,
              ip,
            },
          );
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          
          // Error logging is handled by HttpExceptionFilter
          this.logger.debug(
            `Error ${method} ${url} - ${responseTime}ms`,
            {
              requestId,
              method,
              url,
              responseTime,
              error: error.message,
              userAgent,
              ip,
            },
          );
        },
      }),
    );
  }
}