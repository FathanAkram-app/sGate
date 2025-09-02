# @sgate/sdk

JavaScript/TypeScript SDK for sGate sBTC Payment Gateway. Accept sBTC payments with ease on your website or application.

## Installation

```bash
npm install @sgate/sdk
```

## Quick Start

```javascript
import { sGate } from '@sgate/sdk';

// Create a payment button
const paymentButton = sGate.PaymentButton('#payment-button', {
  apiKey: 'your_api_key',
  amount_sats: 100000, // 100,000 sats
  description: 'Premium Coffee',
  onSuccess: (paymentIntent) => {
    console.log('Payment successful!', paymentIntent);
  },
  onError: (error) => {
    console.error('Payment failed:', error);
  }
});
```

## Features

- 🚀 **Easy Integration** - Simple JavaScript API
- 💰 **Payment Buttons** - Ready-to-use payment components
- 📱 **Mobile Responsive** - Works on all devices
- 🔒 **Secure** - Built-in security best practices
- ⚡ **Real-time** - Instant payment status updates
- 🎨 **Customizable** - Flexible theming options

## Components

### Payment Button

Create a simple payment button:

```javascript
import { sGate } from '@sgate/sdk';

sGate.PaymentButton('#my-button', {
  apiKey: 'sk_test_...',
  amount_sats: 50000,
  description: 'Digital Product',
  theme: 'dark', // 'light', 'dark', 'minimal'
  size: 'medium', // 'small', 'medium', 'large'
  onSuccess: (paymentIntent) => {
    // Handle successful payment
    window.location.href = '/success';
  }
});
```

### Payment Form

Create a form with custom amount input:

```javascript
sGate.PaymentForm('#payment-form', {
  apiKey: 'sk_test_...',
  defaultAmount: 25000,
  onPaymentCreate: (paymentIntent) => {
    console.log('Payment created:', paymentIntent.id);
  }
});
```

### Payment Modal

Create a modal popup payment:

```javascript
const modal = sGate.PaymentModal({
  apiKey: 'sk_test_...',
  amount_sats: 75000,
  description: 'Premium Upgrade'
});

// Show modal when needed
document.getElementById('upgrade-btn').onclick = () => {
  modal.show();
};
```

## Advanced Usage

### Direct API Client

For more control, use the API client directly:

```javascript
import { SGateClient } from '@sgate/sdk';

const client = new SGateClient({
  apiKey: 'sk_test_...',
  apiBaseUrl: 'https://api.sgate.dev' // Optional
});

// Create payment intent
const paymentIntent = await client.createPaymentIntent({
  amount_sats: 100000,
  currency: 'sbtc',
  description: 'Custom Payment',
  success_url: 'https://mysite.com/success',
  cancel_url: 'https://mysite.com/cancel'
});

// Retrieve payment status
const status = await client.retrievePaymentIntent(paymentIntent.id);
```

### React Integration

The SDK works great with React:

```jsx
import { useEffect, useRef } from 'react';
import { sGate } from '@sgate/sdk';

function PaymentComponent() {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (buttonRef.current) {
      sGate.PaymentButton(buttonRef.current, {
        apiKey: process.env.REACT_APP_SGATE_API_KEY,
        amount_sats: 50000,
        description: 'React Payment',
        onSuccess: (pi) => console.log('Success!', pi)
      });
    }
  }, []);

  return <div ref={buttonRef}></div>;
}
```

## Configuration Options

### PaymentButton Config

```javascript
{
  apiKey: string;           // Your sGate API key
  amount_sats: number;      // Amount in satoshis
  currency?: 'sbtc';        // Currency (default: 'sbtc')
  description?: string;     // Payment description
  success_url?: string;     // Success redirect URL
  cancel_url?: string;      // Cancel redirect URL
  apiBaseUrl?: string;      // Custom API base URL
  theme?: 'light' | 'dark' | 'minimal';  // Button theme
  size?: 'small' | 'medium' | 'large';   // Button size
  onSuccess?: (paymentIntent) => void;    // Success callback
  onError?: (error) => void;              // Error callback
  onCancel?: () => void;                  // Cancel callback
}
```

## Testing

Use test API keys for development:

```javascript
// Test mode
const client = new SGateClient({
  apiKey: 'sk_test_...',  // Use test key
  apiBaseUrl: 'http://localhost:4000'  // Local development
});
```

## Support

- 📖 [Documentation](https://github.com/AOI-Foundation/sGate)
- 🐛 [Issue Tracker](https://github.com/AOI-Foundation/sGate/issues)
- 💬 [Discussions](https://github.com/AOI-Foundation/sGate/discussions)

## License

MIT License - see [LICENSE](LICENSE) file for details.