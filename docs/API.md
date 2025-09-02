# sGate API Reference

Complete API documentation for the sGate sBTC Payment Gateway.

## Base URLs

- **Development**: `http://localhost:4000`
- **Production**: `https://api.sgate.com`

## Authentication

All merchant API endpoints require authentication via API key in the Authorization header:

```
Authorization: Bearer sk_test_1234567890abcdef...
```

### API Key Format
- **Test keys**: Start with `sk_test_` (development only)
- **Live keys**: Start with `sk_live_` (production only)

### Error Response Format

All API errors follow this consistent format:

```json
{
  "error": {
    "type": "validation_error",
    "message": "Amount must be a positive integer",
    "details": {
      "field": "amount_sats",
      "code": "invalid_type"
    }
  },
  "request_id": "req_abc123def456",
  "timestamp": "2025-09-04T23:44:59.000Z",
  "path": "/v1/payment_intents",
  "status": 400
}
```

## Payment Intents API

Payment Intents represent your intent to collect a payment from a customer. They track the payment lifecycle from creation to confirmation.

### Create Payment Intent

Creates a new payment intent with a unique checkout URL.

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
  "description": "Premium Subscription - Monthly",
  "metadata": {
    "order_id": "order_12345",
    "customer_id": "cust_abc123",
    "plan": "premium"
  },
  "success_url": "https://yourapp.com/success?payment_intent={id}",
  "cancel_url": "https://yourapp.com/cancel?payment_intent={id}",
  "expires_in": 900
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount_sats` | integer | Yes | Payment amount in satoshis (min: 1, max: 2,100,000,000,000,000) |
| `currency` | string | Yes | Must be "sbtc" |
| `description` | string | No | Human-readable description (max: 500 chars) |
| `metadata` | object | No | Key-value pairs for additional data (max: 20 keys, 500 chars per value) |
| `success_url` | string | No | Redirect URL on successful payment. Use `{id}` for payment intent ID |
| `cancel_url` | string | No | Redirect URL on cancelled payment. Use `{id}` for payment intent ID |
| `expires_in` | integer | No | Expiration time in seconds (default: 900, max: 86400) |

**Response:**

```json
{
  "id": "pi_1a2b3c4d5e6f7g8h",
  "client_secret": "pi_1a2b3c4d5e6f7g8h_secret_xyz789abc",
  "pay_address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "amount_sats": 100000,
  "currency": "sbtc",
  "status": "requires_payment",
  "description": "Premium Subscription - Monthly",
  "metadata": {
    "order_id": "order_12345",
    "customer_id": "cust_abc123",
    "plan": "premium"
  },
  "expires_at": "2025-09-04T23:59:59.000Z",
  "checkout_url": "https://checkout.sgate.com/pi/pi_1a2b3c4d5e6f7g8h",
  "success_url": "https://yourapp.com/success?payment_intent=pi_1a2b3c4d5e6f7g8h",
  "cancel_url": "https://yourapp.com/cancel?payment_intent=pi_1a2b3c4d5e6f7g8h",
  "created_at": "2025-09-04T23:44:59.000Z"
}
```

### Retrieve Payment Intent

Retrieves a payment intent by ID with current status.

**Endpoint:** `GET /v1/payment_intents/{id}`

**Headers:**
```
Authorization: Bearer <API_KEY>
```

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | The payment intent ID (e.g., `pi_1a2b3c4d5e6f7g8h`) |

**Response:**

Same structure as create response, with updated status:

```json
{
  "id": "pi_1a2b3c4d5e6f7g8h",
  "status": "confirmed",
  "payments": [
    {
      "id": "pay_xyz789abc123",
      "tx_id": "0x1234567890abcdef...",
      "amount_sats": 100000,
      "confirmations": 3,
      "status": "confirmed",
      "created_at": "2025-09-04T23:50:30.000Z"
    }
  ]
}
```

### List Payment Intents

Retrieves a paginated list of payment intents for the authenticated merchant.

**Endpoint:** `GET /v1/payment_intents`

**Headers:**
```
Authorization: Bearer <API_KEY>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Number of items per page (1-100, default: 20) |
| `page` | integer | Page number (1-based, default: 1) |
| `status` | string | Filter by status: `requires_payment`, `processing`, `confirmed`, `failed`, `expired` |
| `from_date` | string | ISO 8601 date string for start of date range |
| `to_date` | string | ISO 8601 date string for end of date range |

