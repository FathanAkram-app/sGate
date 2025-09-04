'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Code, Shield, Zap, Github, ExternalLink, LogOut, User, Copy, QrCode, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function HomePage() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6 md:justify-start md:space-x-10">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-sgate-blue rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">s</span>
                </div>
                <span className="text-xl font-bold text-gray-900">sGate</span>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-10">
              <Link href="/docs" className="text-base font-medium text-gray-500 hover:text-gray-900">
                Documentation
              </Link>
            </nav>
            
            <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0 space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{user.name}</span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="text-base font-medium text-gray-500 hover:text-gray-900"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="inline-flex items-center space-x-1 text-base font-medium text-gray-500 hover:text-gray-900"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/auth/login"
                    className="text-base font-medium text-gray-500 hover:text-gray-900"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-sgate-blue hover:bg-blue-700"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center py-12 sm:py-16 lg:py-20">
            {/* Left Content */}
            <div>
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Accept sBTC</span>
                <span className="block text-sgate-blue">payments easily</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg md:mt-5 md:text-xl max-w-3xl">
                sGate is a production-grade sBTC Payment Gateway for Stacks testnet. 
                Accept Bitcoin payments through sBTC with hosted checkout pages and powerful APIs.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-start gap-4">
                <Link
                  href={user ? "/dashboard" : "/auth/register"}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sgate-blue hover:bg-blue-700 md:py-4 md:text-lg md:px-8 whitespace-nowrap"
                >
                  {user ? "Dashboard" : "Get Started"}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="/docs"
                  className="mt-3 sm:mt-0 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-sgate-blue bg-blue-50 hover:bg-blue-100 md:py-4 md:text-lg md:px-8 whitespace-nowrap"
                >
                  View docs
                </Link>
              </div>
            </div>
            
            {/* Right Content - Payment Gateway Mockup */}
            <div className="mt-12 lg:mt-0">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-md mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-sgate-blue rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">s</span>
                    </div>
                    <span className="font-semibold text-gray-900">sGate Payment</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">Live</span>
                  </div>
                </div>

                {/* Payment Amount */}
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-1">0.05 sBTC</div>
                  <div className="text-gray-500">≈ $5,476.00 USD</div>
                </div>

                {/* Payment Status */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div>
                      <div className="font-medium text-yellow-800">Payment Pending</div>
                      <div className="text-sm text-yellow-600">Waiting for 1 confirmation</div>
                    </div>
                  </div>
                </div>

                {/* Payment Address */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Send sBTC to this address:
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                      <code className="flex-1 text-xs font-mono text-gray-800 truncate">
                        bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
                      </code>
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* QR Code Placeholder */}
                  <div className="flex justify-center">
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                      <QrCode className="w-12 h-12 text-gray-400" />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 bg-sgate-blue text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                      Copy Address
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                  <div className="text-xs text-gray-500">Powered by sGate</div>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Zap className="w-3 h-3 text-sgate-blue" />
                    <span className="text-xs text-sgate-blue font-medium">Lightning Fast Confirmations</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-sgate-blue font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to accept sBTC payments
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-sgate-blue text-white">
                  <Shield className="w-6 h-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Secure by Design</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  API keys with PBKDF2 hashing, HMAC-signed webhooks, and comprehensive input validation.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-sgate-blue text-white">
                  <Code className="w-6 h-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Developer Friendly</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  RESTful APIs, comprehensive documentation, and SDK support for easy integration.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-sgate-blue text-white">
                  <Zap className="w-6 h-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Fast Settlement</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Payments are confirmed after just 1 block confirmation on Stacks testnet.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-sgate-blue text-white">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Production Ready</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Built with enterprise-grade technologies: NestJS, PostgreSQL, Redis, and Docker.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-sgate-blue">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to start?</span>
            <span className="block">Create your first payment today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-200">
            Get your API keys and start accepting sBTC payments in minutes.
          </p>
          <Link
            href={user ? "/dashboard" : "/auth/register"}
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-sgate-blue bg-white hover:bg-blue-50 sm:w-auto"
          >
            {user ? "Dashboard" : "Get started for free"}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <a href="https://github.com/FathanAkram-app/sGate" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">GitHub</span>
              <Github className="h-6 w-6" />
            </a>
            <a href="/docs" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Documentation</span>
              <ExternalLink className="h-6 w-6" />
            </a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; 2025 sGate. Built for Stacks testnet.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}