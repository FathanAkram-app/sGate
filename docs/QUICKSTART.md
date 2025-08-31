# sGate Quick Start Guide

Get sGate running locally in under 10 minutes.

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **Docker** & **Docker Compose** ([Download](https://docker.com/))
- **Git**

## Step 1: Clone & Install

```bash
git clone <your-repository-url>
cd sgate
pnpm install
```

This installs all dependencies for the monorepo using pnpm workspaces.

## Step 2: Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your specific configuration:

```bash
# Required: Database
DATABASE_URL=postgres://sgate:sgate@localhost:5432/sgate

# Required: Stacks Configuration
STACKS_NETWORK=testnet
HIRO_API_BASE=https://api.testnet.hiro.so
SBTC_ASSET_IDENTIFIER=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc-token::sbtc
GATEWAY_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM

# Security (generate secure values for production)
JWT_SECRET=dev-sgate-jwt-secret-change-in-production
WEBHOOK_SIGNATURE_SALT=sgate_wh_32bytes_min_change_in_production
API_KEY_SALT=sgate_api_32bytes_min_change_in_production

# URLs
API_BASE_URL=http://localhost:4000
CHECKOUT_BASE_URL=http://localhost:3000
```

## Step 3: Start Database

```bash
cd infra
docker compose up -d postgres
```

Wait for PostgreSQL to be ready:

```bash
docker compose logs -f postgres
# Wait for "database system is ready to accept connections"
```

## Step 4: Setup Database

```bash
cd ../apps/api

# Run migrations
pnpm migration:run

# Create demo merchant
pnpm seed
```

The seed script will output:

```
✅ Demo merchant created successfully!
📋 Merchant Details:
   ID: <merchant-id>
   Name: Demo Merchant
   API Key: sk_test_abc123...
   Webhook URL: https://smee.io/your-unique-channel
   Webhook Secret: <webhook-secret>

💡 Quick Start:
   1. Copy the API Key above
   2. Use it in your requests: Authorization: Bearer <API_KEY>
```

**Important**: Save the API Key - you'll need it for testing!

## Step 5: Start Services

Open two terminal windows:

**Terminal 1 - API Server:**
```bash
cd apps/api
pnpm dev
```

You should see:
```
sGate API is running on: http://localhost:4000
API Documentation: http://localhost:4000/docs
```

**Terminal 2 - Checkout Server:**
```bash
cd apps/checkout
pnpm dev
```

You should see:
```
Ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

## Step 6: Test Payment Flow

### Create Payment Intent

Use the API key from Step 4:

```bash
curl -X POST http://localhost:4000/v1/payment_intents \
  -H "Authorization: Bearer sk_test_YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "amount_sats": 100000,
    "currency": "sbtc",
    "description": "Test Payment - Quick Start"
  }'
```

Response:
```json
{
  "id": "pi_abc123",
  "client_secret": "pi_abc123_secret_xyz",
  "pay_address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "amount_sats": 100000,
  "status": "requires_payment",
  "checkout_url": "http://localhost:3000/pi/pi_abc123",
  "expires_at": "2025-09-04T23:59:59Z"
}
```

### Test Checkout Page

1. Copy the `checkout_url` from the response
2. Open it in your browser: `http://localhost:3000/pi/pi_abc123`
3. You should see a beautiful checkout page with:
   - Payment amount (100,000 sats)
   - QR code for payment address
   - Payment instructions
   - Real-time status updates

## Step 7: Test SDK (Optional)

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>sGate SDK Test</title>
</head>
<body>
    <h1>sGate SDK Test</h1>
    <div id="sgate-checkout"></div>

    <script type="module">
        // Note: In real usage, import from CDN or npm
        import { mount } from './packages/sdk/dist/index.esm.js';
        
        mount('#sgate-checkout', {
            clientSecret: 'pi_abc123_secret_xyz', // Use your client_secret
            apiBaseUrl: 'http://localhost:4000',
            onSuccess: (paymentIntent) => {
                alert('Payment successful! ' + paymentIntent.id);
            },
            onError: (error) => {
                alert('Payment error: ' + error.message);
            }
        });
    </script>
</body>
</html>
```

## Step 8: Test Webhooks (Optional)

### Set up webhook endpoint

For testing, use [smee.io](https://smee.io):

1. Go to https://smee.io
2. Click "Start a new channel"
3. Copy the webhook URL (e.g., `https://smee.io/abc123`)

### Update merchant webhook URL

```bash
# Update via database or API
curl -X PATCH http://localhost:4000/v1/merchants/me/webhook \
  -H "Authorization: Bearer sk_test_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"webhook_url": "https://smee.io/abc123"}'
```

### Install smee client

```bash
npm install -g smee-client
smee --url https://smee.io/abc123 --target http://localhost:8080
```

Now when payments are processed, you'll see webhook deliveries in real-time!

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# View PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres
```

### Port Already in Use

```bash
# Check what's using the port
lsof -i :4000  # or :3000
netstat -an | grep :4000

# Kill the process or use different ports in .env
```

### Migration Errors

```bash
# Reset database (development only!)
docker compose down postgres
docker volume rm infra_postgres_data
docker compose up -d postgres

# Wait, then run migrations again
cd apps/api && pnpm migration:run
```

### API Key Issues

```bash
# Generate new demo merchant
cd apps/api && pnpm seed

# Or check existing merchants in database
docker exec -it infra_postgres_1 psql -U sgate -d sgate
SELECT id, name, created_at FROM merchants;
```

## Next Steps

### Explore the API

- Visit http://localhost:4000/docs for Swagger UI
- Try different payment amounts and metadata
- Test webhook delivery with real endpoints

### Customize Checkout

- Edit `apps/checkout/src/app/pi/[id]/page.tsx`
- Customize styling in `tailwind.config.js`
- Add your branding and colors

### Build Your Integration

- Review the [API Documentation](API.md)
- Check out [Webhook Guide](WEBHOOKS.md)
- Explore the [SDK examples](../examples/)

### Production Setup

- Update environment variables
- Configure SSL certificates
- Set up monitoring
- Review [Architecture docs](ARCHITECTURE.md)

## Common Use Cases

### E-commerce Integration

```javascript
// Create payment for order
const payment = await sgate.createPaymentIntent({
  amount_sats: calculateSatsFromUSD(order.total),
  currency: 'sbtc',
  description: `Order #${order.id}`,
  metadata: { orderId: order.id, userId: user.id },
  success_url: `https://mystore.com/orders/${order.id}/success`,
  cancel_url: `https://mystore.com/orders/${order.id}/cancel`
});

// Redirect to checkout
window.location.href = payment.checkout_url;
```

### Subscription Billing

```javascript
// Create payment for monthly subscription
const payment = await sgate.createPaymentIntent({
  amount_sats: 500000, // $32.50 at $65k/BTC
  currency: 'sbtc',
  description: 'Premium Plan - Monthly',
  metadata: { 
    subscriptionId: subscription.id,
    plan: 'premium',
    period: 'monthly'
  }
});
```

### Donation/Tips

```javascript
// Flexible donation amount
const payment = await sgate.createPaymentIntent({
  amount_sats: donationAmountSats,
  currency: 'sbtc',
  description: `Donation to ${creator.name}`,
  metadata: { 
    creatorId: creator.id,
    donationType: 'tip'
  }
});
```

That's it! You now have a fully functional sBTC payment gateway running locally. The setup takes about 10 minutes and you can process real sBTC testnet payments end-to-end.

For production deployment and advanced features, see the main [README](../README.md) and [Architecture guide](ARCHITECTURE.md).