**Response:**

```json
{
  "data": [
    {
      "id": "pi_1a2b3c4d5e6f7g8h",
      "amount_sats": 100000,
      "status": "confirmed",
      "description": "Premium Subscription - Monthly",
      "created_at": "2025-09-04T23:44:59.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "pages": 3,
  "limit": 20
}
```

## Payment Intent Statuses

| Status | Description | Webhook Event |
|--------|-------------|---------------|
| `requires_payment` | Payment intent created, awaiting customer payment | - |
| `processing` | Payment received, awaiting blockchain confirmations | - |
| `confirmed` | Payment confirmed with required confirmations | `payment_intent.succeeded` |
| `failed` | Payment failed (insufficient amount or other error) | `payment_intent.failed` |
| `expired` | Payment intent expired before payment received | `payment_intent.expired` |

## Public API

These endpoints don't require API key authentication and are used by the checkout interface.

### Get Payment Intent (Public)

Retrieves public payment intent data for the checkout page.

**Endpoint:** `GET /public/payment_intents/{id}`

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | The payment intent ID |

**Response:**

```json
{
  "id": "pi_1a2b3c4d5e6f7g8h",
  "pay_address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "amount_sats": 100000,
  "currency": "sbtc",
  "status": "requires_payment",
  "description": "Premium Subscription - Monthly",
  "expires_at": "2025-09-04T23:59:59.000Z",
  "memo_hex": "70695f31613262336334643565366637673868",
  "success_url": "https://yourapp.com/success?payment_intent=pi_1a2b3c4d5e6f7g8h",
  "cancel_url": "https://yourapp.com/cancel?payment_intent=pi_1a2b3c4d5e6f7g8h"
}
```

**Note:** Sensitive fields like `client_secret` and `metadata` are not included in public responses.

## Health Check

### API Health Status

Returns the operational status of the API and its dependencies.

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-09-04T23:44:59.000Z",
  "services": {
    "database": "healthy",
    "blockchain": "healthy", 
    "cache": "healthy"
  },
  "uptime": 86400,
  "memory": {
    "rss": 134217728,
    "heapTotal": 67108864,
    "heapUsed": 45088768,
    "external": 8388608
  },
  "version": "1.0.0"
}
```

**Service Status Values:**
- `healthy`: Service is operational
- `unhealthy`: Service is down or experiencing issues
- `degraded`: Service is operational but with reduced performance

## SDK Integration

### JavaScript/TypeScript SDK

Install the official SDK:

```bash
npm install @sgate/sdk
```

#### Basic Usage

```typescript
import { SGateClient } from '@sgate/sdk';

const sgate = new SGateClient({
  apiKey: 'sk_test_1234567890abcdef',
  apiBaseUrl: 'https://api.sgate.com'
});

// Create payment intent
const paymentIntent = await sgate.createPaymentIntent({
  amount_sats: 100000,
  currency: 'sbtc',
  description: 'Premium Subscription',
  metadata: {
    customer_id: 'cust_12345',
    subscription_plan: 'premium'
  }
});

console.log('Checkout URL:', paymentIntent.checkout_url);

// Poll for payment status
const checkPayment = async () => {
  const updated = await sgate.retrievePaymentIntent(paymentIntent.id);
  
  if (updated.status === 'confirmed') {
    console.log('Payment confirmed!');
    return;
  }
  
  if (updated.status === 'failed' || updated.status === 'expired') {
    console.log('Payment failed:', updated.status);
    return;
  }
  
  // Continue polling
  setTimeout(checkPayment, 3000);
};

