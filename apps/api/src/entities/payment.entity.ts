import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PaymentStatus } from '@sgate/shared';
import { PaymentIntentEntity } from './payment-intent.entity';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_intent_id' })
  paymentIntentId: string;

  @Column({ name: 'tx_id' })
  @Index()
  txId: string;

  @Column({ name: 'amount_sats', type: 'bigint' })
  amountSats: string;

  @Column({ default: 0 })
  confirmations: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.SEEN,
  })
  status: PaymentStatus;

  @Column({ name: 'raw_tx', type: 'jsonb', nullable: true })
  rawTx?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => PaymentIntentEntity, (pi) => pi.payments)
  @JoinColumn({ name: 'payment_intent_id' })
  paymentIntent: PaymentIntentEntity;
}