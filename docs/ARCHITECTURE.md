# sGate Architecture Overview

Technical architecture and design decisions for the sGate sBTC Payment Gateway.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Blockchain    │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (Stacks)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ▲                        ▲                        ▲
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   JavaScript    │    │   PostgreSQL    │    │   Hiro API      │
│   SDK           │    │   Database      │    │   Stacks API    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Components

### 1. NestJS API (`apps/api/`)

**Technology Stack:**
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: API key-based (PBKDF2 hashed)
- **Validation**: Class-validator with DTOs
- **Documentation**: Swagger/OpenAPI
- **Scheduling**: Built-in cron jobs

**Key Features:**
- RESTful API design
- Modular architecture with dependency injection
- Automatic request/response validation
- Built-in error handling and logging
- Health checks and metrics

### 2. Next.js Checkout (`apps/checkout/`)

**Technology Stack:**
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Components**: Custom React components
- **State Management**: React hooks + SWR for data fetching
- **TypeScript**: Full type safety

**Key Features:**
- Server-side rendering for SEO
- Real-time payment status updates
- QR code generation for payments
- Responsive mobile-first design
- Automatic redirect handling

### 3. JavaScript SDK (`packages/sdk/`)

**Technology Stack:**
- **Build**: Rollup with TypeScript
- **Output**: ESM + CommonJS + UMD
- **Type Safety**: Full TypeScript definitions
- **Size**: Optimized bundle (~15KB gzipped)

**Key Features:**
- Payment Intent API client
- Embeddable checkout widget
- Framework-agnostic design
- Automatic polling for status updates
- Theme customization support

### 4. Shared Utilities (`packages/shared/`)

**Common Code:**
- TypeScript types and interfaces
- Zod validation schemas
- Cryptographic utilities (HMAC, hashing)
- Business logic helpers
- Error handling utilities

## Data Architecture

### Database Schema

```sql
-- Merchants (API key holders)
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    api_key_hash VARCHAR NOT NULL,
    webhook_url VARCHAR,
    webhook_secret VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payment Intents (customer payment requests)
CREATE TABLE payment_intents (
    id VARCHAR PRIMARY KEY,           -- pi_abc123
    merchant_id UUID REFERENCES merchants(id),
    amount_sats BIGINT NOT NULL,
    currency VARCHAR DEFAULT 'sbtc',
    status payment_intent_status_enum DEFAULT 'requires_payment',
    client_secret VARCHAR NOT NULL,
    pay_address VARCHAR NOT NULL,
    memo_hex VARCHAR NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    metadata JSONB,
    description VARCHAR,
    success_url VARCHAR,
    cancel_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payments (actual blockchain transactions)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id VARCHAR REFERENCES payment_intents(id),
    tx_id VARCHAR NOT NULL,
    amount_sats BIGINT NOT NULL,
    confirmations INTEGER DEFAULT 0,
    status payment_status_enum DEFAULT 'seen',
    raw_tx JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook Delivery Log
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id),
    event webhook_event_type_enum NOT NULL,
    payload_json JSONB NOT NULL,
    delivered BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    last_error VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes

```sql
-- Performance optimization indexes
CREATE INDEX idx_merchants_api_key_hash ON merchants(api_key_hash);
CREATE INDEX idx_payment_intents_merchant_id ON payment_intents(merchant_id);
CREATE INDEX idx_payment_intents_status ON payment_intents(status);
CREATE INDEX idx_payment_intents_memo_hex ON payment_intents(memo_hex);
CREATE INDEX idx_payments_tx_id ON payments(tx_id);
CREATE INDEX idx_webhook_deliveries_merchant_id ON webhook_deliveries(merchant_id);
```

## Payment Flow Architecture

### 1. Payment Intent Creation

```
Client → API → Database → Response
  ↓
Generate:
- Unique payment intent ID (pi_abc123)
- Client secret for security
- Memo hex for blockchain correlation
- Expiration timestamp
```

### 2. Checkout Experience

```
User → Checkout Page → Public API → Real-time Updates
  ↓
Display:
- Payment amount in sats + USD
- QR code for wallet scanning
- Payment address for manual entry
- Status polling every 3-5 seconds
```

### 3. Blockchain Detection

```
Watcher Service → Hiro API → Transaction Analysis → Database Update
                     ↓
               Memo Matching:
               - Extract memo from tx
               - Decode hex to payment intent ID
               - Validate amount and recipient
               - Update payment status
