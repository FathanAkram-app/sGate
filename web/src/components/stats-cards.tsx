'use client';

import { TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalPayments: number;
    confirmedPayments: number;
    pendingPayments: number;
    totalVolume: number;
    last30Days: {
      payments: number;
      volume: number;
    };
  } | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatSats = (sats: number) => {
    if (sats >= 100000000) {
      return `${(sats / 100000000).toFixed(2)} sBTC`;
    }
    return `${sats.toLocaleString()} sats`;
  };

  const cards = [
    {
      title: 'Total Volume',
      value: formatSats(stats.totalVolume),
      change: stats.last30Days.volume > 0 ? `+${formatSats(stats.last30Days.volume)} this month` : 'No activity this month',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Payments',
      value: stats.totalPayments.toString(),
      change: stats.last30Days.payments > 0 ? `+${stats.last30Days.payments} this month` : 'No payments this month',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Confirmed',
      value: stats.confirmedPayments.toString(),
      change: `${((stats.confirmedPayments / (stats.totalPayments || 1)) * 100).toFixed(1)}% success rate`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending',
      value: stats.pendingPayments.toString(),
      change: stats.pendingPayments > 0 ? 'Awaiting confirmation' : 'All payments processed',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div key={index} className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.change}</p>
            </div>
            <div className={`p-3 rounded-full ${card.bgColor}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}