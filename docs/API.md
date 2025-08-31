# sGate API Reference

Complete API documentation for the sGate sBTC Payment Gateway.

## Base URL

- **Development**: `http://localhost:4000`
- **Production**: `https://api.sgate.dev`

## Authentication

All API endpoints require authentication via API key in the Authorization header:

```
Authorization: Bearer sk_test_1234567890abcdef...
```

### Error Response Format

```json
{
  "error": "error_code",
  "message": "Human readable error message",
  "statusCode": 400
}
```

## Payment Intents

Payment Intents represent your intent to collect a payment from a customer.

### Create Payment Intent

Creates a new payment intent.

**Endpoint:** `POST /v1/payment_intents`

**Headers:**
```
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

**Request Body:**

```json
{
  "amount_sats": 100000,
  "currency": "sbtc",
  "description": "Order #1234",
  "metadata": {
    "order_id": "1234",
    "customer_id": "cust_abc123"
  },
  "success_url": "https://yoursite.com/success?payment_intent={id}",
  "cancel_url": "https://yoursite.com/cancel?payment_intent={id}",
  "expires_in": 900
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount_sats` | integer | Yes | Payment amount in satoshis |
| `currency` | string | Yes | Must be "sbtc" |
| `description` | string | No | Description of the payment |
| `metadata` | object | No | Key-value pairs for storing additional information |
| `success_url` | string | No | URL to redirect to after successful payment |
| `cancel_url` | string | No | URL to redirect to if payment is cancelled |
| `expires_in` | integer | No | Expiration time in seconds (default: 900 = 15 minutes) |

**Response:**

```json
{
  "id": "pi_1a2b3c4d5e6f",
  "client_secret": "pi_1a2b3c4d5e6f_secret_xyz789",
  "pay_address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "amount_sats": 100000,
  "currency": "sbtc",
  "status": "requires_payment",
  "description": "Order #1234",
  "metadata": {
    "order_id": "1234",
    "customer_id": "cust_abc123"
  },
  "expires_at": "2025-09-04T23:59:59.000Z",
  "checkout_url": "http://localhost:3000/pi/pi_1a2b3c4d5e6f",
  "success_url": "https://yoursite.com/success?payment_intent=pi_1a2b3c4d5e6f",
  "cancel_url": "https://yoursite.com/cancel?payment_intent=pi_1a2b3c4d5e6f",
  "created_at": "2025-09-04T23:44:59.000Z"
}
```

### Retrieve Payment Intent

Retrieves a payment intent by ID.

**Endpoint:** `GET /v1/payment_intents/{id}`

**Headers:**
```
Authorization: Bearer <API_KEY>
```

**Response:**

Same as create response, but with updated status:

```json
{
  "id": "pi_1a2b3c4d5e6f",
  "status": "confirmed",
  // ... other fields
}
```

**Payment Intent Statuses:**

| Status | Description |
|--------|-------------|
| `requires_payment` | Payment intent created, awaiting payment |
| `processing` | Payment received, awaiting confirmations |
| `confirmed` | Payment confirmed on blockchain |
| `failed` | Payment failed or insufficient |
| `expired` | Payment intent expired |

## Public Endpoints

These endpoints don't require API key authentication and are used by the checkout page.

### Get Payment Intent (Public)

**Endpoint:** `GET /public/payment_intents/{id}`

**Response:** Same as retrieve payment intent, but only returns public data.

## Health Check

### Health Status

Returns the health status of the API.

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-09-04T23:44:59.000Z"
}
```

## SDK Integration

### JavaScript/TypeScript

```bash
npm install @sgate/sdk
```

```javascript
import { SGateClient } from '@sgate/sdk';

const sgate = new SGateClient({
  apiKey: 'sk_test_...',
  apiBaseUrl: 'https://api.sgate.dev'
});

// Create payment intent
const paymentIntent = await sgate.createPaymentIntent({
  amount_sats: 100000,
  currency: 'sbtc',
  description: 'Premium Subscription'
});

console.log('Checkout URL:', paymentIntent.checkout_url);

// Retrieve payment intent
const retrieved = await sgate.retrievePaymentIntent(paymentIntent.id);
console.log('Status:', retrieved.status);
```

### cURL Examples

**Create Payment Intent:**

```bash
curl -X POST https://api.sgate.dev/v1/payment_intents \
  -H "Authorization: Bearer sk_test_1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "amount_sats": 100000,
    "currency": "sbtc",
    "description": "Test Payment"
  }'
```

**Retrieve Payment Intent:**

```bash
curl -X GET https://api.sgate.dev/v1/payment_intents/pi_1a2b3c4d5e6f \
  -H "Authorization: Bearer sk_test_1234567890abcdef"
```

## Rate Limits

- **Development**: No rate limits
- **Production**: 
  - 100 requests per minute per API key
  - 1000 requests per hour per API key

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693123456
```

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `bad_request` | Invalid request data |
| 401 | `unauthorized` | Invalid or missing API key |
| 404 | `not_found` | Resource not found |
| 422 | `validation_error` | Request validation failed |
| 429 | `rate_limit_exceeded` | Too many requests |
| 500 | `internal_error` | Internal server error |

### Payment Intent Specific Errors

| Error Code | Description |
|------------|-------------|
| `payment_intent_creation_failed` | Failed to create payment intent |
| `payment_intent_not_found` | Payment intent does not exist |
| `payment_intent_expired` | Payment intent has expired |
| `invalid_amount` | Amount must be positive integer |
| `invalid_currency` | Currency must be "sbtc" |

## Pagination

For endpoints that return lists (future feature):

```json
{
  "data": [...],
  "has_more": true,
  "url": "/v1/payment_intents",
  "total_count": 150
}
```

**Query Parameters:**
- `limit`: Number of items to return (1-100, default: 20)
- `starting_after`: ID of item to start after
- `ending_before`: ID of item to end before

## Webhooks

See [Webhook Documentation](WEBHOOKS.md) for detailed webhook information.

**Webhook Events:**
- `payment_intent.succeeded`
- `payment_intent.failed`  
- `payment_intent.expired`

## Interactive Documentation

Visit `/docs` on your API instance for interactive Swagger UI documentation:

- **Development**: http://localhost:4000/docs
- **Production**: https://api.sgate.dev/docs

## Postman Collection

Import this Postman collection for easy API testing:

```json
{
  "info": {
    "name": "sGate API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Payment Intent",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{api_key}}"
          },
          {
            "key": "Content-Type", 
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"amount_sats\": 100000,\n  \"currency\": \"sbtc\",\n  \"description\": \"Test Payment\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/v1/payment_intents",
          "host": ["{{base_url}}"],
          "path": ["v1", "payment_intents"]
        }
      }
    },
    {
      "name": "Retrieve Payment Intent",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{api_key}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/v1/payment_intents/{{payment_intent_id}}",
          "host": ["{{base_url}}"],
          "path": ["v1", "payment_intents", "{{payment_intent_id}}"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:4000"
    },
    {
      "key": "api_key", 
      "value": "sk_test_your_api_key_here"
    },
    {
      "key": "payment_intent_id",
      "value": "pi_1a2b3c4d5e6f"
    }
  ]
}
```

## API Versioning

- Current version: `v1`
- Version is specified in the URL path: `/v1/payment_intents`
- Breaking changes will result in a new version
- Old versions will be supported for at least 12 months

## Security Best Practices

### API Key Security

- **Never expose API keys in client-side code**
- Store API keys securely (environment variables, secret management)
- Use test keys for development
- Rotate keys regularly in production

### HTTPS Only

- All production API calls must use HTTPS
- Development allows HTTP for localhost only

### Request Validation

- All requests are validated against strict schemas
- Invalid data is rejected with detailed error messages
- SQL injection and XSS protection built-in

## Monitoring & Observability

### Request Logging

All API requests are logged with:
- Request ID
- Timestamp
- Method and path
- Response status
- Response time
- API key (hashed)

### Metrics

Available metrics (via `/metrics` endpoint):
- Request count by endpoint
- Response time percentiles  
- Error rates
- Active payment intents
- Webhook delivery success rates

## SDK Error Handling

```javascript
try {
  const paymentIntent = await sgate.createPaymentIntent({
    amount_sats: 100000,
    currency: 'sbtc'
  });
} catch (error) {
  if (error.message.includes('unauthorized')) {
    console.error('Invalid API key');
  } else if (error.message.includes('validation')) {
    console.error('Invalid request data:', error);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Testing

### Test API Keys

Test API keys start with `sk_test_` and only work in development mode.

### Test Payment Flows

1. Create payment intent with test API key
2. Open checkout URL
3. Use Stacks testnet for actual payments
4. Monitor webhook deliveries

### Mock Responses

For testing, you can mock API responses:

```javascript
// Mock successful payment intent creation
const mockPaymentIntent = {
  id: 'pi_test_123',
  status: 'requires_payment',
  amount_sats: 100000,
  checkout_url: 'http://localhost:3000/pi/pi_test_123'
};
```

---

This API documentation is automatically updated. For the latest version, visit `/docs` on your API instance or check the [GitHub repository](https://github.com/your-org/sgate).