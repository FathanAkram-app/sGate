# sGate Test App - Usage Guide

## 🚀 Quick Start

### 1. Start Required Services

Ensure these services are running in order:

```bash
# 1. Start sGate API (required)
cd apps/api && npm run start:dev
# API will be available at: http://localhost:4003

# 2. Start sGate Checkout (optional, for checkout pages)  
cd apps/checkout && npm run dev  
# Checkout will be available at: http://localhost:3000

# 3. Start Test App
cd test-app && npm start
# Test app will be available at: http://localhost:8080
```

### 2. Open Test App

Visit: **http://localhost:8080**

## 🧪 Testing Features

### API Connection Test
- Click "Test API Connection" to verify the API is reachable
- Green ✅ = Connected, Red ❌ = API not available

### Payment Components

#### 1. Simple Payment Button
- **Amount**: 25,000 sats (fixed)
- **Test**: Click button → creates payment intent → opens checkout
- **Purpose**: Basic integration testing

#### 2. Payment Form  
- **Amount**: Customizable (default 50,000 sats)
- **Description**: Optional custom description
- **Validation**: Minimum 1,000 sats required
- **Test**: Enter amount → Create Payment → opens checkout

#### 3. Payment Modal
- **Amount**: 75,000 sats (fixed)
- **Behavior**: In production would show modal, for demo opens new tab
- **Test**: Click "Open Payment Modal" → creates payment → opens checkout

#### 4. Donation Widget
- **Amount**: Flexible (default 10,000 sats)
- **Description**: Optional donation message
- **Test**: Enter donation amount → Create Payment → opens checkout

#### 5. E-commerce Item
- **Product**: Premium Coffee Blend
- **Amount**: 50,000 sats
- **Test**: Product purchase simulation → opens checkout

#### 6. Subscription Service  
- **Service**: Premium Subscription
- **Amount**: 150,000 sats/month
- **Test**: Subscription upgrade simulation → opens checkout

### Direct API Testing

#### Create Payment Intent
1. Enter custom amount and description
2. Click "Create Payment Intent"
3. View raw JSON response
4. "Retrieve Payment" button becomes enabled

#### Retrieve Payment Intent
1. After creating a payment, click "Retrieve Payment"
2. Fetches current payment status
3. View raw JSON response with current state

### Event Monitoring

#### Real-time Log
- All SDK interactions logged with timestamps
- Color-coded: Success (green), Error (red), Info (blue), Warning (yellow)
- Auto-scroll to latest events
- "Clear Log" button to reset

## 🔍 What to Look For

### Successful Flow
1. **Connection Test**: Shows ✅ "API Connected"
2. **Payment Creation**: Log shows "Payment intent created: pi_xxxxx"
3. **Checkout Opens**: New tab with payment page loads
4. **Success Redirect**: After payment, redirects to success page

### Common Issues

#### ❌ API Not Available
- **Symptoms**: Red connection status, "NetworkError" in log
- **Solution**: Start sGate API server on port 4003
- **Check**: Visit http://localhost:4003/health manually

#### ❌ CORS Errors  
- **Symptoms**: Fetch fails, console shows CORS error
- **Solution**: Restart API server (CORS now includes port 8080)
- **Check**: API should allow localhost:8080 origin

#### ❌ Checkout Page 404
- **Symptoms**: Payment created but checkout page not found  
- **Solution**: Start sGate Checkout server on port 3000
- **Check**: Visit http://localhost:3000 manually

#### ⚠️ Validation Errors
- **Symptoms**: "Invalid amount" in log
- **Solution**: Use minimum 1,000 sats for all payments
- **Check**: Form validation prevents < 1000 sats

## 📊 Integration Examples

The test app demonstrates these integration patterns:

### Basic Button
```javascript
sGate.PaymentButton('#button', {
    amount_sats: 25000,
    description: 'Simple Payment',
    onSuccess: (pi) => console.log('Success!'),
    onError: (err) => console.log('Error!')
});
```

### Custom Form
```javascript
sGate.PaymentForm('#form', {
    defaultAmount: 50000,
    onPaymentCreate: (pi) => {
        console.log('Payment created:', pi.id);
        // Track analytics, update UI, etc.
    }
});
```

### Modal Popup
```javascript
const modal = sGate.PaymentModal({
    amount_sats: 75000,
    description: 'Premium Upgrade',
    onSuccess: (pi) => window.location = '/dashboard'
});
modal.show();
```

### Direct API
```javascript
// Create payment
const payment = await sGate.createPaymentIntent({
    amount_sats: 100000,
    description: 'Custom Payment',
    expires_in: 1800
});

// Retrieve status  
const status = await sGate.retrievePaymentIntent(payment.id);
```

## 🔧 Development Notes

### Mock SDK Implementation
- The test app includes a mock sGate SDK implementation
- In production, you would `npm install @sgate/sdk` instead
- All methods match the real SDK interface for testing

### Environment Configuration
```javascript
sGate.init({
    apiKey: 'demo-key', // Uses public demo endpoint
    apiBaseUrl: 'http://localhost:4003'
});
```

### Success Page
- All payments redirect to: `http://localhost:8080/success`
- Shows confirmation message with back links
- In production, customize success_url per payment

## 🐛 Troubleshooting

### Check Services Status
```bash
# API Health
curl http://localhost:4003/health

# Checkout Health  
curl http://localhost:3000

# Test App Health
curl http://localhost:8080/health
```

### View Logs
- **Browser**: Open Developer Tools → Console
- **API**: Check terminal running `npm run start:dev`
- **Test App**: Check terminal running `npm start`

### Reset Everything
```bash
# Stop all services (Ctrl+C in each terminal)
# Clear browser cache and cookies
# Restart services in order (API → Checkout → Test App)
```

## 📈 Success Criteria

✅ API connection test passes  
✅ All 6 payment components create payment intents  
✅ Checkout pages load without errors  
✅ Success page redirects work  
✅ Event log shows successful operations  
✅ Raw API responses display correctly  

This test app validates that your sGate SDK integration is working correctly and ready for production use!