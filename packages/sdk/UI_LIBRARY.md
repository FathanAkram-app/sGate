# sGate UI Library

A comprehensive, plug-and-play payment gateway UI library for sBTC payments on Stacks. Drop these components into any website to instantly accept sBTC payments.

## 🚀 Quick Start

### Installation

```bash
npm install @sgate/sdk
```

### CDN Usage

```html
<script src="https://unpkg.com/@sgate/sdk@latest/dist/index.js"></script>
```

## 📦 Components

### 1. Payment Button

A simple "Pay with sBTC" button that opens the checkout flow.

```html
<div id="payment-button"></div>

<script>
import { sGate } from '@sgate/sdk';

sGate.PaymentButton('#payment-button', {
  apiKey: 'sk_test_your_api_key',
  amount_sats: 100000,
  description: 'Premium Subscription',
  theme: 'light', // 'light' | 'dark' | 'minimal'
  size: 'medium', // 'small' | 'medium' | 'large'
  onSuccess: (paymentIntent) => {
    console.log('Payment successful!', paymentIntent);
  },
  onError: (error) => {
    console.error('Payment failed:', error);
  }
});
</script>
```

#### Themes

```javascript
// Light theme (default) - Orange gradient
theme: 'light'

// Dark theme - Dark background
theme: 'dark'

// Minimal theme - Transparent with border
theme: 'minimal'
```

### 2. Payment Form

A complete payment form with amount and description inputs.

```html
<div id="payment-form"></div>

<script>
sGate.PaymentForm('#payment-form', {
  apiKey: 'sk_test_your_api_key',
  theme: 'light', // 'light' | 'dark'
  showAmountField: true,
  showDescriptionField: true,
  defaultAmount: 50000,
  submitButtonText: 'Create Payment',
  onSuccess: (paymentIntent) => {
    // Handle successful payment creation
    window.open(paymentIntent.checkout_url, '_blank');
  },
  onError: (error) => {
    alert('Payment creation failed: ' + error.message);
  }
});
</script>
```

### 3. Payment Modal

A popup modal containing a payment form.

```html
<button id="open-payment-modal">Pay Now</button>

<script>
const modal = sGate.PaymentModal({
  apiKey: 'sk_test_your_api_key',
  title: 'Complete Payment',
  closable: true,
  theme: 'light',
  showAmountField: true,
  defaultAmount: 75000,
  onSuccess: (paymentIntent) => {
    alert('Payment created successfully!');
    window.open(paymentIntent.checkout_url, '_blank');
  },
  onClose: () => {
    console.log('Modal closed');
  }
});

document.getElementById('open-payment-modal').onclick = () => {
  modal.open();
};
</script>
```

### 4. Checkout Widget (Enhanced)

Embed a full checkout experience directly in your page.

```html
<div id="checkout-widget"></div>

<script>
sGate.CheckoutWidget('#checkout-widget', {
  clientSecret: 'pi_abc123_secret_xyz',
  theme: 'light', // 'light' | 'dark'
  onSuccess: (paymentIntent) => {
    alert('Payment confirmed!');
  },
  onError: (error) => {
    console.error('Checkout error:', error);
  }
});
</script>
```

## 🧩 Individual Elements

### QR Code Element

Display a payment QR code with address.

```html
<div id="qr-code"></div>

<script>
sGate.QRCode('#qr-code', {
  value: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  size: 200,
  theme: 'light',
  includeText: true
});
</script>
```

### Status Badge

Display payment status with appropriate styling.

```html
<div id="status-badge"></div>

<script>
sGate.StatusBadge('#status-badge', {
  status: 'confirmed', // 'pending' | 'processing' | 'confirmed' | 'failed' | 'expired'
  theme: 'light',
  size: 'medium'
});
</script>
```

### Amount Display

Formatted display of payment amounts.

```html
<div id="amount-display"></div>

<script>
sGate.AmountDisplay('#amount-display', {
  amount_sats: 150000,
  showUSD: true,
  theme: 'light',
  size: 'large'
});
</script>
```

## 🎨 Theming

All components support light and dark themes:

```javascript
// Light theme (default)
theme: 'light'

// Dark theme
theme: 'dark'
```

### Custom CSS Variables

You can override the default colors using CSS variables:

```css
:root {
  --sgate-primary: #FF6B35;
  --sgate-secondary: #F7931A;
  --sgate-success: #10B981;
  --sgate-error: #EF4444;
  --sgate-warning: #F59E0B;
}
```

## 📱 Responsive Design

All components are mobile-responsive and work seamlessly across devices:

- **Desktop**: Full-featured experience
- **Tablet**: Optimized layouts
- **Mobile**: Touch-friendly interfaces

## 🔧 Advanced Usage

### Class-based Components

For more control, use the component classes directly:

