# sGate Webhook Guide

Comprehensive guide to implementing and handling sGate webhooks.

## Overview

sGate uses webhooks to notify your application when events happen in your account. Webhooks are particularly useful for:

- Updating your database when payments are confirmed
- Sending confirmation emails to customers  
- Triggering fulfillment processes
- Updating subscription statuses
- Logging payment events

## Webhook Events

sGate sends webhooks for these payment events:

| Event | Description | When it's sent |
|-------|-------------|----------------|
| `payment_intent.succeeded` | Payment was successfully confirmed | After required blockchain confirmations |
| `payment_intent.failed` | Payment failed or was rejected | When payment validation fails |
| `payment_intent.expired` | Payment intent expired without payment | After expiration time passes |

## Webhook Payload

All webhook payloads follow this structure:

```json
{
  "id": "evt_1234567890",
  "event": "payment_intent.succeeded",
  "created": 1693123456,
  "data": {
    "object": {
      "id": "pi_abc123",
      "amount_sats": 250000,
      "currency": "sbtc",
      "status": "confirmed",
      "description": "Order #1234",
      "metadata": {
        "order_id": "1234",
        "customer_id": "cust_abc123"
      },
      "created_at": "2025-09-04T23:44:59.000Z"
    }
  }
}
```

### Payload Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique event identifier |
| `event` | string | Event type (see events table above) |
| `created` | integer | Unix timestamp when event was created |
| `data.object` | object | The payment intent object |

## Setting Up Webhooks

### 1. Create Webhook Endpoint

Create an endpoint in your application to receive webhooks:

```javascript
// Express.js example
app.post('/webhooks/sgate', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-sgate-signature'];
  const payload = req.body;
  
  // Verify webhook signature (see signature verification below)
  if (!verifySignature(payload, signature)) {
    return res.status(400).send('Invalid signature');
  }
  
  const event = JSON.parse(payload);
  
  // Handle the event
  switch (event.event) {
    case 'payment_intent.succeeded':
      handlePaymentSucceeded(event.data.object);
      break;
    case 'payment_intent.failed':
      handlePaymentFailed(event.data.object);
      break;
    case 'payment_intent.expired':
      handlePaymentExpired(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.event}`);
  }
  
  res.json({received: true});
});
```

### 2. Configure Webhook URL

Set your webhook URL when creating a merchant or update it via API:

```bash
# Update webhook URL for your merchant
curl -X PATCH http://localhost:4000/v1/merchants/me/webhook \
  -H "Authorization: Bearer sk_test_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "https://your-app.com/webhooks/sgate"
  }'
```

### 3. Test Your Endpoint

Test your webhook endpoint locally using tools like [ngrok](https://ngrok.com/) or [smee.io](https://smee.io):

```bash
# Using ngrok
ngrok http 3000

# Update webhook URL to ngrok URL
curl -X PATCH http://localhost:4000/v1/merchants/me/webhook \
  -H "Authorization: Bearer sk_test_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "https://abc123.ngrok.io/webhooks/sgate"
  }'
```

## Signature Verification

**Critical**: Always verify webhook signatures to ensure requests are from sGate.

### Signature Format

sGate includes a signature in the `X-sGate-Signature` header:

```
X-sGate-Signature: t=1693123456,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd
```

The signature format is:
- `t=` timestamp when the signature was generated
- `v1=` HMAC-SHA256 signature of the payload

### Verification Process

1. Extract timestamp and signature from header
2. Check timestamp is within tolerance (default: 5 minutes)
3. Compute expected signature using your webhook secret
4. Compare signatures using timing-safe comparison

### Implementation Examples

**Node.js:**

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret, tolerance = 300) {
  try {
    const parts = signature.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));

    if (!timestampPart || !signaturePart) {
      return false;
    }

    const timestamp = parseInt(timestampPart.split('=')[1], 10);
    const providedSignature = signaturePart.split('=')[1];
    
    // Check timestamp tolerance (prevent replay attacks)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) {
      console.warn('Webhook timestamp outside tolerance');
      return false;
    }

    // Compute expected signature
    const payloadToSign = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadToSign)
      .digest('hex');
    
    // Timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature), 
      Buffer.from(providedSignature)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Usage
app.post('/webhooks/sgate', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-sgate-signature'];
  const payload = req.body.toString();
  const secret = process.env.SGATE_WEBHOOK_SECRET;
  
  if (!verifyWebhookSignature(payload, signature, secret)) {
    return res.status(400).send('Invalid signature');
  }
  
  // Process webhook...
  res.json({received: true});
});
```

**Python:**