checkPayment();
```

#### Error Handling

```typescript
try {
  const paymentIntent = await sgate.createPaymentIntent({
    amount_sats: -100, // Invalid amount
    currency: 'sbtc'
  });
} catch (error) {
  if (error instanceof SGateError) {
    console.error('sGate API Error:', {
      type: error.type,
      message: error.message,
      requestId: error.requestId,
      statusCode: error.statusCode
    });
  } else {
    console.error('Network Error:', error.message);
  }
}
```

### cURL Examples

#### Create Payment Intent

```bash
curl -X POST https://api.sgate.com/v1/payment_intents \
  -H "Authorization: Bearer sk_test_1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "amount_sats": 100000,
    "currency": "sbtc",
    "description": "Test Payment",
    "success_url": "https://example.com/success",
    "cancel_url": "https://example.com/cancel"
  }'
```

#### Retrieve Payment Intent

```bash
curl -X GET https://api.sgate.com/v1/payment_intents/pi_1a2b3c4d5e6f7g8h \
  -H "Authorization: Bearer sk_test_1234567890abcdef"
```

#### List Payment Intents

```bash
curl -X GET "https://api.sgate.com/v1/payment_intents?limit=10&status=confirmed" \
  -H "Authorization: Bearer sk_test_1234567890abcdef"
```

## Rate Limiting

API requests are rate-limited to ensure fair usage and system stability.

### Rate Limits

| Environment | Endpoint Type | Limit |
|-------------|---------------|-------|
| Development | All | No limits |
| Production | Payment Intent Creation | 100 requests/minute |
| Production | Payment Intent Retrieval | 1000 requests/minute |
| Production | Public API | 500 requests/minute |
| Production | Other endpoints | 200 requests/minute |

### Rate Limit Headers

Rate limit information is included in all API responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693123456
X-RateLimit-Window: 60
```

### Handling Rate Limits

When you exceed the rate limit, the API returns a 429 status code:

```json
{
  "error": {
    "type": "rate_limit_exceeded",
    "message": "Too many requests. Please try again in 30 seconds."
  },
  "request_id": "req_abc123",
  "timestamp": "2025-09-04T23:44:59.000Z",
  "retry_after": 30
}
```

**Best Practices:**
- Implement exponential backoff for retries
- Cache payment intent data to reduce API calls
- Use webhooks instead of polling for status updates

## Error Codes

### HTTP Status Codes

| Status | Error Type | Description |
|--------|------------|-------------|
| 400 | `bad_request` | Invalid request format or missing required fields |
| 401 | `unauthorized` | Invalid or missing API key |
| 403 | `forbidden` | API key doesn't have required permissions |
| 404 | `not_found` | Resource not found |
| 409 | `conflict` | Resource already exists or conflicting state |
| 422 | `validation_error` | Request data validation failed |
| 429 | `rate_limit_exceeded` | Too many requests |
| 500 | `internal_server_error` | Unexpected server error |
| 502 | `bad_gateway` | Upstream service unavailable |
| 503 | `service_unavailable` | Service temporarily unavailable |

### Payment-Specific Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `payment_intent_not_found` | 404 | Payment intent ID doesn't exist |
| `payment_intent_expired` | 400 | Payment intent has expired |
| `invalid_amount` | 422 | Amount must be positive integer |
| `invalid_currency` | 422 | Currency must be "sbtc" |
| `invalid_expires_in` | 422 | Expires in must be between 60 and 86400 seconds |
| `metadata_too_large` | 422 | Metadata exceeds size limits |
| `description_too_long` | 422 | Description exceeds 500 characters |

## Webhooks

sGate sends HTTP POST webhooks to notify your application of payment events. See [Webhook Documentation](WEBHOOKS.md) for complete details.

### Webhook Events

| Event | Description | When Triggered |
|-------|-------------|----------------|
| `payment_intent.succeeded` | Payment confirmed on blockchain | Payment receives required confirmations |
| `payment_intent.failed` | Payment failed | Insufficient amount, wrong recipient, or other failure |
| `payment_intent.expired` | Payment intent expired | Payment intent expires before payment received |

