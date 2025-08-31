# sGate: sBTC Payment Gateway

A production-grade MVP payment gateway for sBTC on Stacks testnet, inspired by Stripe's developer experience.

## 🚀 Features

- **Payment Intent API**: Create and retrieve payment intents
- **Hosted Checkout**: Beautiful, responsive checkout pages
- **Real sBTC Processing**: End-to-end sBTC testnet transfers
- **Webhook Delivery**: HMAC-signed webhooks with automatic retries
- **JavaScript SDK**: Drop-in checkout widgets and API client
- **Developer First**: Clean APIs, comprehensive docs, 10-minute setup

## 📦 Architecture

```
sgate/
├── apps/
│   ├── api/           # NestJS API + TypeORM + Postgres
│   └── checkout/      # Next.js 14 hosted checkout pages
├── packages/
│   ├── sdk/           # JavaScript SDK (@sgate/sdk)
│   └── shared/        # Shared types and utilities
├── infra/
│   └── docker-compose.yml  # Development environment
└── docs/              # Documentation
```

## 🏁 Quick Start

### Prerequisites

- Node.js 18+
- npm 8+
- Docker & Docker Compose

### 1. Clone and Install

```bash
git clone <repository-url>
cd sgate
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Infrastructure

```bash
cd infra
docker compose up -d postgres
```

### 4. Run Migrations & Seed

```bash
cd apps/api
npm run migration:run
npm run seed
```

### 5. Start Development

**Option A - Automated Setup (Recommended):**
```bash
# Run the startup script that handles everything
node start.js
```

**Option B - Manual Setup:**
```bash
# Terminal 1 - API
cd apps/api && npm run dev

# Terminal 2 - Checkout
cd apps/checkout && npm run dev
```

### 6. Test Payment Flow

```bash
# Create payment intent
curl -X POST http://localhost:4000/v1/payment_intents \
  -H "Authorization: Bearer <API_KEY_FROM_SEED>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount_sats": 100000,
    "currency": "sbtc",
    "description": "Test Payment"
  }'

# Open checkout URL from response
```

## 📚 Documentation

- [API Reference](docs/API.md) - Complete API documentation
- [Quickstart Guide](docs/QUICKSTART.md) - Detailed setup instructions
- [Webhook Guide](docs/WEBHOOKS.md) - Webhook implementation
- [Architecture Overview](docs/ARCHITECTURE.md) - System design

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev                 # Start all services
npm run build               # Build all packages
npm test                    # Run tests
npm run lint                # Lint code

# Database
cd apps/api
npm run migration:generate  # Generate migration
npm run migration:run       # Run migrations
npm run seed                # Seed demo data

# Docker
cd infra
docker compose up -d        # Start infrastructure
docker compose down         # Stop infrastructure
```

### Project Structure

```
apps/api/src/
├── entities/              # TypeORM entities
├── modules/
│   ├── merchants/         # Merchant management
│   ├── payment-intents/   # Payment Intent API
│   ├── webhooks/          # Webhook delivery
│   ├── watcher/           # sBTC detection worker
│   └── auth/              # API key authentication
└── config/                # Configuration

apps/checkout/src/
├── app/
│   └── pi/[id]/          # Payment intent checkout page
├── components/            # Reusable components
└── lib/                  # Utilities

packages/sdk/src/
├── client.ts             # API client
├── checkout-widget.ts    # Embeddable widget
└── index.ts              # Main exports
```

## 🔐 Security

- **API Key Authentication**: PBKDF2-hashed API keys with salt
- **HMAC Webhook Signatures**: SHA256-signed webhook payloads
- **Input Validation**: Zod schema validation on all inputs
- **CORS Protection**: Configurable CORS policies
- **Rate Limiting**: Built-in rate limiting (production)

## 🌐 API Overview

### Create Payment Intent

```bash
POST /v1/payment_intents
Authorization: Bearer <API_KEY>

{
  "amount_sats": 250000,
  "currency": "sbtc",
  "description": "Order #1234",
  "success_url": "https://yoursite.com/success",
  "cancel_url": "https://yoursite.com/cancel"
}
```

### Response

```json
{
  "id": "pi_abc123",
  "client_secret": "pi_abc123_secret_xyz",
  "pay_address": "ST3...GATEWAY",
  "amount_sats": 250000,
  "status": "requires_payment",
  "checkout_url": "http://localhost:3000/pi/pi_abc123",
  "expires_at": "2025-09-04T23:59:59Z"
}
```

## 📱 SDK Usage

### API Client

```javascript
import { SGateClient } from '@sgate/sdk';

const sgate = new SGateClient({
  apiKey: 'sk_test_...',
  apiBaseUrl: 'https://api.sgate.dev'
});

const paymentIntent = await sgate.createPaymentIntent({
  amount_sats: 100000,
  currency: 'sbtc',
  description: 'Premium Subscription'
});
```

### Checkout Widget

```html
<div id="sgate-checkout"></div>

<script type="module">
  import { mount } from '@sgate/sdk';
  
  mount('#sgate-checkout', {
    clientSecret: 'pi_abc123_secret_xyz',
    onSuccess: (paymentIntent) => {
      console.log('Payment successful!', paymentIntent);
    }
  });
</script>
```

## 🎯 Webhook Events

sGate sends webhooks for these events:

- `payment_intent.succeeded` - Payment confirmed
- `payment_intent.failed` - Payment failed
- `payment_intent.expired` - Payment expired

### Webhook Payload

```json
{
  "id": "evt_1234567890",
  "event": "payment_intent.succeeded",
  "created": 1693123456,
  "data": {
    "object": {
      "id": "pi_abc123",
      "amount_sats": 250000,
      "status": "confirmed"
    }
  }
}
```

## 📊 Monitoring & Health

- **Health Check**: `GET /health`
- **API Documentation**: `GET /docs` (Swagger UI)
- **Database Monitoring**: Built-in TypeORM logging
- **Webhook Delivery Logs**: Automatic retry with exponential backoff

## 🔄 Production Deployment

### Environment Variables

Key variables for production:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/sgate
JWT_SECRET=secure-random-secret
WEBHOOK_SIGNATURE_SALT=32-byte-secure-salt
API_KEY_SALT=32-byte-secure-salt
STACKS_NETWORK=testnet
SBTC_ASSET_IDENTIFIER=your-sbtc-contract
GATEWAY_ADDRESS=your-stacks-address
```

### Security Checklist

- [ ] Generate secure secrets for production
- [ ] Configure CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Enable database SSL
- [ ] Configure proper firewall rules
- [ ] Set up monitoring and alerts
- [ ] Regular security updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/sgate/issues)
- **Documentation**: [docs/](docs/)
- **Examples**: [examples/](examples/)

## 🎯 Roadmap

- [ ] Mainnet support
- [ ] Multi-merchant dashboard
- [ ] Advanced analytics
- [ ] Mobile SDKs
- [ ] Lightning Network integration
- [ ] Subscription billing

---

Built with ❤️ for the Stacks ecosystem