```python
import hmac
import hashlib
import time
import json

def verify_webhook_signature(payload, signature, secret, tolerance=300):
    try:
        parts = signature.split(',')
        timestamp_part = next(p for p in parts if p.startswith('t='))
        signature_part = next(p for p in parts if p.startswith('v1='))
        
        timestamp = int(timestamp_part.split('=')[1])
        provided_signature = signature_part.split('=')[1]
        
        # Check timestamp tolerance
        if abs(time.time() - timestamp) > tolerance:
            return False
        
        # Compute expected signature
        payload_to_sign = f"{timestamp}.{payload}"
        expected_signature = hmac.new(
            secret.encode(),
            payload_to_sign.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Timing-safe comparison
        return hmac.compare_digest(expected_signature, provided_signature)
    except:
        return False

# Flask example
@app.route('/webhooks/sgate', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-sGate-Signature')
    payload = request.get_data(as_text=True)
    secret = os.environ['SGATE_WEBHOOK_SECRET']
    
    if not verify_webhook_signature(payload, signature, secret):
        return 'Invalid signature', 400
    
    event = json.loads(payload)
    # Process event...
    
    return {'received': True}
```

**PHP:**

```php
function verifyWebhookSignature($payload, $signature, $secret, $tolerance = 300) {
    $parts = explode(',', $signature);
    $timestamp = null;
    $providedSignature = null;
    
    foreach ($parts as $part) {
        if (strpos($part, 't=') === 0) {
            $timestamp = intval(substr($part, 2));
        } elseif (strpos($part, 'v1=') === 0) {
            $providedSignature = substr($part, 3);
        }
    }
    
    if (!$timestamp || !$providedSignature) {
        return false;
    }
    
    // Check timestamp tolerance
    if (abs(time() - $timestamp) > $tolerance) {
        return false;
    }
    
    // Compute expected signature
    $payloadToSign = $timestamp . '.' . $payload;
    $expectedSignature = hash_hmac('sha256', $payloadToSign, $secret);
    
    // Timing-safe comparison
    return hash_equals($expectedSignature, $providedSignature);
}

// Usage
$signature = $_SERVER['HTTP_X_SGATE_SIGNATURE'];
$payload = file_get_contents('php://input');
$secret = $_ENV['SGATE_WEBHOOK_SECRET'];

if (!verifyWebhookSignature($payload, $signature, $secret)) {
    http_response_code(400);
    echo 'Invalid signature';
    exit;
}

$event = json_decode($payload, true);
// Process event...
```

## Event Handling

### Payment Succeeded

When a payment is confirmed:

```javascript
function handlePaymentSucceeded(paymentIntent) {
  console.log(`Payment ${paymentIntent.id} succeeded!`);
  
  // Update your database
  await updateOrderStatus(paymentIntent.metadata.order_id, 'paid');
  
  // Send confirmation email
  await sendConfirmationEmail(paymentIntent.metadata.customer_id);
  
  // Trigger fulfillment
  await fulfillOrder(paymentIntent.metadata.order_id);
  
  // Update analytics
  await trackPayment(paymentIntent);
}
```

### Payment Failed

When a payment fails:

```javascript
function handlePaymentFailed(paymentIntent) {
  console.log(`Payment ${paymentIntent.id} failed`);
  
  // Update order status
  await updateOrderStatus(paymentIntent.metadata.order_id, 'failed');
  
  // Notify customer
  await sendPaymentFailedEmail(paymentIntent.metadata.customer_id);
  
  // Log for analysis
  await logFailedPayment(paymentIntent);
}
```

### Payment Expired

When a payment intent expires:

```javascript
function handlePaymentExpired(paymentIntent) {
  console.log(`Payment ${paymentIntent.id} expired`);
  
  // Update order status
  await updateOrderStatus(paymentIntent.metadata.order_id, 'expired');
  
  // Send reminder email with new payment link
  await sendPaymentReminderEmail(paymentIntent.metadata.customer_id);
}
```

## Retry Logic

sGate automatically retries failed webhook deliveries:

- **Retry Schedule**: Exponential backoff (1s, 2s, 4s, 8s, 16s...)
- **Max Attempts**: 3 attempts by default
- **Timeout**: 5 seconds per attempt
- **Success**: HTTP 2xx response
- **Failure**: Any other response or timeout

### Retry Configuration

Configure retry behavior in your environment:

```bash
WEBHOOK_RETRY_ATTEMPTS=5
WEBHOOK_TIMEOUT_MS=10000
```

### Handling Retries

Your webhook endpoint should be idempotent:

```javascript
// Use webhook event ID to prevent duplicate processing
const processedEvents = new Set(); // In production, use database

app.post('/webhooks/sgate', (req, res) => {
  const event = JSON.parse(req.body);
  
  // Check if already processed
  if (processedEvents.has(event.id)) {
    return res.json({received: true, already_processed: true});
  }
  
  // Process event
  handleEvent(event);
  
  // Mark as processed
  processedEvents.add(event.id);
  
  res.json({received: true});
});
```

## Testing Webhooks

### Local Testing with smee.io

1. Go to https://smee.io and create a new channel
2. Install smee client: `npm install -g smee-client`
3. Start proxy: `smee --url https://smee.io/abc123 --target http://localhost:3000/webhooks`
4. Update webhook URL to smee URL

