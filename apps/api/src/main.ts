import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationGuard } from './common/guards/validation.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port');

  // Global error handling
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Global request logging will be handled by middleware
  
  // Global validation guards
  app.useGlobalGuards(new ValidationGuard());

  // Enhanced CORS with security considerations
  const isDevelopment = process.env.NODE_ENV === 'development';
  const corsOrigin = configService.get<string>('cors.origin');
  const corsCredentials = configService.get<boolean>('cors.credentials');

  if (isDevelopment) {
    // Development: Permissive CORS for testing
    app.enableCors({
      origin: (origin, callback) => {
        logger.debug(`CORS request from origin: ${origin}`);
        callback(null, true); // Allow all origins in development
      },
      credentials: corsCredentials ?? true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-Request-ID',
      ],
      exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    });
  } else {
    // Production: Restricted CORS
    const defaultOrigins = [
      'https://checkout.sgate.com',
      'https://dashboard.sgate.com',
      'https://sgate.com',
    ];
    const origins = corsOrigin
      ? corsOrigin.split(',').map((o) => o.trim())
      : defaultOrigins;
    app.enableCors({
      origin: origins,
      credentials: corsCredentials ?? true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'X-Request-ID',
      ],
      exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    });
  }

  // Security headers
  app.use((req: any, res: any, next: any) => {
    res.header('X-Frame-Options', 'DENY');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    if (!isDevelopment) {
      res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    next();
  });

  // Enhanced global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: !isDevelopment, // Hide validation details in production
      exceptionFactory: (errors) => {
        const formattedErrors = errors.map(error => ({
          field: error.property,
          message: Object.values(error.constraints || {}).join(', '),
          value: error.value,
        }));
        
        return new ValidationPipe().createExceptionFactory()(errors);
      },
    }),
  );

  // Enhanced Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('sGate API')
    .setDescription(`
      # sBTC Payment Gateway API
      
      A production-grade Stripe-like MVP for accepting sBTC payments on Stacks testnet.
      
      ## Authentication
      Use your API key in the Authorization header: \`Bearer sk_test_...\`
      
      ## Rate Limits
      - Payment Creation: 100 requests/hour per API key
      - Payment Retrieval: 1000 requests/hour per API key
      - Public Endpoints: 500 requests/hour per IP
      - General API: 200 requests/hour per IP
      
      ## Webhooks
      Webhook events are signed with HMAC SHA-256. Verify the \`X-sGate-Signature\` header.
      
      ## Error Handling
      All errors return a consistent format with:
      - \`error.type\`: Machine-readable error type
      - \`error.message\`: Human-readable description
      - \`request_id\`: Unique identifier for debugging
    `)
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('payment-intents', 'Create and manage payment intents')
    .addTag('merchants', 'Merchant management and dashboard APIs')
    .addTag('public', 'Public endpoints (no auth required)')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(port);
  
  logger.log(`🚀 sGate API is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/docs`);
  logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`🔧 Rate limiting: ${process.env.RATE_LIMIT_ENABLED !== 'false' ? 'enabled' : 'disabled'}`);
  logger.log(`🔒 Enhanced error handling and logging active`);
}

bootstrap().catch((error) => {
  console.error('💥 Failed to start sGate API:', error);
  process.exit(1);
});