```

### 4. Webhook Delivery

```
Payment Confirmed → Webhook Service → HMAC Signature → HTTP POST
                                          ↓
                                    Retry Logic:
                                    - Exponential backoff
                                    - 3 attempts by default
                                    - Delivery logging
```

## Security Architecture

### Authentication & Authorization

**API Key Authentication:**
```typescript
// PBKDF2 hashing with salt
const hash = crypto.pbkdf2Sync(apiKey, salt, 10000, 64, 'sha512');

// Timing-safe comparison
const isValid = crypto.timingSafeEqual(
  Buffer.from(storedHash), 
  Buffer.from(computedHash)
);
```

**Authorization Levels:**
- **Public endpoints**: No authentication (checkout page)
- **Merchant endpoints**: API key required
- **Admin endpoints**: Internal only (future)

### Webhook Security

**HMAC SHA-256 Signatures:**
```typescript
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(`${timestamp}.${payload}`)
  .digest('hex');

const header = `t=${timestamp},v1=${signature}`;
```

**Security Measures:**
- Timestamp validation (5-minute tolerance)
- Timing-safe signature comparison
- Replay attack prevention
- HTTPS enforcement in production

### Input Validation

**Zod Schemas:**
```typescript
const CreatePaymentIntentDto = z.object({
  amount_sats: z.number().int().positive(),
  currency: z.literal('sbtc'),
  description: z.string().optional(),
  // ... other fields with validation
});
```

**Validation Pipeline:**
1. Request validation (class-validator)
2. DTO transformation and sanitization
3. Business logic validation
4. Database constraint validation

## Blockchain Integration

### Stacks Integration

**Transaction Detection:**
```typescript
// Poll Hiro API for address transactions
const transactions = await hiro.getAddressTransactions(gatewayAddress);

// Filter for sBTC transfers
const sbtcTransfers = transactions.filter(tx => 
  tx.ft_transfers?.some(transfer => 
    transfer.asset_identifier === sbtcAssetIdentifier &&
    transfer.recipient === gatewayAddress
  )
);

// Match memo to payment intent
const memo = extractMemo(transaction);
const paymentIntentId = decodePaymentIntentMemo(memo);
```

**Confirmation Handling:**
```typescript
// Check confirmations against requirement
const confirmations = currentBlockHeight - tx.block_height + 1;
const isConfirmed = confirmations >= requiredConfirmations;

if (isConfirmed && paymentIntent.status === 'processing') {
  await updatePaymentStatus(paymentIntentId, 'confirmed');
  await triggerWebhook(paymentIntent, 'payment_intent.succeeded');
}
```

### sBTC Asset Configuration

**Environment Variables:**
```bash
# Asset identifier for sBTC contract
SBTC_ASSET_IDENTIFIER=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc-token::sbtc

# Gateway address for receiving payments
GATEWAY_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM

