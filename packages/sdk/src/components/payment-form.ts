import { SGateClient } from '../client';
import { CreatePaymentIntentDto, PaymentIntentResponseDto } from '@sgate/shared';

export interface PaymentFormConfig {
  apiKey: string;
  currency?: 'sbtc';
  success_url?: string;
  cancel_url?: string;
  apiBaseUrl?: string;
  theme?: 'light' | 'dark';
  showAmountField?: boolean;
  defaultAmount?: number;
  showDescriptionField?: boolean;
  submitButtonText?: string;
  onSuccess?: (paymentIntent: PaymentIntentResponseDto) => void;
  onError?: (error: Error) => void;
}

export class PaymentForm {
  private container: HTMLElement;
  private config: PaymentFormConfig;
  private client: SGateClient;
  private form: HTMLFormElement | null = null;

  constructor(container: HTMLElement, config: PaymentFormConfig) {
    this.container = container;
    this.config = {
      currency: 'sbtc',
      theme: 'light',
      showAmountField: true,
      showDescriptionField: true,
      submitButtonText: 'Create Payment',
      apiBaseUrl: 'http://localhost:4001',
      ...config,
    };
    
    this.client = new SGateClient({
      apiKey: this.config.apiKey,
      apiBaseUrl: this.config.apiBaseUrl,
    });

    this.render();
  }

  private render() {
    const isDark = this.config.theme === 'dark';
    const bgColor = isDark ? '#1a1a1a' : '#ffffff';
    const textColor = isDark ? '#ffffff' : '#000000';
    const inputBg = isDark ? '#2a2a2a' : '#ffffff';
    const borderColor = isDark ? '#404040' : '#e5e5e5';
    const labelColor = isDark ? '#cccccc' : '#666666';

    this.form = document.createElement('form');
    this.form.innerHTML = `
      <div class="sgate-form-container" style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: ${bgColor};
        border: 1px solid ${borderColor};
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        color: ${textColor};
        box-shadow: 0 4px 16px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'});
      ">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #FF6B35 0%, #F7931A 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 12px;
          ">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h3 style="margin: 0; font-size: 20px; font-weight: 600;">
            sBTC Payment
          </h3>
          <p style="margin: 8px 0 0 0; color: ${labelColor}; font-size: 14px;">
            Secure payment on Stacks testnet
          </p>
        </div>

        ${this.config.showAmountField ? `
          <div class="sgate-field" style="margin-bottom: 20px;">
            <label for="sgate-amount" style="
              display: block;
              font-size: 14px;
              font-weight: 600;
              color: ${labelColor};
              margin-bottom: 6px;
            ">
              Amount (sats) *
            </label>
            <input
              type="number"
              id="sgate-amount"
              name="amount"
              min="1"
              step="1"
              value="${this.config.defaultAmount || ''}"
              placeholder="Enter amount in satoshis"
              required
              style="
                width: 100%;
                padding: 12px;
                border: 1px solid ${borderColor};
                border-radius: 8px;
                font-size: 16px;
                background: ${inputBg};
                color: ${textColor};
                box-sizing: border-box;
                transition: border-color 0.2s ease;
              "
            />
          </div>
        ` : `
          <input type="hidden" name="amount" value="${this.config.defaultAmount || 0}" />
        `}

        ${this.config.showDescriptionField ? `
          <div class="sgate-field" style="margin-bottom: 20px;">
            <label for="sgate-description" style="
              display: block;
              font-size: 14px;
              font-weight: 600;
              color: ${labelColor};
              margin-bottom: 6px;
            ">
              Description (optional)
            </label>
            <input
              type="text"
              id="sgate-description"
              name="description"
              placeholder="Payment description"
              style="
                width: 100%;
                padding: 12px;
                border: 1px solid ${borderColor};
                border-radius: 8px;
                font-size: 16px;
                background: ${inputBg};
                color: ${textColor};
                box-sizing: border-box;
                transition: border-color 0.2s ease;
              "
            />
          </div>
        ` : ''}

        <button
          type="submit"
          class="sgate-submit-btn"
          style="
            width: 100%;
            background: linear-gradient(135deg, #FF6B35 0%, #F7931A 100%);
            color: white;
            border: none;
            padding: 14px 20px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          "
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          ${this.config.submitButtonText}
        </button>

        <div class="sgate-powered-by" style="
          text-align: center;
          margin-top: 16px;
          font-size: 12px;
          color: ${labelColor};
        ">
          Powered by <strong>sGate</strong>
        </div>
      </div>
    `;

    // Add focus styles
    const style = document.createElement('style');
    style.textContent = `
      .sgate-form-container input:focus {
        outline: none;
        border-color: #FF6B35 !important;
        box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1) !important;
      }
      
      .sgate-submit-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3);
      }
      
      .sgate-submit-btn:active {
        transform: translateY(0);
      }
      
      .sgate-submit-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none !important;
      }
    `;
    document.head.appendChild(style);

    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    this.container.appendChild(this.form);
  }

