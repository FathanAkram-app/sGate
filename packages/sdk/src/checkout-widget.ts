import { PaymentIntentResponseDto, PaymentIntentStatus } from '@sgate/shared';

export interface CheckoutWidgetConfig {
  clientSecret: string;
  apiBaseUrl?: string;
  onSuccess?: (paymentIntent: PaymentIntentResponseDto) => void;
  onError?: (error: Error) => void;
  theme?: 'light' | 'dark';
}

export class CheckoutWidget {
  private container: HTMLElement;
  private config: CheckoutWidgetConfig;
  private paymentIntent: PaymentIntentResponseDto | null = null;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(container: HTMLElement, config: CheckoutWidgetConfig) {
    this.container = container;
    this.config = {
      apiBaseUrl: 'http://localhost:4000',
      theme: 'light',
      ...config,
    };
    this.init();
  }

  private async init() {
    try {
      await this.fetchPaymentIntent();
      this.render();
      this.startPolling();
    } catch (error) {
      this.handleError(new Error('Failed to initialize checkout widget'));
    }
  }

  private async fetchPaymentIntent() {
    const piId = this.extractPaymentIntentId(this.config.clientSecret);
    const response = await fetch(`${this.config.apiBaseUrl}/public/payment_intents/${piId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch payment intent');
    }

    this.paymentIntent = await response.json();
  }

  private extractPaymentIntentId(clientSecret: string): string {
    return clientSecret.split('_secret_')[0];
  }

  private render() {
    if (!this.paymentIntent) return;

    const isDark = this.config.theme === 'dark';
    const bgColor = isDark ? '#1a1a1a' : '#ffffff';
    const textColor = isDark ? '#ffffff' : '#000000';
    const borderColor = isDark ? '#333333' : '#e5e5e5';

    this.container.innerHTML = `
      <div style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: ${bgColor};
        border: 1px solid ${borderColor};
        border-radius: 8px;
        padding: 24px;
        max-width: 400px;
        color: ${textColor};
      ">
        <div style="text-align: center; margin-bottom: 24px;">
          <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">
            Payment Required
          </h3>
          <div style="font-size: 24px; font-weight: bold; color: #FF6B35;">
            ${this.formatSats(this.paymentIntent.amount_sats)} sats
          </div>
          ${this.paymentIntent.description ? `
            <p style="margin: 8px 0 0 0; color: ${isDark ? '#cccccc' : '#666666'}; font-size: 14px;">
              ${this.paymentIntent.description}
            </p>
          ` : ''}
        </div>

        <div id="sgate-status" style="margin-bottom: 16px;">
          ${this.renderStatus()}
        </div>

        ${this.paymentIntent.status === PaymentIntentStatus.REQUIRES_PAYMENT ? `
          <div style="text-align: center; margin-bottom: 16px;">
            <div style="background: white; padding: 16px; border-radius: 8px; display: inline-block;">
              ${this.generateQRCode(this.paymentIntent.pay_address)}
            </div>
          </div>

          <div style="background: ${isDark ? '#2a2a2a' : '#f5f5f5'}; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
            <div style="font-size: 12px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
              Payment Address
            </div>
            <div style="font-family: monospace; font-size: 12px; word-break: break-all; background: ${isDark ? '#1a1a1a' : '#ffffff'}; padding: 8px; border-radius: 4px; border: 1px solid ${borderColor};">
              ${this.paymentIntent.pay_address}
            </div>
          </div>

          <div style="text-align: center;">
            <button 
              onclick="window.open('${this.paymentIntent.checkout_url}', '_blank')" 
              style="
                background: #FF6B35;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
              "
            >
              Open Full Checkout
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderStatus(): string {
    if (!this.paymentIntent) return '';

    const getStatusConfig = (status: PaymentIntentStatus) => {
      switch (status) {
        case PaymentIntentStatus.CONFIRMED:
          return { text: 'Payment Confirmed ✓', color: '#10B981', bg: '#D1FAE5' };
        case PaymentIntentStatus.PROCESSING:
          return { text: 'Processing Payment...', color: '#3B82F6', bg: '#DBEAFE' };
        case PaymentIntentStatus.REQUIRES_PAYMENT:
          return { text: 'Awaiting Payment', color: '#F59E0B', bg: '#FEF3C7' };
        case PaymentIntentStatus.FAILED:
          return { text: 'Payment Failed', color: '#EF4444', bg: '#FEE2E2' };
        case PaymentIntentStatus.EXPIRED:
          return { text: 'Payment Expired', color: '#6B7280', bg: '#F3F4F6' };
        default:
          return { text: 'Unknown Status', color: '#6B7280', bg: '#F3F4F6' };
      }
    };

    const config = getStatusConfig(this.paymentIntent.status);
    
    return `
      <div style="
        background: ${config.bg};
        color: ${config.color};
        padding: 8px 12px;
        border-radius: 6px;
        text-align: center;
        font-weight: 600;
        font-size: 14px;
      ">
        ${config.text}
      </div>
    `;
  }

  private generateQRCode(text: string): string {
    // Simple QR code placeholder - in production, you'd use a proper QR code library
    return `
      <div style="
        width: 120px;
        height: 120px;
        background: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        font-size: 12px;
        color: #666;
      ">
        QR Code<br/>
        (Use QR library)
      </div>
    `;
  }

  private formatSats(sats: number): string {
    return sats.toLocaleString();
  }

  private startPolling() {
    this.pollInterval = setInterval(async () => {
      try {
        await this.fetchPaymentIntent();
        this.updateStatus();
        
        if (this.paymentIntent?.status === PaymentIntentStatus.CONFIRMED) {
          this.handleSuccess();
          this.stopPolling();
        } else if (this.paymentIntent?.status === PaymentIntentStatus.FAILED) {
          this.stopPolling();
        }
      } catch (error) {
        console.warn('Failed to poll payment status:', error);
      }
    }, 5000);
  }

  private updateStatus() {
    const statusElement = this.container.querySelector('#sgate-status');
    if (statusElement) {
      statusElement.innerHTML = this.renderStatus();
    }
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private handleSuccess() {
    if (this.config.onSuccess && this.paymentIntent) {
      this.config.onSuccess(this.paymentIntent);
    }
  }

  private handleError(error: Error) {
    if (this.config.onError) {
      this.config.onError(error);
    }
  }

  public destroy() {
    this.stopPolling();
    this.container.innerHTML = '';
  }
}

// Global mount function for easy usage
export function mount(selector: string, config: CheckoutWidgetConfig): CheckoutWidget {
  const element = document.querySelector(selector) as HTMLElement;
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  return new CheckoutWidget(element, config);
}