```javascript
import { PaymentButton, PaymentForm, PaymentModal } from '@sgate/sdk';

// Create payment button
const container = document.getElementById('my-button');
const button = new PaymentButton(container, {
  apiKey: 'sk_test_your_api_key',
  amount_sats: 100000,
  onSuccess: (paymentIntent) => {
    // Handle success
  }
});

// Update amount dynamically
button.updateAmount(150000);

// Cleanup when done
button.destroy();
```

### Event Handling

```javascript
sGate.PaymentButton('#btn', {
  apiKey: 'sk_test_your_api_key',
  amount_sats: 100000,
  onSuccess: (paymentIntent) => {
    // Payment intent created successfully
    console.log('Payment ID:', paymentIntent.id);
    console.log('Checkout URL:', paymentIntent.checkout_url);
  },
  onError: (error) => {
    // Handle errors (network, API, validation)
    console.error('Error:', error.message);
  },
  onCancel: () => {
    // User cancelled the payment (closed checkout window)
    console.log('Payment cancelled by user');
  }
});
```

## 🌟 Integration Examples

### E-commerce Product Page

```html
<!-- Product page -->
<div class="product">
  <h2>Premium Plan</h2>
  <div id="price-display"></div>
  <div id="payment-button"></div>
</div>

<script>
const price = 250000; // 250k sats

sGate.AmountDisplay('#price-display', {
  amount_sats: price,
  size: 'large'
});

sGate.PaymentButton('#payment-button', {
  apiKey: 'sk_test_your_api_key',
  amount_sats: price,
  description: 'Premium Plan Subscription',
  success_url: 'https://mysite.com/success',
  cancel_url: 'https://mysite.com/cancel'
});
</script>
```

### Donation Widget

```html
<!-- Donation form -->
<div id="donation-form"></div>

<script>
sGate.PaymentForm('#donation-form', {
  apiKey: 'sk_test_your_api_key',
  showAmountField: true,
  showDescriptionField: true,
  submitButtonText: 'Donate Now',
  onSuccess: (paymentIntent) => {
    window.location.href = paymentIntent.checkout_url;
  }
});
</script>
```

### Paywall Modal

```html
<button class="premium-feature" onclick="showPaywall()">
  Access Premium Content
</button>

<script>
const paywallModal = sGate.PaymentModal({
  apiKey: 'sk_test_your_api_key',
  title: 'Unlock Premium Content',
  showAmountField: false,
  defaultAmount: 10000, // 10k sats
  description: 'Premium article access',
  onSuccess: (paymentIntent) => {
    window.location.href = paymentIntent.checkout_url;
  }
});

function showPaywall() {
  paywallModal.open();
}
</script>
```

## 🔒 Security

- **API Keys**: Never expose secret keys in frontend code. Use publishable keys only.
- **Validation**: All inputs are validated on both client and server.
- **HTTPS**: Always serve over HTTPS in production.

## 📊 Analytics & Tracking

Track payment events for analytics:

```javascript
sGate.PaymentButton('#btn', {
  apiKey: 'sk_test_your_api_key',
  amount_sats: 100000,
  onSuccess: (paymentIntent) => {
    // Track successful payment creation
    gtag('event', 'payment_intent_created', {
      payment_id: paymentIntent.id,
      amount: paymentIntent.amount_sats,
      currency: 'sats'
    });
  },
  onError: (error) => {
    // Track payment errors
    gtag('event', 'payment_error', {
      error_message: error.message
    });
  }
});
```

## 🎯 Best Practices

1. **Progressive Enhancement**: Components gracefully degrade without JavaScript
2. **Accessibility**: All components include proper ARIA labels and keyboard navigation
3. **Performance**: Lazy loading and minimal bundle size
4. **Error Handling**: Comprehensive error messages and fallbacks
5. **Testing**: All components are thoroughly tested across browsers

## 🔄 Migration Guide

Upgrading from the basic checkout widget:

```javascript
// Before (v1)
import { mount } from '@sgate/sdk';
mount('#checkout', { clientSecret: 'pi_abc_secret_xyz' });

// After (v2) - Same functionality, enhanced features
import { sGate } from '@sgate/sdk';
sGate.CheckoutWidget('#checkout', { 
  clientSecret: 'pi_abc_secret_xyz',
  theme: 'light' // New theming options
});
```

## 📚 API Reference

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | required | Your sGate API key |
| `theme` | `'light' \| 'dark'` | `'light'` | UI theme |
| `apiBaseUrl` | string | `'http://localhost:4000'` | API endpoint |
| `onSuccess` | function | - | Success callback |
| `onError` | function | - | Error callback |
| `onCancel` | function | - | Cancel callback |

### Methods

All components expose these methods:

- `destroy()` - Clean up and remove component
- `update(options)` - Update component configuration

---

Built with ❤️ for the Stacks ecosystem. [GitHub](https://github.com/your-org/sgate) • [Documentation](https://docs.sgate.dev)