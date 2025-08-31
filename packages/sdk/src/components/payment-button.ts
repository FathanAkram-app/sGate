import { SGateClient } from '../client';
import { CreatePaymentIntentDto, PaymentIntentResponseDto } from '@sgate/shared';

export interface PaymentButtonConfig {
  apiKey: string;
  amount_sats: number;
  currency?: 'sbtc';
  description?: string;
  success_url?: string;
  cancel_url?: string;
  apiBaseUrl?: string;
  theme?: 'light' | 'dark' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  onSuccess?: (paymentIntent: PaymentIntentResponseDto) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

export class PaymentButton {
  private container: HTMLElement;
  private config: PaymentButtonConfig;
  private client: SGateClient;
  private button: HTMLButtonElement | null = null;

  constructor(container: HTMLElement, config: PaymentButtonConfig) {
    this.container = container;
    this.config = {
      currency: 'sbtc',
      theme: 'light',
      size: 'medium',
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
    const theme = this.getThemeStyles();
    const size = this.getSizeStyles();
    
    this.button = document.createElement('button');
    this.button.innerHTML = `
      <span class="sgate-button-content">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        Pay ${this.formatSats(this.config.amount_sats)} sats
      </span>
    `;

    Object.assign(this.button.style, {
      ...theme,
      ...size,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      textDecoration: 'none',
      userSelect: 'none',
    });

    this.button.addEventListener('click', this.handleClick.bind(this));
    this.button.addEventListener('mouseenter', this.handleHover.bind(this));
    this.button.addEventListener('mouseleave', this.handleHoverEnd.bind(this));

    this.container.appendChild(this.button);
  }

  private getThemeStyles() {
    switch (this.config.theme) {
      case 'dark':
        return {
          background: '#1a1a1a',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        };
      case 'minimal':
        return {
          background: 'transparent',
          color: '#FF6B35',
          border: '2px solid #FF6B35',
          boxShadow: 'none',
        };
      default: // light
        return {
          background: 'linear-gradient(135deg, #FF6B35 0%, #F7931A 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
        };
    }
  }

  private getSizeStyles() {
    switch (this.config.size) {
      case 'small':
        return {
          padding: '8px 16px',
          fontSize: '14px',
          minHeight: '36px',
        };
      case 'large':
        return {
          padding: '16px 32px',
          fontSize: '18px',
          minHeight: '56px',
        };
      default: // medium
        return {
          padding: '12px 24px',
          fontSize: '16px',
          minHeight: '44px',
        };
    }
  }

  private handleHover() {
    if (!this.button) return;
    
    const theme = this.config.theme;
    if (theme === 'minimal') {
      this.button.style.background = '#FF6B35';
      this.button.style.color = '#ffffff';
    } else {
      this.button.style.transform = 'translateY(-2px)';
      this.button.style.boxShadow = theme === 'dark' 
        ? '0 6px 16px rgba(0, 0, 0, 0.4)'
        : '0 6px 20px rgba(255, 107, 53, 0.4)';
    }
  }

  private handleHoverEnd() {
    if (!this.button) return;
    
    const theme = this.getThemeStyles();
    Object.assign(this.button.style, {
      ...theme,
      transform: 'translateY(0)',
    });
  }

  private async handleClick() {
    if (!this.button) return;
    
    try {
      this.setLoading(true);
      
      const paymentIntentData: CreatePaymentIntentDto = {
        amount_sats: this.config.amount_sats,
        currency: this.config.currency || 'sbtc',
        description: this.config.description,
        success_url: this.config.success_url,
        cancel_url: this.config.cancel_url,
      };

      const paymentIntent = await this.client.createPaymentIntent(paymentIntentData);
      
      // Open checkout in new window
      const checkoutWindow = window.open(
        paymentIntent.checkout_url,
        'sgate-checkout',
        'width=500,height=700,scrollbars=yes,resizable=yes'
      );

      if (checkoutWindow) {
        this.pollForCompletion(paymentIntent, checkoutWindow);
      } else {
        // Fallback to same window if popup blocked
        window.location.href = paymentIntent.checkout_url;
      }

    } catch (error) {
      this.handleError(error as Error);
    } finally {
      this.setLoading(false);
    }
  }

  private async pollForCompletion(paymentIntent: PaymentIntentResponseDto, checkoutWindow: Window) {
    const pollInterval = setInterval(async () => {
      try {
        if (checkoutWindow.closed) {
          clearInterval(pollInterval);
          if (this.config.onCancel) {
            this.config.onCancel();
          }
          return;
        }

        const updated = await this.client.getPaymentIntent(paymentIntent.id);
        
        if (updated.status === 'confirmed') {
          clearInterval(pollInterval);
          checkoutWindow.close();
          if (this.config.onSuccess) {
            this.config.onSuccess(updated);
          }
        } else if (updated.status === 'failed' || updated.status === 'expired') {
          clearInterval(pollInterval);
          checkoutWindow.close();
          this.handleError(new Error(`Payment ${updated.status}`));
        }
      } catch (error) {
        console.warn('Polling error:', error);
      }
    }, 2000);

    // Stop polling after 30 minutes
    setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000);
  }

  private setLoading(loading: boolean) {
    if (!this.button) return;
    
    if (loading) {
      this.button.disabled = true;
      this.button.innerHTML = `
        <span class="sgate-button-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px; animation: spin 1s linear infinite;">
            <path d="M12,4a8,8 0 0,1 7.89,6.7A1.53,1.53 0 0,0 21.38,12h0a1.5,1.5 0 0,0 1.48-1.75,11,11 0 0,0 -21.72,0A1.5,1.5 0 0,0 2.62,12h0a1.53,1.53 0 0,0 1.49-1.3A8,8 0 0,1 12,4Z"/>
          </svg>
          Processing...
        </span>
      `;
      
      // Add spinning animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    } else {
      this.button.disabled = false;
      this.button.innerHTML = `
        <span class="sgate-button-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Pay ${this.formatSats(this.config.amount_sats)} sats
        </span>
      `;
    }
  }

  private handleError(error: Error) {
    if (this.config.onError) {
      this.config.onError(error);
    } else {
      alert(`Payment error: ${error.message}`);
    }
  }

  private formatSats(sats: number): string {
    return sats.toLocaleString();
  }

  public updateAmount(amount_sats: number) {
    this.config.amount_sats = amount_sats;
    if (this.button && !this.button.disabled) {
      this.button.innerHTML = `
        <span class="sgate-button-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Pay ${this.formatSats(amount_sats)} sats
        </span>
      `;
    }
  }

  public destroy() {
    if (this.button && this.button.parentNode) {
      this.button.parentNode.removeChild(this.button);
    }
  }
}