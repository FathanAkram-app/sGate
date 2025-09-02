# @sgate/shared

Shared types, DTOs, and utilities for sGate sBTC Payment Gateway.

## Installation

```bash
npm install @sgate/shared
```

## Usage

This package contains shared TypeScript types and utilities used across the sGate ecosystem.

```typescript
import { PaymentIntentStatus, CreatePaymentIntentDto } from '@sgate/shared';

// Use shared types
const status: PaymentIntentStatus = 'confirmed';

// Use DTOs for API requests
const createRequest: CreatePaymentIntentDto = {
  amount_sats: 100000,
  currency: 'sbtc',
  description: 'Test payment'
};
```

## Exports

### Types
- `PaymentIntentStatus`
- `PaymentIntentResponseDto`
- `CreatePaymentIntentDto`
- And more...

### Utilities
- `generateId()`
- `generateClientSecret()`
- `encodePaymentIntentMemo()`
- `hashApiKey()`
- `verifyApiKey()`

## License

MIT License - see [LICENSE](LICENSE) file for details.