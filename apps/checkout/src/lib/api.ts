import axios from 'axios';
import { PaymentIntentResponseDto } from '@sgate/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';

export async function getPaymentIntent(id: string): Promise<PaymentIntentResponseDto | null> {
  try {
    // For checkout page, we'll use a public endpoint that doesn't require API key
    // In production, you might use client_secret for security
    const response = await axios.get(`${API_BASE}/public/payment_intents/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch payment intent:', error);
    return null;
  }
}

export function formatSats(sats: number): string {
  return sats.toLocaleString();
}

export function satsToUsd(sats: number, usdPerBtc: number = 65000): number {
  const btc = sats / 100_000_000;
  return btc * usdPerBtc;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}