### Testing with ngrok

```bash
# Install ngrok
npm install -g ngrok

# Expose local port
ngrok http 3000

# Update webhook URL to ngrok URL
curl -X PATCH http://localhost:4000/v1/merchants/me/webhook \
  -H "Authorization: Bearer sk_test_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"webhook_url": "https://abc123.ngrok.io/webhooks/sgate"}'
```

### Manual Testing

Create a test payment and monitor webhook delivery:

```bash
# Create payment intent
curl -X POST http://localhost:4000/v1/payment_intents \
  -H "Authorization: Bearer sk_test_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "amount_sats": 10000,
    "currency": "sbtc",
    "description": "Webhook Test",
    "metadata": {"test": "webhook"}
  }'

# Use checkout URL to complete payment or manually trigger webhook
```

## Security Best Practices

### Always Verify Signatures

Never process webhooks without signature verification:

```javascript
// ❌ Bad - vulnerable to attacks
app.post('/webhooks/sgate', (req, res) => {
  const event = req.body;
  handleEvent(event); // Don't do this!
  res.json({received: true});
});

// ✅ Good - secure
app.post('/webhooks/sgate', (req, res) => {
  if (!verifySignature(req.body, req.headers['x-sgate-signature'])) {
    return res.status(400).send('Invalid signature');
  }
  
  const event = JSON.parse(req.body);
  handleEvent(event);
  res.json({received: true});
});
```

### Use HTTPS

Always use HTTPS for webhook endpoints in production:

```bash
# ✅ Good
webhook_url="https://your-app.com/webhooks/sgate"

# ❌ Bad
webhook_url="http://your-app.com/webhooks/sgate"
```

### Store Webhook Secrets Securely

Never hardcode webhook secrets:

```javascript
// ❌ Bad
const secret = 'wh_secret_abc123';

// ✅ Good
const secret = process.env.SGATE_WEBHOOK_SECRET;
```

### Implement Idempotency

Process each webhook event only once:

```javascript
// Database-backed idempotency
async function handleWebhook(event) {
  const existing = await db.webhookEvents.findOne({
    where: { event_id: event.id }
  });
  
  if (existing) {
    return { already_processed: true };
  }
  
  // Process event
  await processEvent(event);
  
  // Mark as processed
  await db.webhookEvents.create({
    event_id: event.id,
    processed_at: new Date()
  });
}
```

## Monitoring Webhooks

### Log Webhook Deliveries

```javascript
app.post('/webhooks/sgate', (req, res) => {
  const startTime = Date.now();
  const event = JSON.parse(req.body);
  
  try {
    handleEvent(event);
    
    console.log('Webhook processed successfully:', {
      event_id: event.id,
      event_type: event.event,
      processing_time: Date.now() - startTime
    });
    
    res.json({received: true});
  } catch (error) {
    console.error('Webhook processing failed:', {
      event_id: event.id,
      error: error.message,
      processing_time: Date.now() - startTime
    });
    
    res.status(500).send('Processing failed');
  }
});
```

### Webhook Health Check

Monitor webhook endpoint health:

```javascript
app.get('/webhooks/sgate/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});
```

## Troubleshooting

### Common Issues

**Signature Verification Failing:**
- Check webhook secret is correct
- Ensure raw request body is used (not parsed JSON)
- Verify timestamp tolerance isn't too strict

**Missing Webhooks:**
- Check webhook URL is accessible from internet
- Verify HTTPS certificate is valid
- Check firewall/security group settings

**Duplicate Processing:**
- Implement idempotency using event ID
- Check for race conditions in processing logic

**Timeout Issues:**
- Keep webhook processing under 5 seconds
- Use queues for long-running tasks
- Return success immediately, process asynchronously

### Debug Webhook Issues

```javascript
// Add detailed logging
app.post('/webhooks/sgate', express.raw({type: 'application/json'}), (req, res) => {
  console.log('Webhook received:', {
    headers: req.headers,
    body_length: req.body.length,
    signature: req.headers['x-sgate-signature']
  });
  
  try {
    const isValid = verifySignature(req.body, req.headers['x-sgate-signature']);
    console.log('Signature valid:', isValid);
    
    if (!isValid) {
      return res.status(400).send('Invalid signature');
    }
    
    const event = JSON.parse(req.body);
    console.log('Event parsed:', event.id, event.event);
    
    // Process...
    
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).send('Processing error');
  }
});
```

## Production Checklist

- [ ] Webhook signature verification implemented
- [ ] HTTPS endpoint configured
- [ ] Webhook secret stored securely
- [ ] Idempotency implemented
- [ ] Error handling and logging in place
- [ ] Webhook endpoint health monitoring
- [ ] Queue system for long-running tasks
- [ ] Retry logic tested
- [ ] Webhook deliveries monitored

---

For additional webhook support, see the [API Documentation](API.md) or contact support.