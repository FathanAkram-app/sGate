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
import { IsString, IsOptional, IsEnum, IsDateString, IsPositive, Length, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentIntentStatus } from '@sgate/shared';
import { MerchantEntity } from './merchant.entity';
import { PaymentEntity } from './payment.entity';

@Entity('payment_intents')
export class PaymentIntentEntity {
  @PrimaryColumn({ length: 32 })
  @IsString()
  @Length(32, 32)
  @Matches(/^pi_[a-zA-Z0-9]{29}$/, { message: 'Payment intent ID must match format pi_XXXXXXXXX' })
  id: string;

  @Column({ name: 'merchant_id' })
  @Index()
  @IsString()
  merchantId: string;

  @Column({ name: 'amount_sats', type: 'bigint' })
  @IsString()
  @Matches(/^[1-9]\d*$/, { message: 'Amount must be a positive integer string' })
  amountSats: string;

  @Column({ length: 10, default: 'sbtc' })
  @IsString()
  @Matches(/^sbtc$/, { message: 'Currency must be sbtc' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentIntentStatus,
    default: PaymentIntentStatus.REQUIRES_PAYMENT,
  })
  @Index()
  @IsEnum(PaymentIntentStatus)
  status: PaymentIntentStatus;

  @Column({ name: 'client_secret', length: 64 })
  @IsString()
  @Length(64, 64)
  @Matches(/^pi_[a-zA-Z0-9]{29}_secret_[a-zA-Z0-9]{24}$/, { 
    message: 'Client secret must match format pi_XXXXX_secret_XXXXX' 
  })
  clientSecret: string;

  @Column({ name: 'pay_address', length: 64 })
  @IsString()
  @Length(1, 64)
  @Matches(/^[ST][0-9A-Z]{39}$/, { message: 'Pay address must be valid Stacks address' })
  payAddress: string;

  @Column({ name: 'memo_hex', length: 64, unique: true })
  @Index()
  @IsString()
  @Length(1, 64)
  @Matches(/^[a-f0-9]+$/, { message: 'Memo hex must contain only lowercase hex characters' })
  memoHex: string;

  @Column({ name: 'expires_at' })
  @Type(() => Date)
  expiresAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;

  @Column({ nullable: true, length: 500 })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @Column({ name: 'success_url', nullable: true, length: 512 })
  @IsOptional()
  @IsString()
  @Length(1, 512)
  successUrl?: string;

  @Column({ name: 'cancel_url', nullable: true, length: 512 })
  @IsOptional()
  @IsString()
  @Length(1, 512)
  cancelUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => MerchantEntity, (merchant) => merchant.paymentIntents)
  @JoinColumn({ name: 'merchant_id' })
  merchant: MerchantEntity;

  @OneToMany(() => PaymentEntity, (payment) => payment.paymentIntent)
  payments: PaymentEntity[];
}