import { z } from 'zod';

export enum PaymentIntentStatus {
  REQUIRES_PAYMENT = 'requires_payment',
  PROCESSING = 'processing',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export enum PaymentStatus {
  SEEN = 'seen',
  CONFIRMED = 'confirmed',
  REORGED = 'reorged',
}

export enum WebhookEventType {
  PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED = 'payment_intent.failed',
  PAYMENT_INTENT_EXPIRED = 'payment_intent.expired',
}

export interface Merchant {
  id: string;
  name: string;
  apiKeyHash: string;
  webhookUrl?: string;
  webhookSecret?: string;
  createdAt: Date;
}

export interface PaymentIntent {
  id: string;
  merchantId: string;
  amountSats: bigint;
  currency: 'sbtc';
  status: PaymentIntentStatus;
  clientSecret: string;
  payAddress: string;
  memoHex: string;
  expiresAt: Date;
  metadata?: Record<string, any>;
  description?: string;
  successUrl?: string;
  cancelUrl?: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  paymentIntentId: string;
  txId: string;
  amountSats: bigint;
  confirmations: number;
  status: PaymentStatus;
  rawTx?: Record<string, any>;
  createdAt: Date;
}

export interface WebhookDelivery {
  id: string;
  merchantId: string;
  event: WebhookEventType;
  payloadJson: Record<string, any>;
  delivered: boolean;
  attempts: number;
  lastError?: string;
  createdAt: Date;
}