import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WebhookEventType } from '@sgate/shared';
import { MerchantEntity } from './merchant.entity';

@Entity('webhook_deliveries')
export class WebhookDeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  @Index()
  merchantId: string;

  @Column({
    type: 'enum',
    enum: WebhookEventType,
  })
  event: WebhookEventType;

  @Column({ name: 'payload_json', type: 'jsonb' })
  payloadJson: Record<string, any>;

  @Column({ default: false })
  delivered: boolean;

  @Column({ default: 0 })
  attempts: number;

  @Column({ name: 'last_error', nullable: true })
  lastError?: string;

  @Column({ default: false })
  failed: boolean;

  @Column({ name: 'failed_at', nullable: true })
  failedAt?: Date;

  @Column({ name: 'last_attempt', nullable: true })
  lastAttempt?: Date;

  @Column({ name: 'response_status', nullable: true })
  responseStatus?: number;

  @Column({ name: 'response_headers', nullable: true })
  responseHeaders?: string;

  @Column({ name: 'response_body', nullable: true })
  responseBody?: string;

  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => MerchantEntity, (merchant) => merchant.webhooks)
  @JoinColumn({ name: 'merchant_id' })
  merchant: MerchantEntity;
}