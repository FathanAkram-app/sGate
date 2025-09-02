# sGate Architecture Overview

Production-grade architecture and design decisions for the sGate sBTC Payment Gateway.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Checkout UI   │    │   Backend API   │    │   Blockchain    │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (Stacks)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ▲                        ▲                        ▲
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   JavaScript    │    │   PostgreSQL    │    │   Hiro API      │
│   SDK           │    │   Database      │    │   Stacks API    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Production    │    │   Redis Cache   │    │   Monitoring    │
│   Infrastructure│    │   Rate Limiting │    │   & Logging     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Components

### 1. NestJS API Backend (`apps/api/`)

**Technology Stack:**
- **Framework**: NestJS 10.x with TypeScript
- **Database**: PostgreSQL 15+ with TypeORM
- **Authentication**: PBKDF2-hashed API keys with timing-safe comparison
- **Validation**: class-validator with DTOs + Zod schemas
- **Documentation**: Swagger/OpenAPI auto-generated
- **Scheduling**: Built-in cron jobs for blockchain monitoring
- **Logging**: Structured JSON logging with request correlation
- **Error Handling**: Global exception filter with sanitization

**Key Modules:**
```
src/
├── modules/
│   ├── auth/              # API key authentication & guards
│   ├── merchants/         # Merchant management & API keys
│   ├── payment-intents/   # Payment Intent CRUD operations
│   ├── public/            # Public endpoints (no auth required)
│   ├── watcher/           # Blockchain transaction monitoring
│   └── webhooks/          # HMAC-signed webhook delivery
├── entities/              # TypeORM database entities
├── common/                # Shared filters, guards, interceptors
└── config/                # Environment-based configuration
```

**Security Features:**
- PBKDF2 API key hashing with salt (10,000 iterations)
- Timing-safe comparison for authentication
- Request/response sanitization in logs
- HMAC-SHA256 webhook signatures
- Input validation with DTOs
- Global exception handling

### 2. Next.js Checkout Frontend (`apps/checkout/`)

**Technology Stack:**
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom design system
- **Components**: React 18 with TypeScript
- **Data Fetching**: Native fetch with error boundaries
- **State Management**: React hooks + URL state
- **Performance**: Server-side rendering, image optimization

**Key Features:**
- Dynamic payment pages at `/pi/[id]`
- QR code generation for wallet payments
- Real-time payment status polling (3-second intervals)
- Mobile-responsive checkout design
- Automatic redirect handling on success/cancel
- Error boundary with graceful degradation

### 3. JavaScript SDK (`packages/sdk/`)

**Technology Stack:**
- **Build**: Rollup with TypeScript compilation
- **Output Formats**: ESM + CommonJS + UMD
- **Type Safety**: Full TypeScript definitions
- **Bundle Size**: Optimized (<15KB gzipped)

**API Client Features:**
```typescript
import { SGateClient } from '@sgate/sdk';

const client = new SGateClient({
  apiKey: 'sk_test_...',
  apiBaseUrl: 'https://api.sgate.com'
});

const paymentIntent = await client.createPaymentIntent({
  amount_sats: 100000,
  currency: 'sbtc',
  description: 'Premium subscription'
});
```

### 4. Shared Utilities (`packages/shared/`)

**Common Libraries:**
- TypeScript interfaces and types
- Zod validation schemas
- Cryptographic utilities (HMAC, hashing)
- Business logic helpers (ID generation, memo encoding)
- Error classes and constants

## Database Architecture

### Core Schema

