import { z } from 'zod';
import { PaymentIntentStatus } from './types';
export declare const CreatePaymentIntentDto: z.ZodObject<{
    amount_sats: z.ZodNumber;
    currency: z.ZodLiteral<"sbtc">;
    description: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    success_url: z.ZodOptional<z.ZodString>;
    cancel_url: z.ZodOptional<z.ZodString>;
    expires_in: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description?: string;
    amount_sats?: number;
    currency?: "sbtc";
    metadata?: Record<string, any>;
    success_url?: string;
    cancel_url?: string;
    expires_in?: number;
}, {
    description?: string;
    amount_sats?: number;
    currency?: "sbtc";
    metadata?: Record<string, any>;
    success_url?: string;
    cancel_url?: string;
    expires_in?: number;
}>;
export type CreatePaymentIntentDto = z.infer<typeof CreatePaymentIntentDto>;
export declare const PaymentIntentResponseDto: z.ZodObject<{
    id: z.ZodString;
    client_secret: z.ZodString;
    pay_address: z.ZodString;
    amount_sats: z.ZodNumber;
    currency: z.ZodLiteral<"sbtc">;
    status: z.ZodNativeEnum<typeof PaymentIntentStatus>;
    description: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    expires_at: z.ZodString;
    checkout_url: z.ZodString;
    success_url: z.ZodOptional<z.ZodString>;
    cancel_url: z.ZodOptional<z.ZodString>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    description?: string;
    amount_sats?: number;
    currency?: "sbtc";
    status?: PaymentIntentStatus;
    metadata?: Record<string, any>;
    success_url?: string;
    cancel_url?: string;
    id?: string;
    client_secret?: string;
    pay_address?: string;
    expires_at?: string;
    checkout_url?: string;
    created_at?: string;
}, {
    description?: string;
    amount_sats?: number;
    currency?: "sbtc";
    status?: PaymentIntentStatus;
    metadata?: Record<string, any>;
    success_url?: string;
    cancel_url?: string;
    id?: string;
    client_secret?: string;
    pay_address?: string;
    expires_at?: string;
    checkout_url?: string;
    created_at?: string;
}>;
export type PaymentIntentResponseDto = z.infer<typeof PaymentIntentResponseDto>;
export declare const WebhookPayloadDto: z.ZodObject<{
    id: z.ZodString;
    event: z.ZodString;
    created: z.ZodNumber;
    data: z.ZodObject<{
        object: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        object?: Record<string, any>;
    }, {
        object?: Record<string, any>;
    }>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    event?: string;
    created?: number;
    data?: {
        object?: Record<string, any>;
    };
}, {
    id?: string;
    event?: string;
    created?: number;
    data?: {
        object?: Record<string, any>;
    };
}>;
export type WebhookPayloadDto = z.infer<typeof WebhookPayloadDto>;
export declare const ErrorResponseDto: z.ZodObject<{
    error: z.ZodString;
    message: z.ZodString;
    statusCode: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    message?: string;
    error?: string;
    statusCode?: number;
}, {
    message?: string;
    error?: string;
    statusCode?: number;
}>;
export type ErrorResponseDto = z.infer<typeof ErrorResponseDto>;
