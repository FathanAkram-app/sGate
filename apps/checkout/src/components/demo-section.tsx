'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

export function DemoSection() {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('100000');
  const [description, setDescription] = useState('Demo Payment - sGate Test');
  
  const createDemoPayment = async () => {
    setLoading(true);
    try {
      // Create a demo payment intent using the public demo endpoint
      const response = await fetch('http://localhost:4001/public/demo/payment_intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount_sats: parseInt(amount),
          currency: 'sbtc',
          description: description,
          success_url: window.location.origin,
          cancel_url: window.location.origin,
          expires_in: 900 // 15 minutes
        })
      });

      if (response.ok) {
        const paymentIntent = await response.json();
        // Redirect to checkout page
        window.open(paymentIntent.checkout_url, '_blank');
      } else {
        const error = await response.json().catch(() => ({}));
        alert(`Failed to create demo payment: ${error.message || 'Make sure the API server is running and seeded.'}`);
      }
    } catch (error) {
      alert('Failed to create demo payment. Make sure the API server is running and seeded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 max-w-md mx-auto">
      <h3 className="text-xl font-semibold text-white mb-4 text-center">
        Try a Demo Payment
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-blue-200 mb-2">
            Amount (sats)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-sgate-orange"
            placeholder="100000"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-blue-200 mb-2">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-sgate-orange"
            placeholder="Demo payment description"
          />
        </div>
        
        <button
          onClick={createDemoPayment}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-sgate-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Demo Payment
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
        
        <p className="text-xs text-blue-300 text-center">
          This will open a new tab with your demo payment
        </p>
      </div>
    </div>
  );
}