### Webhook Payload Example

```json
{
  "id": "evt_1234567890abcdef",
  "event": "payment_intent.succeeded",
  "created": 1693123456,
  "data": {
    "object": {
      "id": "pi_1a2b3c4d5e6f7g8h",
      "amount_sats": 100000,
      "currency": "sbtc",
      "status": "confirmed",
      "metadata": {
        "order_id": "12345"
      },
      "created_at": "2025-09-04T23:44:59.000Z"
    }
  }
}
```

## Interactive Documentation

Visit the Swagger UI for interactive API testing:

- **Development**: http://localhost:4000/docs
- **Production**: https://api.sgate.com/docs

The Swagger UI provides:
- Interactive request/response testing
- Detailed schema documentation
- Authentication configuration
- Example payloads for all endpoints

## Testing & Development

### Test Mode

Use test API keys (prefixed with `sk_test_`) for development and testing:

- Test keys only work with testnet sBTC
- No real payments are processed
- All webhook events are fired normally
- Rate limits are disabled in development

### Test Payment Flow

1. **Create Payment Intent** using test API key
2. **Open Checkout URL** in browser
3. **Send sBTC** on Stacks testnet with the provided memo
4. **Monitor Status** via API polling or webhooks
5. **Verify Completion** with final payment intent retrieval

### Mock Data

For integration testing, you can use these sample payment intent IDs:

```javascript
// These will work with test API keys in development
const testPaymentIntents = {
  requires_payment: 'pi_test_requires_payment',
  processing: 'pi_test_processing', 
  confirmed: 'pi_test_confirmed',
  failed: 'pi_test_failed',
  expired: 'pi_test_expired'
};
```

## Security Best Practices

### API Key Security

✅ **Do:**
- Store API keys in environment variables or secure vaults
- Use different keys for test and production environments
- Rotate keys periodically (every 90 days recommended)
- Monitor API key usage for anomalies

❌ **Don't:**
- Hard-code API keys in your source code
- Log API keys in application logs
- Share API keys via email or chat
- Use production keys in development

### Request Security

✅ **Do:**
- Always use HTTPS in production
- Validate webhook signatures
- Implement request timeouts (10 seconds recommended)
- Log request IDs for debugging

❌ **Don't:**
- Make API calls from client-side JavaScript
- Ignore SSL certificate validation
- Store sensitive data in metadata fields
- Retry requests indefinitely

## Monitoring & Observability

### Request Logging

All API requests are logged with structured data:

```json
{
  "timestamp": "2025-09-04T23:44:59.000Z",
  "level": "info",
  "method": "POST",
  "url": "/v1/payment_intents",
  "status": 200,
  "duration": 145,
  "requestId": "req_abc123def456",
  "merchantId": "merch_xyz789",
  "userAgent": "sGate-SDK/1.0.0",
  "ip": "192.168.1.100"
}
```

### Metrics Endpoint

Production API includes metrics at `/metrics` (Prometheus format):

```
# HELP sgate_requests_total Total number of HTTP requests
# TYPE sgate_requests_total counter
sgate_requests_total{method="POST",endpoint="/v1/payment_intents",status="200"} 1542

# HELP sgate_request_duration_seconds Request duration in seconds
# TYPE sgate_request_duration_seconds histogram
sgate_request_duration_seconds_bucket{method="POST",endpoint="/v1/payment_intents",le="0.1"} 980
```

### Status Page

Check service status at: https://status.sgate.com

- Real-time API availability
- Recent incident history
- Planned maintenance windows
- Performance metrics

---

## Support & Resources

- **Documentation**: https://docs.sgate.com
- **Status Page**: https://status.sgate.com
- **SDK Repository**: https://github.com/sgate/sdk-js
- **Issue Tracking**: https://github.com/sgate/sgate/issues

For technical support, include your request ID in all communications.