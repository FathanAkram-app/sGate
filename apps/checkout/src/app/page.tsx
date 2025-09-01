import { ArrowRight, Shield, Zap, Code, DollarSign, Globe, Clock } from 'lucide-react';
import { DemoSection } from '@/components/demo-section';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sgate-blue to-blue-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-sgate-orange rounded-xl flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-white">
                  sGate
                </h1>
              </div>
              <p className="text-xl lg:text-2xl text-blue-100 mb-4">
                sBTC Payment Gateway for Stacks
              </p>
              <p className="text-lg text-blue-200 max-w-2xl mx-auto">
                Accept sBTC payments with a Stripe-like developer experience. 
                Beautiful checkout pages, powerful APIs, and seamless integration.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="/docs"
                className="inline-flex items-center gap-2 px-8 py-4 bg-sgate-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                SDK Documentation
                <ArrowRight className="w-5 h-5" />
              </a>
              <a 
                href="#demo"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
              >
                <Code className="w-5 h-5" />
                Try Demo
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 lg:py-24 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Why Choose sGate?
            </h2>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto">
              Built for developers, designed for users. Get started in minutes with our comprehensive payment solution.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-sgate-orange/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-sgate-orange" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Lightning Fast Setup
              </h3>
              <p className="text-blue-200">
                Get started in under 10 minutes. Create payment intents, generate checkout links, and start accepting sBTC immediately.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-sgate-orange/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-sgate-orange" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Enterprise Security
              </h3>
              <p className="text-blue-200">
                HMAC-signed webhooks, API key authentication, and built-in fraud protection keep your payments secure.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-sgate-orange/20 rounded-lg flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-sgate-orange" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Developer First
              </h3>
              <p className="text-blue-200">
                Clean REST APIs, comprehensive documentation, and SDKs that make integration a breeze for any platform.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-sgate-orange/20 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-sgate-orange" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Beautiful Checkout
              </h3>
              <p className="text-blue-200">
                Mobile-responsive, customizable checkout pages that provide a seamless payment experience for your customers.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-sgate-orange/20 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-sgate-orange" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Real-time Updates
              </h3>
              <p className="text-blue-200">
                Automatic payment detection, real-time status updates, and reliable webhook delivery with exponential backoff.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-sgate-orange/20 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-sgate-orange" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                sBTC Native
              </h3>
              <p className="text-blue-200">
                Built specifically for sBTC on Stacks. No complexity of multiple currencies - just pure Bitcoin value transfer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-blue-200">
              Simple, powerful payment flow in three easy steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-sgate-orange rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Create Payment Intent
              </h3>
              <p className="text-blue-200">
                Use our API to create a payment intent with the amount, description, and success/cancel URLs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-sgate-orange rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Customer Pays
              </h3>
              <p className="text-blue-200">
                Direct customers to the checkout URL where they can scan a QR code or copy the payment address.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-sgate-orange rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Receive Confirmation
              </h3>
              <p className="text-blue-200">
                Get notified via webhooks when the payment is confirmed on the Stacks blockchain.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div id="demo" className="py-16 lg:py-24 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Try It Now
            </h2>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto">
              Experience sGate firsthand. Create a demo payment intent and see the checkout flow in action.
            </p>
          </div>
          <DemoSection />
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Start Accepting sBTC?
          </h2>
          <p className="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
            Join the future of Bitcoin payments. Get started with sGate today and experience the easiest way to integrate sBTC payments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/docs"
              className="inline-flex items-center gap-2 px-8 py-4 bg-sgate-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </a>
            <a 
              href="https://github.com/your-org/sgate" 
              target="_blank"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
            >
              <Code className="w-5 h-5" />
              View on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-blue-200">
              Built with ❤️ for the Stacks ecosystem
            </p>
            <div className="mt-4">
              <p className="text-sm text-blue-300">
                To make a payment, use a payment link provided by a merchant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}