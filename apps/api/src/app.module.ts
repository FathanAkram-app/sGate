import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import {
  MerchantEntity,
  PaymentIntentEntity,
  PaymentEntity,
  WebhookDeliveryEntity,
} from './entities';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { PaymentIntentsModule } from './modules/payment-intents/payment-intents.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { WatcherModule } from './modules/watcher/watcher.module';
import { AuthModule } from './modules/auth/auth.module';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'sgate',
        password: process.env.DB_PASSWORD || 'sgate',
        database: process.env.DB_NAME || 'sgate',
        entities: [MerchantEntity, PaymentIntentEntity, PaymentEntity, WebhookDeliveryEntity],
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    ScheduleModule.forRoot(),
    MerchantsModule,
    PaymentIntentsModule,
    WebhooksModule,
    WatcherModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply rate limiting to all routes except health check
    consumer
      .apply(RateLimitMiddleware)
      .exclude('health')
      .forRoutes('*');
  }
}