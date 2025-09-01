# sGate Test App

A simple test application to demonstrate the sGate Payment Gateway integration capabilities.

## Features

### 🧪 Test Components

- **Simple Payment Button** - Fixed amount payment button
- **Payment Form** - Custom amount input with description
- **Payment Modal** - Modal popup payments (demo opens in new tab)
- **Donation Widget** - Flexible donation amounts
- **E-commerce Item** - Product purchase simulation
- **Subscription Service** - Monthly subscription example

### 🔧 Direct API Testing

- Create payment intents with custom amounts
- Retrieve payment intent status
- View raw API responses
- Real-time event logging

### 📊 Event Monitoring

- Real-time event log showing all SDK interactions
- Success/error status tracking
- API response inspection
- Clear log functionality

## Quick Start

### Prerequisites

Make sure the following services are running:

1. **sGate API Server**: `http://localhost:4003`
2. **sGate Checkout**: `http://localhost:3000` (optional, for checkout pages)

### Installation

```bash
cd test-app
npm install
```

### Running the Test App

```bash
npm start
```

The test app will be available at: **http://localhost:8080**

### Success Page

After completing a payment, users will be redirected to: **http://localhost:8080/success**

## Usage Guide

### 1. Payment Button Test
- Click any payment button to create a payment intent
- The checkout page will open in a new tab
- Monitor the event log for SDK interactions

### 2. Payment Form Test
- Enter custom amount and description
- Click "Create Payment" to generate payment intent
- Form validates minimum amount (1000 sats)

### 3. Payment Modal Test
- Click "Open Payment Modal" 
- In production, this would show an inline modal
- For demo, opens checkout in new tab

### 4. Direct API Test
- Enter amount and description in the API test section
- Click "Create Payment Intent" to test direct API calls
- Click "Retrieve Payment" to fetch payment status
- View raw JSON responses

### 5. Event Log Monitoring
- All SDK interactions are logged in real-time
- Color-coded messages (info, success, error, warning)
- Timestamps for all events
- Clear log button to reset

## Integration Examples

The test app demonstrates several integration patterns:

### Simple Button Integration
```javascript
sGate.PaymentButton('#my-button', {
    amount_sats: 25000,
    description: 'Test Payment',
    onSuccess: (paymentIntent) => console.log('Success!', paymentIntent),
    onError: (error) => console.log('Error!', error)
});
```

### Form Integration
```javascript
sGate.PaymentForm('#payment-form', {
    defaultAmount: 50000,
    description: 'Custom Payment',
    onPaymentCreate: (paymentIntent) => {
        // Handle payment creation
        console.log('Payment created:', paymentIntent.id);
    }
});
```

### Modal Integration
```javascript
const modal = sGate.PaymentModal({
    amount_sats: 75000,
    description: 'Modal Payment',
    onSuccess: (paymentIntent) => {
        // Handle success
    }
});

// Show modal
modal.show();
```

### Direct API Usage
```javascript
// Initialize client
sGate.init({
    apiKey: 'your-api-key',
    apiBaseUrl: 'http://localhost:4003'
});

// Create payment
const paymentIntent = await sGate.createPaymentIntent({
    amount_sats: 100000,
    currency: 'sbtc',
    description: 'Direct API Payment',
    success_url: 'http://localhost:8080/success',
    cancel_url: 'http://localhost:8080',
    expires_in: 1800
});

// Retrieve payment
const retrieved = await sGate.retrievePaymentIntent(paymentIntent.id);
```

## Testing Scenarios

### 1. E-commerce Flow
- Product listing with payment button
- Fixed pricing (50,000 sats for coffee)
- Success redirect to confirmation page

### 2. Donation Flow
- Flexible amount input
- Optional description/message
- Default suggestion amounts

### 3. Subscription Flow
- Monthly subscription pricing (150,000 sats)
- Premium service upgrade simulation
- Recurring payment intent creation

### 4. Custom Integration
- Direct API testing with custom parameters
- Raw response inspection
- Error handling demonstration

## Configuration

The test app uses the public demo endpoint by default:
- **API Endpoint**: `http://localhost:4003/v1/public/demo/payment_intents`
- **No API Key Required**: Uses demo merchant account
- **Testnet**: Configured for Stacks testnet

For production integration, update the configuration:

```javascript
sGate.init({
    apiKey: 'sk_live_your_production_key',
    apiBaseUrl: 'https://api.sgate.dev'
});
```

## Troubleshooting

### Common Issues

1. **"Element not found" errors**
   - Check that DOM elements exist before SDK initialization
   - Ensure selectors match HTML element IDs

2. **API connection errors**
   - Verify sGate API is running on port 4003
   - Check console for CORS or network errors

3. **Payment creation fails**
   - Ensure minimum amount is 1000 sats
   - Check API server is properly seeded with demo merchant

### Health Check

Visit `http://localhost:8080/health` to verify the test app is running correctly.

## Development

### File Structure
```
test-app/
├── index.html          # Main test application
├── server.js           # Express server
├── package.json        # Dependencies
└── README.md          # This file
```

### Adding New Tests

To add new payment test scenarios:

1. Add HTML structure in `index.html`
2. Create component in the DOMContentLoaded event handler
3. Add logging for monitoring
4. Test with various amounts and descriptions

## Support

For issues with the test app or sGate integration:
- Check the event log for detailed error messages
- Verify API server status and configuration  
- Review network requests in browser developer tools
- Consult the main sGate documentation at `http://localhost:3000/docs`