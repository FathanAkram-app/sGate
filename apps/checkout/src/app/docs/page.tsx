'use client';

import { Code2, Book, ArrowRight, Copy, Check } from 'lucide-react';
import { useState } from 'react';

function CodeBlock({ children, language = 'javascript' }: { children: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-gray-900 rounded-lg p-4 text-sm overflow-x-auto">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors"
        title="Copy to clipboard"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
      <pre className="text-gray-100">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-sgate-blue to-blue-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-sgate-orange rounded-xl flex items-center justify-center">
              <Book className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">sGate SDK Documentation</h1>
              <p className="text-blue-200 text-lg mt-2">
                Integrate sBTC payments into your application
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Quick Start</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">1. Installation</h3>
              <CodeBlock language="bash">
{`npm install @sgate/sdk`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2. Basic Usage</h3>
              <CodeBlock>
{`import { sGate } from '@sgate/sdk';

// Create a payment button
sGate.PaymentButton('#payment-btn', {
  apiKey: 'your-api-key',
  amount_sats: 100000,
  description: 'Premium subscription',
  success_url: 'https://yoursite.com/success',
  cancel_url: 'https://yoursite.com/cancel'
});`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3. HTML</h3>
              <CodeBlock language="html">
{`<div id="payment-btn"></div>
<script src="https://cdn.jsdelivr.net/npm/@sgate/sdk"></script>`}
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* SDK Components */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">SDK Components</h2>
          
          <div className="grid gap-8">
            {/* Payment Button */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">PaymentButton</h3>
              <p className="text-gray-600 mb-4">
                A simple button that creates payment intents and redirects to checkout.
              </p>
              
              <CodeBlock>
{`import { sGate } from '@sgate/sdk';

const paymentButton = sGate.PaymentButton('#my-button', {
  apiKey: 'sk_test_...',
  amount_sats: 50000,
  description: 'Coffee purchase',
  success_url: 'https://mystore.com/success',
  cancel_url: 'https://mystore.com/cart',
  theme: 'dark', // 'light' | 'dark' | 'minimal'
  size: 'large', // 'small' | 'medium' | 'large'
  onSuccess: (paymentIntent) => {
    console.log('Payment created:', paymentIntent);
  },
  onError: (error) => {
    console.error('Payment failed:', error);
  }
});`}
              </CodeBlock>
            </div>

            {/* Payment Form */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">PaymentForm</h3>
              <p className="text-gray-600 mb-4">
                A complete form with amount input, description, and payment button.
              </p>
              
              <CodeBlock>
{`const paymentForm = sGate.PaymentForm('#payment-form', {
  apiKey: 'sk_test_...',
  currency: 'sbtc',
  success_url: 'https://mystore.com/success',
  cancel_url: 'https://mystore.com/cancel',
  allowCustomAmount: true,
  defaultAmount: 25000,
  theme: 'light',
  onPaymentCreate: (paymentIntent) => {
    // Track payment creation
    analytics.track('payment_created', {
      amount: paymentIntent.amount_sats,
      id: paymentIntent.id
    });
  }
});`}
              </CodeBlock>
            </div>

            {/* Payment Modal */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">PaymentModal</h3>
              <p className="text-gray-600 mb-4">
                A modal dialog for seamless in-page payments without redirects.
              </p>
              
              <CodeBlock>
{`const modal = sGate.PaymentModal({
  apiKey: 'sk_test_...',
  amount_sats: 75000,
  description: 'Premium features unlock',
  onSuccess: (paymentIntent) => {
    // Handle successful payment
    window.location.href = '/dashboard?upgraded=true';
  },
  onCancel: () => {
    console.log('Payment cancelled');
  }
});

// Show the modal
document.getElementById('upgrade-btn').onclick = () => {
  modal.show();
};`}
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* API Client */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">API Client</h2>
          
          <p className="text-gray-600 mb-6">
            For server-side or advanced client-side usage, use the SGateClient directly.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Initialize Client</h3>
              <CodeBlock>
{`import { SGateClient } from '@sgate/sdk';

const client = new SGateClient({
  apiKey: 'sk_test_...',
  apiBaseUrl: 'https://api.sgate.dev' // Optional, defaults to localhost:4003
});`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Create Payment Intent</h3>
              <CodeBlock>
{`const paymentIntent = await client.createPaymentIntent({
  amount_sats: 100000,
  currency: 'sbtc',
  description: 'Order #12345',
  success_url: 'https://mystore.com/success',
  cancel_url: 'https://mystore.com/cancel',
  expires_in: 900, // 15 minutes
  metadata: {
    order_id: '12345',
    customer_id: 'cust_456'
  }
});

console.log('Checkout URL:', paymentIntent.checkout_url);`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Retrieve Payment Intent</h3>
              <CodeBlock>
{`const paymentIntent = await client.retrievePaymentIntent('pi_1234567890');
console.log('Status:', paymentIntent.status);
console.log('Amount:', paymentIntent.amount_sats);`}
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* Configuration */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Configuration</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Environment Setup</h3>
              <CodeBlock language="bash">
{`# Development
SGATE_API_KEY=sk_test_your_key_here
SGATE_API_BASE_URL=http://localhost:4003

# Production  
SGATE_API_KEY=sk_live_your_key_here
SGATE_API_BASE_URL=https://api.sgate.dev`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Theme Customization</h3>
              <CodeBlock>
{`// Custom CSS for themes
.sgate-button.light {
  background: #f97316;
  color: white;
  border: none;
  border-radius: 8px;
}

.sgate-button.dark {
  background: #1f2937;
  color: white;
  border: 1px solid #374151;
}

.sgate-button.minimal {
  background: transparent;
  color: #374151;
  border: 1px solid #d1d5db;
}`}
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* Examples */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Complete Examples</h2>
          
          <div className="space-y-8">
            {/* E-commerce Example */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">E-commerce Integration</h3>
              <CodeBlock>
{`// Product page checkout
import { sGate } from '@sgate/sdk';

class ProductCheckout {
  constructor(productId, price) {
    this.productId = productId;
    this.price = price;
    this.initializePayment();
  }

  initializePayment() {
    sGate.PaymentButton('#checkout-button', {
      apiKey: process.env.SGATE_API_KEY,
      amount_sats: this.price,
      description: \`Product \${this.productId}\`,
      success_url: \`/orders/success?product=\${this.productId}\`,
      cancel_url: \`/products/\${this.productId}\`,
      theme: 'light',
      size: 'large',
      onSuccess: (paymentIntent) => {
        // Track conversion
        gtag('event', 'purchase', {
          transaction_id: paymentIntent.id,
          value: paymentIntent.amount_sats,
          currency: 'sats'
        });
      },
      onError: (error) => {
        // Show error message
        this.showError(error.message);
      }
    });
  }

  showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}`}
              </CodeBlock>
            </div>

            {/* Subscription Example */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Subscription Service</h3>
              <CodeBlock>
{`// Subscription upgrade flow
const subscriptionPlans = {
  basic: { amount: 50000, name: 'Basic Plan' },
  premium: { amount: 150000, name: 'Premium Plan' },
  enterprise: { amount: 300000, name: 'Enterprise Plan' }
};

function setupSubscriptionUpgrade(planType) {
  const plan = subscriptionPlans[planType];
  
  return sGate.PaymentModal({
    apiKey: 'sk_test_...',
    amount_sats: plan.amount,
    description: \`Upgrade to \${plan.name}\`,
    success_url: '/dashboard?upgraded=true',
    cancel_url: '/pricing',
    metadata: {
      plan_type: planType,
      user_id: getCurrentUserId()
    },
    onSuccess: (paymentIntent) => {
      // Update user subscription
      updateUserSubscription(planType, paymentIntent.id);
      
      // Show success message
      showNotification(\`Welcome to \${plan.name}!\`, 'success');
    }
  });
}

// Usage
document.querySelectorAll('.upgrade-btn').forEach(btn => {
  btn.onclick = () => {
    const plan = btn.dataset.plan;
    const modal = setupSubscriptionUpgrade(plan);
    modal.show();
  };
});`}
              </CodeBlock>
            </div>

            {/* Donation Example */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Donation Widget</h3>
              <CodeBlock>
{`// Flexible donation form
sGate.PaymentForm('#donation-form', {
  apiKey: 'sk_test_...',
  allowCustomAmount: true,
  defaultAmount: 25000,
  success_url: '/thank-you',
  cancel_url: '/donate',
  theme: 'minimal',
  presets: [10000, 25000, 50000, 100000], // Preset amounts
  onPaymentCreate: (paymentIntent) => {
    // Store donation info
    localStorage.setItem('donation_id', paymentIntent.id);
    
    // Track donation
    mixpanel.track('Donation Started', {
      amount_sats: paymentIntent.amount_sats,
      description: paymentIntent.description
    });
  }
});`}
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* Webhooks */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Webhooks</h2>
          
          <p className="text-gray-600 mb-6">
            Handle payment confirmations and status updates server-side with webhooks.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Express.js Webhook Handler</h3>
              <CodeBlock>
{`const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.raw({ type: 'application/json' }));

app.post('/webhook/sgate', (req, res) => {
  const signature = req.headers['sgate-signature'];
  const payload = req.body;
  
  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.SGATE_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = JSON.parse(payload);
  
  switch (event.type) {
    case 'payment_intent.confirmed':
      handlePaymentConfirmed(event.data);
      break;
      
    case 'payment_intent.expired':
      handlePaymentExpired(event.data);
      break;
      
    default:
      console.log(\`Unhandled event: \${event.type}\`);
  }
  
  res.status(200).send('OK');
});

async function handlePaymentConfirmed(paymentIntent) {
  // Update order status
  await updateOrderStatus(paymentIntent.metadata.order_id, 'paid');
  
  // Send confirmation email
  await sendConfirmationEmail(paymentIntent);
  
  // Update inventory
  await decrementInventory(paymentIntent.metadata.product_id);
}`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Webhook Events</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li><code className="bg-gray-200 px-2 py-1 rounded">payment_intent.created</code> - Payment intent created</li>
                  <li><code className="bg-gray-200 px-2 py-1 rounded">payment_intent.confirmed</code> - Payment received and confirmed</li>
                  <li><code className="bg-gray-200 px-2 py-1 rounded">payment_intent.expired</code> - Payment intent expired</li>
                  <li><code className="bg-gray-200 px-2 py-1 rounded">payment_intent.cancelled</code> - Payment intent cancelled</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Best Practices</h2>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Security</h3>
              <ul className="space-y-2 text-blue-800">
                <li>• Never expose your API key in client-side code</li>
                <li>• Always verify webhook signatures</li>
                <li>• Use HTTPS for all webhook endpoints</li>
                <li>• Implement idempotency for webhook handlers</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Performance</h3>
              <ul className="space-y-2 text-green-800">
                <li>• Cache payment intents to reduce API calls</li>
                <li>• Use appropriate expiration times (15-30 minutes)</li>
                <li>• Implement proper error handling and retries</li>
                <li>• Monitor webhook delivery success rates</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">User Experience</h3>
              <ul className="space-y-2 text-yellow-800">
                <li>• Provide clear payment status updates</li>
                <li>• Handle network failures gracefully</li>
                <li>• Show loading states during payment creation</li>
                <li>• Implement proper success/cancel page flows</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Support & Resources</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">API Reference</h3>
              <p className="text-gray-600 mb-4">
                Complete API documentation with all endpoints and parameters.
              </p>
              <a 
                href="/api-docs" 
                className="inline-flex items-center gap-2 text-sgate-orange hover:text-orange-600 font-medium"
              >
                View API Docs <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">GitHub Repository</h3>
              <p className="text-gray-600 mb-4">
                Source code, examples, and community contributions.
              </p>
              <a 
                href="https://github.com/your-org/sgate" 
                target="_blank"
                className="inline-flex items-center gap-2 text-sgate-orange hover:text-orange-600 font-medium"
              >
                View on GitHub <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Live Demo</h3>
              <p className="text-gray-600 mb-4">
                Try the SDK components and see them in action.
              </p>
              <a 
                href="/#demo" 
                className="inline-flex items-center gap-2 text-sgate-orange hover:text-orange-600 font-medium"
              >
                Try Demo <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Community</h3>
              <p className="text-gray-600 mb-4">
                Get help from other developers and the sGate team.
              </p>
              <a 
                href="https://discord.gg/sgate" 
                target="_blank"
                className="inline-flex items-center gap-2 text-sgate-orange hover:text-orange-600 font-medium"
              >
                Join Discord <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="text-center py-12 bg-gradient-to-r from-sgate-blue to-blue-900 rounded-xl text-white -mx-4 px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Build?</h2>
          <p className="text-blue-200 mb-6 text-lg">
            Start accepting sBTC payments in minutes with the sGate SDK.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/#demo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sgate-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            >
              Try Demo <ArrowRight className="w-5 h-5" />
            </a>
            <a 
              href="/api-docs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
            >
              <Code2 className="w-5 h-5" />
              API Reference
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}