  private async handleSubmit(event: Event) {
    event.preventDefault();
    
    if (!this.form) return;

    const submitButton = this.form.querySelector('.sgate-submit-btn') as HTMLButtonElement;
    const formData = new FormData(this.form);
    
    const amount = parseInt(formData.get('amount') as string);
    const description = formData.get('description') as string;

    if (!amount || amount < 1) {
      this.showError('Please enter a valid amount');
      return;
    }

    try {
      this.setLoading(true);

      const paymentIntentData: CreatePaymentIntentDto = {
        amount_sats: amount,
        currency: this.config.currency || 'sbtc',
        description: description || undefined,
        success_url: this.config.success_url,
        cancel_url: this.config.cancel_url,
      };

      const paymentIntent = await this.client.createPaymentIntent(paymentIntentData);
      
      if (this.config.onSuccess) {
        this.config.onSuccess(paymentIntent);
      } else {
        // Default behavior: open checkout
        window.open(paymentIntent.checkout_url, '_blank');
      }

    } catch (error) {
      this.handleError(error as Error);
    } finally {
      this.setLoading(false);
    }
  }

  private setLoading(loading: boolean) {
    if (!this.form) return;
    
    const submitButton = this.form.querySelector('.sgate-submit-btn') as HTMLButtonElement;
    const inputs = this.form.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    
    if (loading) {
      submitButton.disabled = true;
      submitButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="animation: spin 1s linear infinite;">
          <path d="M12,4a8,8 0 0,1 7.89,6.7A1.53,1.53 0 0,0 21.38,12h0a1.5,1.5 0 0,0 1.48-1.75,11,11 0 0,0 -21.72,0A1.5,1.5 0 0,0 2.62,12h0a1.53,1.53 0 0,0 1.49-1.3A8,8 0 0,1 12,4Z"/>
        </svg>
        Creating Payment...
      `;
      
      inputs.forEach(input => input.disabled = true);
      
      // Add spinning animation if not exists
      if (!document.querySelector('#sgate-spin-animation')) {
        const style = document.createElement('style');
        style.id = 'sgate-spin-animation';
        style.textContent = `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      submitButton.disabled = false;
      submitButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        ${this.config.submitButtonText}
      `;
      
      inputs.forEach(input => input.disabled = false);
    }
  }

  private showError(message: string) {
    if (!this.form) return;
    
    // Remove existing error
    const existingError = this.form.querySelector('.sgate-error');
    if (existingError) {
      existingError.remove();
    }

    // Create error element
    const errorEl = document.createElement('div');
    errorEl.className = 'sgate-error';
    errorEl.style.cssText = `
      background: #FEE2E2;
      color: #DC2626;
      border: 1px solid #FECACA;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
      font-weight: 500;
    `;
    errorEl.textContent = message;

    const submitButton = this.form.querySelector('.sgate-submit-btn');
    if (submitButton) {
      this.form.insertBefore(errorEl, submitButton);
    }

    // Remove error after 5 seconds
    setTimeout(() => {
      if (errorEl.parentNode) {
        errorEl.parentNode.removeChild(errorEl);
      }
    }, 5000);
  }

  private handleError(error: Error) {
    if (this.config.onError) {
      this.config.onError(error);
    } else {
      this.showError(error.message || 'Payment creation failed');
    }
  }

  public destroy() {
    if (this.form && this.form.parentNode) {
      this.form.parentNode.removeChild(this.form);
    }
  }
}