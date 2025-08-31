import { z } from 'zod';
import { PaymentIntentStatus } from './types';

export const CreatePaymentIntentDto = z.object({
  amount_sats: z.number().int().positive(),
  currency: z.literal('sbtc'),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
  expires_in: z.number().int().positive().default(900), // 15 minutes
});

export type CreatePaymentIntentDto = z.infer<typeof CreatePaymentIntentDto>;

export const PaymentIntentResponseDto = z.object({
  id: z.string(),
  client_secret: z.string(),
  pay_address: z.string(),
  amount_sats: z.number(),
  currency: z.literal('sbtc'),
  status: z.nativeEnum(PaymentIntentStatus),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  expires_at: z.string().datetime(),
  checkout_url: z.string().url(),
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
  created_at: z.string().datetime(),
});

export type PaymentIntentResponseDto = z.infer<typeof PaymentIntentResponseDto>;

export const WebhookPayloadDto = z.object({
  id: z.string(),
  event: z.string(),
  created: z.number(),
  data: z.object({
    object: z.record(z.any()),
  }),
});

export type WebhookPayloadDto = z.infer<typeof WebhookPayloadDto>;

export const ErrorResponseDto = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
});

export type ErrorResponseDto = z.infer<typeof ErrorResponseDto>;