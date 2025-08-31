import { PaymentForm, PaymentFormConfig } from './payment-form';
import { PaymentIntentResponseDto } from '@sgate/shared';

export interface PaymentModalConfig extends Omit<PaymentFormConfig, 'onSuccess'> {
  onSuccess?: (paymentIntent: PaymentIntentResponseDto) => void;
  onClose?: () => void;
  title?: string;
  closable?: boolean;
}

export class PaymentModal {
  private config: PaymentModalConfig;
  private overlay: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private paymentForm: PaymentForm | null = null;
  private isOpen = false;

  constructor(config: PaymentModalConfig) {
    this.config = {
      title: 'Complete Payment',
      closable: true,
      theme: 'light',
      ...config,
    };
  }

  public open() {
    if (this.isOpen) return;
    
    this.render();
    this.isOpen = true;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Add escape key listener
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Animate in
    requestAnimationFrame(() => {
      if (this.overlay) {
        this.overlay.style.opacity = '1';
      }
      if (this.modal) {
        this.modal.style.transform = 'translate(-50%, -50%) scale(1)';
        this.modal.style.opacity = '1';
      }
    });
  }

  public close() {
    if (!this.isOpen) return;
    
    // Animate out
    if (this.overlay) {
      this.overlay.style.opacity = '0';
    }
    if (this.modal) {
      this.modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
      this.modal.style.opacity = '0';
    }
    
    // Remove from DOM after animation
    setTimeout(() => {
      this.cleanup();
    }, 200);
    
    if (this.config.onClose) {
      this.config.onClose();
    }
  }

  private render() {
    const isDark = this.config.theme === 'dark';
    
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, ${isDark ? '0.8' : '0.5'});
      backdrop-filter: blur(4px);
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create modal container
    this.modal = document.createElement('div');
    this.modal.style.cssText = `
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      transform: translate(-50%, -50%) scale(0.95);
      opacity: 0;
      transition: all 0.2s ease;
      overflow: hidden;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: ${isDark ? '#1a1a1a' : '#ffffff'};
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, ${isDark ? '0.6' : '0.3'});
      overflow: hidden;
      position: relative;
    `;

    // Add header if title or closable
    if (this.config.title || this.config.closable) {
      const header = document.createElement('div');
      header.style.cssText = `
        padding: 20px 24px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid ${isDark ? '#333' : '#eee'};
        margin-bottom: 0;
      `;

      if (this.config.title) {
        const title = document.createElement('h2');
        title.textContent = this.config.title;
        title.style.cssText = `
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: ${isDark ? '#ffffff' : '#000000'};
        `;
        header.appendChild(title);
      }

      if (this.config.closable) {
        const closeButton = document.createElement('button');
        closeButton.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
        closeButton.style.cssText = `
          background: none;
          border: none;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          color: ${isDark ? '#cccccc' : '#666666'};
          transition: all 0.2s ease;
        `;
        
        closeButton.addEventListener('click', this.close.bind(this));
        closeButton.addEventListener('mouseenter', () => {
          closeButton.style.background = isDark ? '#333333' : '#f5f5f5';
        });
        closeButton.addEventListener('mouseleave', () => {
          closeButton.style.background = 'none';
        });
        
        header.appendChild(closeButton);
      }

      modalContent.appendChild(header);
    }

    // Create form container
    const formContainer = document.createElement('div');
    formContainer.style.padding = '24px';
    
    // Create payment form
    this.paymentForm = new PaymentForm(formContainer, {
      ...this.config,
      onSuccess: this.handleSuccess.bind(this),
      onError: this.handleError.bind(this),
    });

    modalContent.appendChild(formContainer);
    this.modal.appendChild(modalContent);
    this.overlay.appendChild(this.modal);

    // Add click outside to close
    if (this.config.closable) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }

    document.body.appendChild(this.overlay);
  }

  private handleSuccess(paymentIntent: PaymentIntentResponseDto) {
    // Show success state briefly before closing
    this.showSuccess(() => {
      setTimeout(() => {
        this.close();
        if (this.config.onSuccess) {
          this.config.onSuccess(paymentIntent);
        }
      }, 1500);
    });
  }

  private handleError(error: Error) {
    if (this.config.onError) {
      this.config.onError(error);
    }
    // Modal stays open on error so user can retry
  }

  private showSuccess(callback: () => void) {
    if (!this.modal) return;
    
    const successOverlay = document.createElement('div');
    successOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(16, 185, 129, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    `;

    successOverlay.innerHTML = `
      <div style="text-align: center; color: white;">
        <div style="
          width: 64px;
          height: 64px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          animation: successPulse 0.6s ease-out;
        ">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="3">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        </div>
        <h3 style="margin: 0 0 8px; font-size: 20px; font-weight: 600;">Payment Created!</h3>
        <p style="margin: 0; opacity: 0.9;">Redirecting to checkout...</p>
      </div>
    `;

    // Add success animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes successPulse {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.1); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    this.modal.appendChild(successOverlay);
    callback();
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.config.closable) {
      this.close();
    }
  }

  private cleanup() {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Cleanup payment form
    if (this.paymentForm) {
      this.paymentForm.destroy();
      this.paymentForm = null;
    }
    
    // Remove from DOM
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    
    this.overlay = null;
    this.modal = null;
    this.isOpen = false;
  }

  public destroy() {
    if (this.isOpen) {
      this.close();
    }
  }
}