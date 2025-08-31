'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentIntentResponseDto, PaymentIntentStatus } from '@sgate/shared';
import { getPaymentIntent, formatSats, satsToUsd, formatUsd } from '@/lib/api';
import { PaymentStatus } from '@/components/payment-status';
import { QRCode } from '@/components/qr-code';
import { ArrowLeft, Clock, DollarSign } from 'lucide-react';

export default function PaymentIntentPage({ params }: { params: { id: string } }) {
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    fetchPaymentIntent();
    const interval = setInterval(fetchPaymentIntent, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [params.id]);

  useEffect(() => {
    if (!paymentIntent) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const expiresAt = new Date(paymentIntent.expires_at);
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [paymentIntent]);

  const fetchPaymentIntent = async () => {
    try {
      const data = await getPaymentIntent(params.id);
      if (data) {
        setPaymentIntent(data);
        
        // Redirect on success if URLs are provided
        if (data.status === PaymentIntentStatus.CONFIRMED && data.success_url) {
          setTimeout(() => {
            window.location.href = data.success_url!;
          }, 3000);
        }
      } else {
        setError('Payment intent not found');
      }
    } catch (err) {
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sgate-blue to-blue-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !paymentIntent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sgate-blue to-blue-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 14.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Payment Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            The payment link may be invalid or expired.
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sgate-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const usdAmount = satsToUsd(paymentIntent.amount_sats);
  const isExpired = paymentIntent.status === PaymentIntentStatus.EXPIRED || 
                   new Date(paymentIntent.expires_at) <= new Date();
  const isCompleted = paymentIntent.status === PaymentIntentStatus.CONFIRMED;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sgate-blue to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sgate-orange to-orange-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">sGate Payment</h1>
              <p className="text-orange-100 text-sm">Secure sBTC checkout</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">
              {formatSats(paymentIntent.amount_sats)} sats
            </div>
            <div className="text-orange-100 text-lg">
              ≈ {formatUsd(usdAmount)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {paymentIntent.description && (
            <div className="text-center">
              <p className="text-gray-700 font-medium">
                {paymentIntent.description}
              </p>
            </div>
          )}

          {/* Status */}
          <PaymentStatus status={paymentIntent.status} />

          {/* Timer */}
          {!isCompleted && !isExpired && (
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                Time remaining: <span className="font-mono font-medium">{timeRemaining}</span>
              </span>
            </div>
          )}

          {/* Payment Instructions */}
          {paymentIntent.status === PaymentIntentStatus.REQUIRES_PAYMENT && !isExpired && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Send sBTC to complete payment
                </h3>
                <p className="text-sm text-gray-600">
                  Scan the QR code or copy the address below
                </p>
              </div>

              <QRCode
                value={paymentIntent.pay_address}
                size={180}
                label="Payment Address"
              />

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Important Instructions:
                </div>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Send exactly {formatSats(paymentIntent.amount_sats)} sats</li>
                  <li>• Use sBTC on Stacks testnet</li>
                  <li>• Payment will be confirmed after 1 block</li>
                  <li>• This page will update automatically</li>
                </ul>
              </div>
            </div>
          )}

          {/* Success Message */}
          {isCompleted && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Payment Confirmed!
              </h3>
              <p className="text-gray-600">
                Your payment has been successfully processed.
              </p>
              {paymentIntent.success_url && (
                <p className="text-sm text-gray-500">
                  Redirecting in 3 seconds...
                </p>
              )}
            </div>
          )}

          {/* Expired Message */}
          {isExpired && paymentIntent.status !== PaymentIntentStatus.CONFIRMED && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Payment Expired
              </h3>
              <p className="text-gray-600">
                This payment link has expired. Please contact the merchant for a new payment link.
              </p>
            </div>
          )}

          {/* Cancel Link */}
          {paymentIntent.cancel_url && !isCompleted && (
            <div className="text-center pt-4 border-t">
              <a
                href={paymentIntent.cancel_url}
                className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                Cancel payment
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}