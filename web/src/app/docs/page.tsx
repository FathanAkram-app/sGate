import Link from 'next/link';
import { ArrowLeft, BookOpen, Code, Webhook, Key } from 'lucide-react';

export default function DocsPage() {
  const sections = [
    {
      title: 'Quick Start',
      description: 'Get up and running with sGate in minutes',
      icon: BookOpen,
      href: '/docs/quickstart',
      items: [
        'Create your first payment',
        'Set up webhooks',
        'Test with the API'
      ]
    },
    {
      title: 'API Reference',
      description: 'Complete REST API documentation',
      icon: Code,
      href: '/docs/api',
      items: [
        'Payment Intents',
        'Webhook Endpoints',
        'Error Handling'
      ]
    },
    {
      title: 'Webhooks',
      description: 'Real-time payment notifications',
      icon: Webhook,
      href: '/docs/webhooks',
      items: [
        'Event Types',
        'Signature Verification',
        'Retry Logic'
      ]
    },
    {
      title: 'Architecture',
      description: 'System design and technical details',
      icon: Key,
      href: '/docs/architecture',
      items: [
        'Payment Flow',
        'Security Model',
        'Infrastructure'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl">
            Everything you need to integrate sGate sBTC payments into your application.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-sgate-blue hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-sgate-blue/10 rounded-lg flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-sgate-blue" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {section.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {section.description}
                  </p>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item} className="text-sm text-gray-500 flex items-center">
                        <span className="w-1.5 h-1.5 bg-sgate-blue rounded-full mr-2"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Getting Started */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Getting Started</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-4">Quick Example</h3>
              <p className="text-gray-600 mb-4">
                Create a payment intent and redirect your customer to the hosted checkout page:
              </p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`curl -X POST http://localhost:4000/v1/payment_intents \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount_sats": 100000,
    "currency": "sbtc",
    "description": "Test payment"
  }'`}
              </pre>
              <p className="text-gray-600 mt-4">
                The API will return a payment intent with a hosted checkout URL that you can redirect your customer to.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}