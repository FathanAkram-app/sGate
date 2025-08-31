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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => MerchantEntity, (merchant) => merchant.webhooks)
  @JoinColumn({ name: 'merchant_id' })
  merchant: MerchantEntity;
}