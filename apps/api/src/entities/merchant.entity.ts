import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { IsString, IsOptional, IsUrl, Length, Matches } from 'class-validator';
import { PaymentIntentEntity } from './payment-intent.entity';
import { WebhookDeliveryEntity } from './webhook-delivery.entity';

@Entity('merchants')
export class MerchantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  @IsString()
  @Length(1, 255)
  name: string;

  @Column({ name: 'api_key_hash', length: 128, unique: true })
  @Index()
  @IsString()
  @Length(128, 128)
  @Matches(/^[a-f0-9]{128}$/, { message: 'API key hash must be 128 character hex string' })
  apiKeyHash: string;

  @Column({ name: 'webhook_url', nullable: true, length: 512 })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true }, { 
    message: 'Webhook URL must be a valid HTTPS URL' 
  })
  @Length(1, 512)
  webhookUrl?: string;

  @Column({ name: 'webhook_secret', nullable: true, length: 128 })
  @IsOptional()
  @IsString()
  @Length(32, 128, { message: 'Webhook secret must be between 32 and 128 characters' })
  webhookSecret?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => PaymentIntentEntity, (pi) => pi.merchant)
  paymentIntents: PaymentIntentEntity[];

  @OneToMany(() => WebhookDeliveryEntity, (webhook) => webhook.merchant)
  webhooks: WebhookDeliveryEntity[];
}