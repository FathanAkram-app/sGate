"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.generateApiKey = generateApiKey;
exports.generateClientSecret = generateClientSecret;
exports.hashApiKey = hashApiKey;
exports.verifyApiKey = verifyApiKey;
exports.encodePaymentIntentMemo = encodePaymentIntentMemo;
exports.decodePaymentIntentMemo = decodePaymentIntentMemo;
exports.signWebhookPayload = signWebhookPayload;
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.satsToUsd = satsToUsd;
exports.sleep = sleep;
exports.exponentialBackoff = exponentialBackoff;
const crypto = require("crypto");
function generateId(prefix) {
    const randomBytes = crypto.randomBytes(12);
    const id = randomBytes.toString('hex');
    return `${prefix}_${id}`;
}
function generateApiKey() {
    const randomBytes = crypto.randomBytes(32);
    return `sk_test_${randomBytes.toString('hex')}`;
}
function generateClientSecret(paymentIntentId) {
    const randomBytes = crypto.randomBytes(16);
    return `${paymentIntentId}_secret_${randomBytes.toString('hex')}`;
}
function hashApiKey(apiKey, salt) {
    return crypto.pbkdf2Sync(apiKey, salt, 10000, 64, 'sha512').toString('hex');
}
function verifyApiKey(apiKey, hash, salt) {
    const hashedInput = hashApiKey(apiKey, salt);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hashedInput));
}
function encodePaymentIntentMemo(paymentIntentId) {
    return Buffer.from(paymentIntentId, 'utf8').toString('hex');
}
function decodePaymentIntentMemo(memoHex) {
    try {
        return Buffer.from(memoHex, 'hex').toString('utf8');
    }
    catch {
        return null;
    }
}
function signWebhookPayload(payload, secret, timestamp) {
    const payloadToSign = `${timestamp}.${payload}`;
    const signature = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');
    return `t=${timestamp},v1=${signature}`;
}
function verifyWebhookSignature(payload, signature, secret, tolerance = 300) {
    try {
        const parts = signature.split(',');
        const timestampPart = parts.find(p => p.startsWith('t='));
        const signaturePart = parts.find(p => p.startsWith('v1='));
        if (!timestampPart || !signaturePart) {
            return false;
        }
        const timestamp = parseInt(timestampPart.split('=')[1], 10);
        const providedSignature = signaturePart.split('=')[1];
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - timestamp) > tolerance) {
            return false;
        }
        const payloadToSign = `${timestamp}.${payload}`;
        const expectedSignature = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature));
    }
    catch {
        return false;
    }
}
function satsToUsd(sats, usdPerBtc) {
    const btc = Number(sats) / 100000000;
    return btc * usdPerBtc;
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function exponentialBackoff(attempt, baseDelay = 1000, maxDelay = 30000) {
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    return delay + Math.random() * 1000;
}
//# sourceMappingURL=utils.js.map