```sql
-- Merchants (API key holders)
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    api_key_hash VARCHAR(128) NOT NULL UNIQUE,
    webhook_url VARCHAR(512),
    webhook_secret VARCHAR(128),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payment Intents (customer payment requests)
CREATE TABLE payment_intents (
    id VARCHAR(32) PRIMARY KEY,              -- pi_abc123
    merchant_id UUID REFERENCES merchants(id),
    amount_sats BIGINT NOT NULL,
    currency VARCHAR(10) DEFAULT 'sbtc',
    status payment_intent_status_enum DEFAULT 'requires_payment',
    client_secret VARCHAR(64) NOT NULL,
    pay_address VARCHAR(64) NOT NULL,
    memo_hex VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    metadata JSONB,
    description VARCHAR(512),
    success_url VARCHAR(512),
    cancel_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_payment_intents_merchant_id (merchant_id),
    INDEX idx_payment_intents_status (status),
    INDEX idx_payment_intents_memo_hex (memo_hex),
    INDEX idx_payment_intents_expires_at (expires_at)
);

-- Payments (actual blockchain transactions)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id VARCHAR(32) REFERENCES payment_intents(id),
    tx_id VARCHAR(64) NOT NULL,
    amount_sats BIGINT NOT NULL,
    confirmations INTEGER DEFAULT 0,
    status payment_status_enum DEFAULT 'seen',
    raw_tx JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_payments_payment_intent_id (payment_intent_id),
    INDEX idx_payments_tx_id (tx_id),
    UNIQUE(tx_id, payment_intent_id)
);

-- Webhook Delivery Log
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id),
    event webhook_event_type_enum NOT NULL,
    payload_json JSONB NOT NULL,
    delivered BOOLEAN DEFAULT FALSE,
    failed BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    last_attempt TIMESTAMP,
    delivered_at TIMESTAMP,
    failed_at TIMESTAMP,
    response_status INTEGER,
    response_headers JSONB,
    response_body TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_webhook_deliveries_merchant_id (merchant_id),
    INDEX idx_webhook_deliveries_delivered (delivered),
    INDEX idx_webhook_deliveries_failed (failed),
    INDEX idx_webhook_deliveries_created_at (created_at)
);
```

### Database Optimization

**Connection Pooling:**
```typescript
// Database configuration with connection pooling
{
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production',
  extra: {
    max: 20,                    // Maximum connections
    min: 5,                     // Minimum connections
    idleTimeoutMillis: 30000,   // Close idle connections
    connectionTimeoutMillis: 2000,
    acquireTimeoutMillis: 60000,
    reapIntervalMillis: 1000,
  },
  logging: process.env.NODE_ENV !== 'production',
}
```

**Query Performance:**
- Strategic indexes on frequently queried fields
- Composite indexes for multi-column queries
- JSONB indexes for metadata searches
- Regular EXPLAIN ANALYZE for query optimization

## Payment Flow Architecture

### 1. Payment Intent Creation Flow
```
Merchant API Request
      ↓
  Validation & Authentication
      ↓
  Generate Unique IDs:
  - Payment Intent ID (pi_abc123)
  - Client Secret (pi_abc123_secret_xyz)
  - Memo Hex (encoded PI ID)
      ↓
  Store in Database
      ↓
  Return Checkout URL
```

### 2. Customer Payment Flow
```
Customer → Checkout Page → Display Payment Info:
                          - Amount (sats + USD)
                          - QR Code
                          - Payment Address
                          - Memo (hex)
      ↓
  Real-time Status Polling (3s intervals)
      ↓
  Payment Detected → Confirmation → Redirect
```

### 3. Blockchain Detection Flow
```
Watcher Service (10s cron)
      ↓
  Query Hiro API for transactions
      ↓
  Filter sBTC transfers to gateway address
      ↓
  Extract & decode memo → Match Payment Intent
      ↓
  Validate amount & confirmations
      ↓
  Update payment status
      ↓
  Trigger webhook delivery
```

### 4. Webhook Delivery Flow
```
Payment Event Triggered
      ↓
  Generate HMAC Signature:
  - Timestamp + Payload
  - SHA256 with merchant webhook secret
      ↓
  HTTP POST with retry logic:
  - Exponential backoff
  - 5 attempts max
  - 10-second timeout
      ↓
  Log delivery status & response
```

