import { CreatePaymentIntentDto, PaymentIntentResponseDto } from '@sgate/shared';

export interface DemoClientConfig {
  apiBaseUrl?: string;
}

export class SGateDemoClient {
  private apiBaseUrl: string;

  constructor(config: DemoClientConfig = {}) {
    this.apiBaseUrl = config.apiBaseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  }

  async createPaymentIntent(data: CreatePaymentIntentDto): Promise<PaymentIntentResponseDto> {
    const response = await fetch(`${this.apiBaseUrl}/v1/public/demo/payment_intents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}: Failed to create payment intent`);
    }

    return response.json();
  }

  async retrievePaymentIntent(id: string): Promise<PaymentIntentResponseDto> {
    const response = await fetch(`${this.apiBaseUrl}/v1/public/payment_intents/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}: Failed to retrieve payment intent`);
    }

    return response.json();
  }
}

// Export a global demo instance
export const sGateDemo = new SGateDemoClient();