# Required confirmations (1-2 for testnet)
REQUIRED_CONFIRMATIONS=1
```

## Scalability Considerations

### Database Scaling

**Read Replicas:**
```typescript
// TypeORM configuration for read/write splitting
const connectionOptions = {
  replication: {
    master: { host: 'primary-db.example.com' },
    slaves: [
      { host: 'read-replica-1.example.com' },
      { host: 'read-replica-2.example.com' }
    ]
  }
};
```

**Connection Pooling:**
```typescript
const dataSource = new DataSource({
  // ... other options
  extra: {
    max: 100,           // Maximum connections
    min: 10,            // Minimum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
});
```

### Caching Strategy

**Redis Integration (Optional):**
```typescript
// Cache payment intent status
await redis.setex(`pi:${paymentIntentId}:status`, 300, status);

// Cache exchange rates
await redis.setex('exchange:usd_per_btc', 3600, usdPerBtc);
```

### Worker Scaling

**Horizontal Scaling:**
```yaml
# Docker Compose scaling
docker-compose up --scale watcher=3
```

**Queue System (Future):**
```typescript
// Bull Queue for background jobs
const webhookQueue = new Queue('webhooks');

webhookQueue.add('deliver', {
  webhookId,
  paymentIntentId,
  event: 'payment_intent.succeeded'
});
```

## Monitoring & Observability

### Logging Strategy

**Structured Logging:**
```typescript
logger.info('Payment intent created', {
  paymentIntentId: pi.id,
  merchantId: pi.merchantId,
  amountSats: pi.amountSats,
  requestId: context.requestId
});
```

**Log Levels:**
- **ERROR**: System errors, webhook failures
- **WARN**: Business logic warnings, retries
- **INFO**: Request lifecycle, payment events
- **DEBUG**: Detailed debugging (development only)

### Health Checks

**API Health Endpoint:**
```typescript
@Get('health')
async healthCheck() {
  const dbStatus = await this.db.query('SELECT 1');
  const blockchainStatus = await this.hiro.getLatestBlock();
  
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus ? 'healthy' : 'unhealthy',
      blockchain: blockchainStatus ? 'healthy' : 'unhealthy'
    }
  };
}
```

### Metrics Collection

**Key Metrics:**
- Request count and response times
- Payment intent creation rate
- Payment confirmation rate  
- Webhook delivery success rate
- Database connection pool usage
- Error rates by endpoint

## Performance Optimization

### API Performance

**Response Caching:**
```typescript
// Cache payment intent responses
@UseInterceptors(CacheInterceptor)
@CacheTTL(300) // 5 minutes
@Get('payment_intents/:id')
async findOne(@Param('id') id: string) {
  return this.paymentIntentsService.findOne(id);
}
```

**Database Query Optimization:**
```typescript
// Eager loading with relations
const paymentIntent = await this.repository.findOne({
  where: { id },
  relations: ['payments', 'merchant']
});

// Query result caching
@CacheQuery(300)
async findRequiringPayment() {
  return this.repository.find({
    where: { status: In(['requires_payment', 'processing']) }
  });
}
```

### Frontend Performance

**Next.js Optimizations:**
- Static generation for landing pages
- Incremental static regeneration for dynamic content
- Image optimization with next/image
- Code splitting and lazy loading

**Bundle Optimization:**
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
};
```

## Development Workflow

### Monorepo Structure

**pnpm Workspaces:**
```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

**Dependency Management:**
- Shared dependencies in root package.json
- App-specific dependencies in respective package.json
- Workspace protocol for internal dependencies

### Build Pipeline

**Development:**
```bash
pnpm dev          # Start all services in development mode
pnpm build        # Build all packages for production
pnpm test         # Run all tests across workspace
```

**Production Build:**
```dockerfile
# Multi-stage Docker build
FROM node:18-alpine AS builder
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:18-alpine AS runtime
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]
```

## Deployment Architecture

### Container Strategy

**Microservices Deployment:**
```yaml
# Docker Compose production
services:
  api:
    image: sgate/api:latest
    replicas: 3
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    
  checkout:
    image: sgate/checkout:latest
    replicas: 2
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_BASE_URL=${API_BASE_URL}
    
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Infrastructure Requirements

**Minimum Production Setup:**
- **API Server**: 2 CPU cores, 4GB RAM
- **Database**: 2 CPU cores, 8GB RAM, SSD storage
- **Load Balancer**: HTTPS termination, health checks
- **Monitoring**: Application and infrastructure metrics

**Recommended Production Setup:**
- **API Servers**: 3x instances (2 CPU, 4GB RAM each)
- **Database**: Primary + read replica (4 CPU, 16GB RAM each)
- **Redis**: Caching layer (2 CPU, 4GB RAM)
- **CDN**: Static asset delivery
- **Monitoring**: APM, logging, alerting

## Future Architecture Considerations

### Planned Enhancements

**Multi-tenancy:**
- Merchant isolation at database level
- Per-merchant rate limiting
- Custom webhook configurations

**Event Sourcing:**
- Immutable event log
- Payment state reconstruction
- Audit trail capabilities

**API Gateway:**
- Rate limiting and throttling
- Request/response transformation
- API versioning management

**Message Queues:**
- Asynchronous webhook delivery
- Payment processing pipeline
- Event-driven architecture

### Scalability Roadmap

**Phase 1**: Current MVP architecture
**Phase 2**: Caching layer + read replicas
**Phase 3**: Message queues + worker scaling
**Phase 4**: Microservices decomposition
**Phase 5**: Multi-region deployment

---

This architecture provides a solid foundation for a production-grade payment gateway while maintaining simplicity and developer experience. The modular design allows for incremental scaling and feature additions as the system grows.