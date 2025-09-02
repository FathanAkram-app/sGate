'use client';

import { useState } from 'react';
import { PaymentIntentResponseDto, PaymentIntentStatus } from '@sgate/shared';
import { ExternalLink, Copy, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentsListProps {
  payments: PaymentIntentResponseDto[];
  showAll: boolean;
  onRefresh: () => void;
}

export function PaymentsList({ payments, showAll, onRefresh }: PaymentsListProps) {
  const [filter, setFilter] = useState<'all' | PaymentIntentStatus>('all');
  
  const filteredPayments = payments.filter(payment => 
    filter === 'all' || payment.status === filter
  );

  const getStatusBadge = (status: PaymentIntentStatus) => {
    const styles = {
      [PaymentIntentStatus.REQUIRES_PAYMENT]: 'bg-yellow-100 text-yellow-800',
      [PaymentIntentStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
      [PaymentIntentStatus.CONFIRMED]: 'bg-green-100 text-green-800',
      [PaymentIntentStatus.FAILED]: 'bg-red-100 text-red-800',
      [PaymentIntentStatus.EXPIRED]: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      [PaymentIntentStatus.REQUIRES_PAYMENT]: 'Pending',
      [PaymentIntentStatus.PROCESSING]: 'Processing',
      [PaymentIntentStatus.CONFIRMED]: 'Confirmed',
      [PaymentIntentStatus.FAILED]: 'Failed',
      [PaymentIntentStatus.EXPIRED]: 'Expired',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatSats = (sats: number) => {
    return `${sats.toLocaleString()} sats`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  return (
    <div className="space-y-4">
      {showAll && (
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1"
              >
                <option value="all">All Status</option>
                <option value={PaymentIntentStatus.REQUIRES_PAYMENT}>Pending</option>
                <option value={PaymentIntentStatus.CONFIRMED}>Confirmed</option>
                <option value={PaymentIntentStatus.EXPIRED}>Expired</option>
                <option value={PaymentIntentStatus.FAILED}>Failed</option>
              </select>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            Showing {filteredPayments.length} of {payments.length} payments
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Intent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 font-mono">
                        {payment.id.slice(0, 12)}...
                      </span>
                      <button
                        onClick={() => copyToClipboard(payment.id)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copy ID"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatSats(payment.amount_sats)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {payment.description || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(payment.created_at), 'MMM dd, HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(payment.checkout_url, '_blank')}
                        className="text-sgate-blue hover:text-blue-700 flex items-center space-x-1"
                        title="View checkout page"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!showAll && payments.length > 5 && (
        <div className="text-center pt-4">
          <button className="text-sgate-blue hover:text-blue-700 text-sm font-medium">
            View all payments →
          </button>
        </div>
      )}
    </div>
  );
}