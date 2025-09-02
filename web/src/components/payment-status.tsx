'use client';

import { PaymentIntentStatus } from '@sgate/shared';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentStatusProps {
  status: PaymentIntentStatus;
  className?: string;
}

export function PaymentStatus({ status, className }: PaymentStatusProps) {
  const getStatusConfig = (status: PaymentIntentStatus) => {
    switch (status) {
      case PaymentIntentStatus.CONFIRMED:
        return {
          icon: CheckCircle2,
          text: 'Payment Confirmed',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      case PaymentIntentStatus.PROCESSING:
        return {
          icon: Clock,
          text: 'Processing Payment',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
      case PaymentIntentStatus.REQUIRES_PAYMENT:
        return {
          icon: AlertCircle,
          text: 'Awaiting Payment',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
        };
      case PaymentIntentStatus.FAILED:
        return {
          icon: XCircle,
          text: 'Payment Failed',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
      case PaymentIntentStatus.EXPIRED:
        return {
          icon: XCircle,
          text: 'Payment Expired',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
      default:
        return {
          icon: AlertCircle,
          text: 'Unknown Status',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Icon className={cn('w-5 h-5', config.color)} />
      <span className={cn('font-medium', config.color)}>
        {config.text}
      </span>
    </div>
  );
}