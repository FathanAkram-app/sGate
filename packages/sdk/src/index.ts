// Core client
export { SGateClient } from './client';
export type { SGateClientConfig } from './client';

// Checkout widget (existing)
export { CheckoutWidget, mount } from './checkout-widget';
export type { CheckoutWidgetConfig } from './checkout-widget';

// New UI components
export { PaymentButton } from './components/payment-button';
export type { PaymentButtonConfig } from './components/payment-button';

export { PaymentForm } from './components/payment-form';
export type { PaymentFormConfig } from './components/payment-form';

export { PaymentModal } from './components/payment-modal';
export type { PaymentModalConfig } from './components/payment-modal';

export { 
  QRCodeElement, 
  StatusBadge, 
  AmountDisplay, 
  Elements 
} from './components/elements';
export type { 
  QRCodeOptions, 
  StatusBadgeOptions, 
  AmountDisplayOptions 
} from './components/elements';

// Import types for convenience functions
import type { PaymentButtonConfig } from './components/payment-button';
import type { PaymentFormConfig } from './components/payment-form';
import type { PaymentModalConfig } from './components/payment-modal';
import type { CheckoutWidgetConfig } from './checkout-widget';
import type { QRCodeOptions, StatusBadgeOptions, AmountDisplayOptions } from './components/elements';
import { PaymentButton } from './components/payment-button';
import { PaymentForm } from './components/payment-form';
import { PaymentModal } from './components/payment-modal';
import { CheckoutWidget } from './checkout-widget';
import { Elements } from './components/elements';

// Convenience mounting functions
export const sGate = {
  // Quick component creators
  PaymentButton: (selector: string, config: PaymentButtonConfig) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) throw new Error(`Element not found: ${selector}`);
    return new PaymentButton(element, config);
  },
  
  PaymentForm: (selector: string, config: PaymentFormConfig) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) throw new Error(`Element not found: ${selector}`);
    return new PaymentForm(element, config);
  },
  
  PaymentModal: (config: PaymentModalConfig) => {
    return new PaymentModal(config);
  },
  
  CheckoutWidget: (selector: string, config: CheckoutWidgetConfig) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) throw new Error(`Element not found: ${selector}`);
    return new CheckoutWidget(element, config);
  },
  
  // Element creators
  QRCode: (selector: string, options: QRCodeOptions) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) throw new Error(`Element not found: ${selector}`);
    return Elements.QRCode(element, options);
  },
  
  StatusBadge: (selector: string, options: StatusBadgeOptions) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) throw new Error(`Element not found: ${selector}`);
    return Elements.StatusBadge(element, options);
  },
  
  AmountDisplay: (selector: string, options: AmountDisplayOptions) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) throw new Error(`Element not found: ${selector}`);
    return Elements.AmountDisplay(element, options);
  },
};

// Re-export shared types for convenience
export * from '@sgate/shared';