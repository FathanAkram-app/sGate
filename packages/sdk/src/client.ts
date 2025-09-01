import { CreatePaymentIntentDto, PaymentIntentResponseDto } from '@sgate/shared';

export interface SGateClientConfig {
  apiKey: string;
  apiBaseUrl?: string;
}

export class SGateClient {
  private apiKey: string;
  private apiBaseUrl: string;

  constructor(config: SGateClientConfig) {
    this.apiKey = config.apiKey;
    this.apiBaseUrl = config.apiBaseUrl || 'http://localhost:4000';
  }

  async createPaymentIntent(data: CreatePaymentIntentDto): Promise<PaymentIntentResponseDto> {
    const response = await fetch(`${this.apiBaseUrl}/v1/payment_intents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment intent');
    }

    return response.json();
  }

  async retrievePaymentIntent(id: string): Promise<PaymentIntentResponseDto> {
    const response = await fetch(`${this.apiBaseUrl}/v1/payment_intents/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to retrieve payment intent');
    }

    return response.json();
  }

  // Alias for retrievePaymentIntent to match the error message
  async getPaymentIntent(id: string): Promise<PaymentIntentResponseDto> {
    return this.retrievePaymentIntent(id);
  }
}