## Security Architecture

### Authentication & Authorization

**API Key Security:**
```typescript
// PBKDF2 hashing with timing-safe comparison
const hashApiKey = (apiKey: string, salt: string): string => {
  return crypto.pbkdf2Sync(apiKey, salt, 10000, 64, 'sha512').toString('hex');
};

const verifyApiKey = (apiKey: string, hash: string, salt: string): boolean => {
  const computedHash = hashApiKey(apiKey, salt);
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(computedHash, 'hex')
  );
};
```

**Authorization Levels:**
- **Public endpoints**: No authentication (checkout pages)
- **Merchant endpoints**: API key required via Bearer token
- **Internal endpoints**: Service-to-service (future)

### Webhook Security

**HMAC-SHA256 Signatures:**
```typescript
const signWebhookPayload = (payload: string, secret: string, timestamp: number): string => {
  const signedPayload = `${timestamp}.${payload}`;
  return crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
};

// Header format: t=1234567890,v1=signature_here
```

**Security Measures:**
- 5-minute timestamp tolerance window
- Timing-safe signature comparison
- Replay attack prevention via timestamp
- HTTPS enforcement in production
- Request size limits (1MB max)

### Input Validation & Sanitization

**Multi-layer Validation:**
1. **DTO Validation**: class-validator decorators
2. **Zod Schemas**: Runtime type checking
3. **Business Logic**: Domain-specific validation
4. **Database Constraints**: Final integrity checks

**Sensitive Data Handling:**
```typescript
// Log sanitization removes sensitive fields
const sanitizeBody = (body: any) => {
  const sensitive = ['api_key', 'client_secret', 'webhook_secret'];
  const sanitized = { ...body };
  sensitive.forEach(field => {
    if (sanitized[field]) sanitized[field] = '[REDACTED]';
  });
  return sanitized;
};
```

## Blockchain Integration

### Stacks Network Integration

**Transaction Detection Strategy:**
```typescript
// Poll Hiro API for gateway address transactions
const detectPayments = async () => {
  const transactions = await hiro.getAddressTransactions(gatewayAddress, {
    limit: 50,
    offset: 0
  });

  for (const tx of transactions) {
    if (tx.tx_status !== 'success' || !tx.canonical) continue;

    // Extract sBTC transfers
    const transfers = extractFTTransfers(tx);
    
    for (const transfer of transfers) {
      if (transfer.asset_identifier === sbtcAssetId &&
          transfer.recipient === gatewayAddress) {
        
        const memo = extractMemo(tx);
        const paymentIntentId = decodePaymentIntentMemo(memo);
        
        if (paymentIntentId) {
          await processPayment(paymentIntentId, tx, transfer);
        }
      }
    }
  }
};
```

**Confirmation Handling:**
```typescript
const processPayment = async (paymentIntent, transaction, transfer) => {
  const currentHeight = await getCurrentBlockHeight();
  const confirmations = currentHeight - transaction.block_height + 1;
  const requiredConfirmations = config.stacks.requiredConfirmations;

  if (confirmations >= requiredConfirmations) {
    await updatePaymentIntentStatus(paymentIntent.id, 'confirmed');
    await triggerWebhook(paymentIntent, 'payment_intent.succeeded');
  } else {
    await updatePaymentIntentStatus(paymentIntent.id, 'processing');
  }
};
```

### Memo Encoding/Decoding

**Payment Intent ID Encoding:**
```typescript
// Encode payment intent ID as hex for blockchain memo
const encodePaymentIntentMemo = (paymentIntentId: string): string => {
  return Buffer.from(paymentIntentId).toString('hex');
};

const decodePaymentIntentMemo = (memoHex: string): string | null => {
  try {
    return Buffer.from(memoHex, 'hex').toString('utf8');
  } catch {
    return null;
  }
};
```

