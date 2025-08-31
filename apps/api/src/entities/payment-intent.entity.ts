import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { PaymentIntentStatus } from '@sgate/shared';
import { MerchantEntity } from './merchant.entity';
import { PaymentEntity } from './payment.entity';

@Entity('payment_intents')
export class PaymentIntentEntity {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'merchant_id' })
  @Index()
  merchantId: string;

  @Column({ name: 'amount_sats', type: 'bigint' })
  amountSats: string;

  @Column({ default: 'sbtc' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentIntentStatus,
    default: PaymentIntentStatus.REQUIRES_PAYMENT,
  })
  @Index()
  status: PaymentIntentStatus;

  @Column({ name: 'client_secret' })
  clientSecret: string;

  @Column({ name: 'pay_address' })
  payAddress: string;

  @Column({ name: 'memo_hex' })
  @Index()
  memoHex: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'success_url', nullable: true })
  successUrl?: string;

  @Column({ name: 'cancel_url', nullable: true })
  cancelUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => MerchantEntity, (merchant) => merchant.paymentIntents)
  @JoinColumn({ name: 'merchant_id' })
  merchant: MerchantEntity;

  @OneToMany(() => PaymentEntity, (payment) => payment.paymentIntent)
  payments: PaymentEntity[];
}