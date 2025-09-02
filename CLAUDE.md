# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

sGate is an sBTC Payment Gateway for Stacks testnet - a production-grade MVP inspired by Stripe's developer experience. It enables developers to accept sBTC payments through a simple API with hosted checkout pages.

## Development Commands

### Root Level Commands
```bash
# Start all services (recommended)
node start.js

# Build all packages
npm run build

# Run tests across all workspaces
npm test

# Lint all code
npm run lint

# Type checking
npm run typecheck

# Seed database with demo data
npm run seed
```

### API Commands (apps/api/)
```bash
# Development server
npm run start:dev

# Production build and start
npm run build && npm run start:prod

# Database operations
npm run migration:generate    # Generate new migration
npm run migration:run        # Apply migrations
npm run migration:revert     # Revert last migration
npm run seed                 # Create demo merchant and API key

# Testing
npm run test                 # Unit tests
npm run test:e2e            # End-to-end tests
npm run test:cov            # Coverage report
```

### Checkout Commands (apps/checkout/)
```bash
# Development server
npm run dev

# Production build
npm run build && npm run start
```

### Infrastructure Commands
```bash
# Start PostgreSQL (required)
cd infra && docker compose up -d postgres

# Start all services with Docker
cd infra && docker compose up -d

# Stop services
cd infra && docker compose down
```

## Architecture Overview

### Monorepo Structure
- **apps/api/** - NestJS backend with TypeORM, PostgreSQL
- **apps/checkout/** - Next.js 14 frontend for hosted checkout pages  
- **packages/shared/** - Shared TypeScript types and utilities
- **packages/sdk/** - JavaScript SDK for merchants
- **infra/** - Docker configuration and database setup

### Core Components

**API Backend (NestJS)**
- Payment Intent creation and management (`src/modules/payment-intents/`)
- Blockchain transaction monitoring (`src/modules/watcher/`)
- HMAC-signed webhook delivery (`src/modules/webhooks/`)
- API key authentication (`src/modules/auth/`)
- TypeORM entities in `src/entities/`

**Checkout Frontend (Next.js)**
- Dynamic payment pages at `/pi/[id]`
- QR code generation for wallet payments
- Real-time payment status polling
- Mobile-responsive design

**Payment Flow**
1. Merchant creates Payment Intent via API
2. Customer visits hosted checkout URL
3. Watcher service monitors Stacks blockchain for sBTC transfers
4. Payments matched by memo hex to Payment Intent ID
5. Webhooks fired on payment confirmation/expiration

### Database Schema

Key entities:
- `merchants` - API key holders with webhook configuration
- `payment_intents` - Customer payment requests with memo matching
- `payments` - Actual blockchain transactions with confirmations
- `webhook_deliveries` - Delivery logs with retry tracking

### Configuration

Environment variables configured in:
- Development: `infra/docker-compose.yml` 
- Production: Deploy-specific configuration

Key settings:
- `STACKS_NETWORK=testnet`
- `SBTC_ASSET_IDENTIFIER` - sBTC contract identifier
- `GATEWAY_ADDRESS` - Stacks address for receiving payments
- `REQUIRED_CONFIRMATIONS=1` - Blockchain confirmations needed

## Development Workflow

### Quick Start
1. Ensure Docker is running
2. Run `node start.js` from project root, OR manually start:
   - PostgreSQL: `cd infra && docker compose up -d postgres`
   - API: `cd apps/api && npm run start:prod` (port 4000)
   - Checkout: `cd apps/checkout && npm run dev` (port 3000)
3. Services will be available at:
   - API: http://localhost:4000 (with Swagger docs at /docs)
   - Checkout: http://localhost:3000
   - PostgreSQL on port 5432

**Note**: If ports 4000-4000 are in use, create `apps/api/.env` with `PORT=4000`

### Working with Payment Intents
```bash
# Create test payment intent
curl -X POST http://localhost:4000/v1/payment_intents \
  -H "Authorization: Bearer <API_KEY_FROM_SEED>" \
  -H "Content-Type: application/json" \
  -d '{"amount_sats": 100000, "currency": "sbtc", "description": "Test"}'
```

### Database Migrations
- Always run migrations after pulling updates: `cd apps/api && npm run migration:run`
- Generate migrations after entity changes: `npm run migration:generate -- -n DescriptiveName`
- Migrations are in `apps/api/src/migrations/`

### Testing Strategy
- Unit tests for business logic in service classes
- Integration tests for API endpoints
- Mock Stacks API calls in tests
- Use seeded test data from `apps/api/src/scripts/seed.ts`

### Code Conventions
- TypeScript strict mode enabled across all packages
- ESLint and Prettier configured for consistent formatting
- Use NestJS dependency injection patterns in API
- Follow Next.js App Router conventions in checkout
- Shared types in `packages/shared/src/` prevent duplication

### Blockchain Integration
- Uses Hiro API for Stacks blockchain queries
- Transaction memo matching for payment correlation
- Watcher service polls every 10 seconds (`@Cron` decorator)
- Handles transaction confirmations and reorgs

### Security Considerations
- API keys hashed with PBKDF2 and salt
- Webhook payloads signed with HMAC SHA-256
- Input validation with class-validator DTOs
- No sensitive data in logs or error responses