## Production Infrastructure

### Container Architecture

**Multi-stage Docker Builds:**
```dockerfile
# Production API Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sgate -u 1001
USER sgate
WORKDIR /app
COPY --from=builder --chown=sgate:nodejs /app/dist ./dist
COPY --from=builder --chown=sgate:nodejs /app/node_modules ./node_modules
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1
CMD ["node", "dist/main.js"]
```

**Production Docker Compose:**
```yaml
version: '3.8'

services:
  api:
    image: sgate/api:${VERSION}
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      - postgres
      - redis
    networks:
      - sgate-network

  checkout:
    image: sgate/checkout:${VERSION}
    deploy:
      replicas: 2
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${API_BASE_URL}
    networks:
      - sgate-network

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: sgate_production
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
```

### Monitoring & Observability

**Structured Logging:**
```typescript
// Request correlation with unique IDs
logger.info('Payment intent created', {
  paymentIntentId: pi.id,
  merchantId: pi.merchantId,
  amountSats: pi.amountSats,
  requestId: context.requestId,
  userAgent: request.headers['user-agent'],
  ip: request.ip
});
```

**Health Checks:**
```typescript
@Get('health')
async healthCheck(): Promise<HealthCheckResult> {
  const results = await Promise.allSettled([
    this.database.query('SELECT 1'),
    this.hiro.getLatestBlock(),
    this.redis.ping()
  ]);

  return {
    status: results.every(r => r.status === 'fulfilled') ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: results[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      blockchain: results[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      cache: results[2].status === 'fulfilled' ? 'healthy' : 'unhealthy'
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  };
}
```

**Metrics Collection:**
- Request count and latency by endpoint
- Payment intent creation/confirmation rates
- Webhook delivery success rates
- Database connection pool usage
- Error rates and types
- Business KPIs (payment volume, merchant activity)

### Performance Optimization

**API Response Caching:**
```typescript
// Cache payment intent responses for 5 minutes
@UseInterceptors(CacheInterceptor)
@CacheTTL(300)
@Get('payment_intents/:id')
async findOne(@Param('id') id: string) {
  return this.paymentIntentsService.findOne(id);
}
```

**Database Query Optimization:**
- Connection pooling with configurable limits
- Query result caching for frequently accessed data
- Eager loading optimization for related entities
- Regular performance monitoring with EXPLAIN ANALYZE

**Frontend Performance:**
- Next.js static generation for landing pages
- Image optimization with next/image
- Code splitting and lazy loading
- Bundle size monitoring and optimization

## Security Compliance

### Data Protection
- **PCI Compliance**: No card data stored (sBTC only)
- **GDPR Compliance**: Minimal personal data collection
- **Data Retention**: Configurable retention policies
- **Encryption**: Data at rest and in transit

### Security Monitoring
- **Intrusion Detection**: Failed authentication monitoring
- **Rate Limiting**: Per-API-key request limits
- **Audit Logging**: Complete audit trail for sensitive operations
- **Vulnerability Scanning**: Regular dependency and container scans

## Scalability Architecture

### Horizontal Scaling
**Load Balancing:**
- Nginx reverse proxy with round-robin
- Health check-based routing
- Session affinity not required (stateless design)

**Database Scaling:**
- Read replicas for query distribution
- Connection pooling with PgBouncer
- Sharding strategy for multi-tenant growth

**Cache Layer:**
- Redis for session storage and rate limiting
- Application-level caching for frequent queries
- CDN for static assets

### Performance Targets
- **API Response Time**: <200ms p95
- **Database Query Time**: <50ms p95
- **Webhook Delivery**: <5s p95
- **Checkout Page Load**: <2s first contentful paint
- **Uptime**: 99.9% SLA target

---

This architecture provides enterprise-grade reliability, security, and scalability while maintaining developer experience and operational simplicity. The modular design enables incremental improvements and feature additions as the platform evolves.