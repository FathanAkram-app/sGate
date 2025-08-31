"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorResponseDto = exports.WebhookPayloadDto = exports.PaymentIntentResponseDto = exports.CreatePaymentIntentDto = void 0;
const zod_1 = require("zod");
const types_1 = require("./types");
exports.CreatePaymentIntentDto = zod_1.z.object({
    amount_sats: zod_1.z.number().int().positive(),
    currency: zod_1.z.literal('sbtc'),
    description: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    success_url: zod_1.z.string().url().optional(),
    cancel_url: zod_1.z.string().url().optional(),
    expires_in: zod_1.z.number().int().positive().default(900),
});
exports.PaymentIntentResponseDto = zod_1.z.object({
    id: zod_1.z.string(),
    client_secret: zod_1.z.string(),
    pay_address: zod_1.z.string(),
    amount_sats: zod_1.z.number(),
    currency: zod_1.z.literal('sbtc'),
    status: zod_1.z.nativeEnum(types_1.PaymentIntentStatus),
    description: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    expires_at: zod_1.z.string().datetime(),
    checkout_url: zod_1.z.string().url(),
    success_url: zod_1.z.string().url().optional(),
    cancel_url: zod_1.z.string().url().optional(),
    created_at: zod_1.z.string().datetime(),
});
exports.WebhookPayloadDto = zod_1.z.object({
    id: zod_1.z.string(),
    event: zod_1.z.string(),
    created: zod_1.z.number(),
    data: zod_1.z.object({
        object: zod_1.z.record(zod_1.z.any()),
    }),
});
exports.ErrorResponseDto = zod_1.z.object({
    error: zod_1.z.string(),
    message: zod_1.z.string(),
    statusCode: zod_1.z.number(),
});
//# sourceMappingURL=dto.js.map