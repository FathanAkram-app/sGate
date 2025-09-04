import axios from 'axios';
import { PaymentIntentResponseDto } from '@sgate/shared';
import { getAuthToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

// Create axios instance for authenticated requests
const apiClient = axios.create({
  baseURL: API_BASE,
});

// Add auth token from cookies to requests if available
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface DashboardStats {
  totalPayments: number;
  confirmedPayments: number;
  pendingPayments: number;
  totalVolume: number;
  last30Days: {
    payments: number;
    volume: number;
  };
}

export async function getPaymentIntent(id: string): Promise<PaymentIntentResponseDto | null> {
  try {
    // For checkout page, we'll use a public endpoint that doesn't require API key
    // In production, you might use client_secret for security
    const response = await axios.get(`${API_BASE}/v1/public/payment_intents/${id}`);
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

// Dashboard API functions
export const api = {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get('/v1/merchants/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Return mock data for now
      return {
        totalPayments: 0,
        confirmedPayments: 0,
        pendingPayments: 0,
        totalVolume: 0,
        last30Days: {
          payments: 0,
          volume: 0,
        },
      };
    }
  },

  async getRecentPayments(limit: number = 10): Promise<PaymentIntentResponseDto[]> {
    try {
      const response = await apiClient.get(`/v1/payment_intents?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch recent payments:', error);
      return [];
    }
  },

  async getApiKeys(): Promise<any[]> {
    try {
      const response = await apiClient.get('/v1/merchants/api-keys');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      return [];
    }
  },

  async createApiKey(data: { name: string; permissions?: string[]; expiresIn?: string | null }): Promise<any> {
    try {
      const response = await apiClient.post('/v1/merchants/api-keys', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create API key:', error);
      throw error;
    }
  },

  async revokeApiKey(id: string): Promise<void> {
    try {
      await apiClient.delete(`/v1/merchants/api-keys/${id}`);
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      throw error;
    }
  },
  async getWebhookEndpoints(): Promise<any[]> {
    try {
      const response = await apiClient.get('/v1/merchants/webhooks');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
      return [];
    }
  },

  async createWebhookEndpoint(url: string, events: string[]): Promise<void> {
    try {
      await apiClient.post('/v1/merchants/webhooks', { url, events });
    } catch (error) {
      console.error('Failed to create webhook endpoint:', error);
      throw error;
    }
  },

  async deleteWebhookEndpoint(id: string): Promise<void> {
    try {
      await apiClient.delete(`/v1/merchants/webhooks/${id}`);
    } catch (error) {
      console.error('Failed to delete webhook endpoint:', error);
      throw error;
    }
  },

  async updateWebhookEndpoint(id: string, data: any): Promise<void> {
    try {
      await apiClient.put(`/v1/merchants/webhooks/${id}`, data);
    } catch (error) {
      console.error('Failed to update webhook endpoint:', error);
      throw error;
    }
  },
};