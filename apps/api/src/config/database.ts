import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  MerchantEntity,
  PaymentIntentEntity,
  PaymentEntity,
  WebhookDeliveryEntity,
} from '../entities';

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '9020', 10),
  username: process.env.DB_USERNAME || 'sgate',
  password: process.env.DB_PASSWORD || 'sgate',
  database: process.env.DB_NAME || 'sgate',
  entities: [MerchantEntity, PaymentIntentEntity, PaymentEntity, WebhookDeliveryEntity],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});