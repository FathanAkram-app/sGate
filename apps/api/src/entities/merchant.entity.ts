import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { PaymentIntentEntity } from './payment-intent.entity';
import { WebhookDeliveryEntity } from './webhook-delivery.entity';

@Entity('merchants')
export class MerchantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'api_key_hash' })
  @Index()
  apiKeyHash: string;

  @Column({ name: 'webhook_url', nullable: true })
  webhookUrl?: string;

  @Column({ name: 'webhook_secret', nullable: true })
  webhookSecret?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => PaymentIntentEntity, (pi) => pi.merchant)
  paymentIntents: PaymentIntentEntity[];

  @OneToMany(() => WebhookDeliveryEntity, (webhook) => webhook.merchant)
  webhooks: WebhookDeliveryEntity[];
}