import * as crypto from 'crypto';

export function generateId(prefix: string): string {
  const randomBytes = crypto.randomBytes(12);
  const id = randomBytes.toString('hex');
  return `${prefix}_${id}`;
}

export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(32);
  return `sk_test_${randomBytes.toString('hex')}`;
}

export function generateClientSecret(paymentIntentId: string): string {
  const randomBytes = crypto.randomBytes(16);
  return `${paymentIntentId}_secret_${randomBytes.toString('hex')}`;
}

export function hashApiKey(apiKey: string, salt: string): string {
  return crypto.pbkdf2Sync(apiKey, salt, 10000, 64, 'sha512').toString('hex');
}

export function verifyApiKey(apiKey: string, hash: string, salt: string): boolean {
  const hashedInput = hashApiKey(apiKey, salt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hashedInput));
}

export function encodePaymentIntentMemo(paymentIntentId: string): string {
  // Encode PI ID as hex for memo field
  return Buffer.from(paymentIntentId, 'utf8').toString('hex');
}

export function decodePaymentIntentMemo(memoHex: string): string | null {
  try {
    return Buffer.from(memoHex, 'hex').toString('utf8');
  } catch {
    return null;
  }
}

export function signWebhookPayload(payload: string, secret: string, timestamp: number): string {
  const payloadToSign = `${timestamp}.${payload}`;
  const signature = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  tolerance: number = 300 // 5 minutes
): boolean {
  try {
    const parts = signature.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));

    if (!timestampPart || !signaturePart) {
      return false;
    }

    const timestamp = parseInt(timestampPart.split('=')[1], 10);
    const providedSignature = signaturePart.split('=')[1];
    
    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) {
      return false;
    }

    // Verify signature
    const payloadToSign = `${timestamp}.${payload}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');
    
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature));
  } catch {
    return false;
  }
}

export function satsToUsd(sats: bigint, usdPerBtc: number): number {
  const btc = Number(sats) / 100_000_000;
  return btc * usdPerBtc;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function exponentialBackoff(attempt: number, baseDelay: number = 1000, maxDelay: number = 30000): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  return delay + Math.random() * 1000; // Add jitter
}