'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { DashboardHeader } from '@/components/dashboard-header';
import { StatsCards } from '@/components/stats-cards';
import { PaymentsList } from '@/components/payments-list';
import { ApiKeysSection } from '@/components/api-keys-section';
import { WebhooksSection } from '@/components/webhooks-section';
import { api } from '@/lib/api';
import { PaymentIntentResponseDto } from '@sgate/shared';

interface DashboardStats {
  totalPayments: number;
  confirmedPayments: number;
  pendingPayments: number;
  totalVolume: number;
  last30Days: {
    payments: number;
    volume: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentIntentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats and recent payments in parallel
      const [statsData, paymentsData] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentPayments(10)
      ]);
      
      setStats(statsData);
      setRecentPayments(paymentsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card h-24 bg-gray-200"></div>
              ))}
            </div>
            <div className="card h-96 bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'payments', name: 'Payments' },
              { id: 'api-keys', name: 'API Keys' },
              { id: 'webhooks', name: 'Webhooks' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-sgate-blue text-sgate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <StatsCards stats={stats} />
            
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Payments
              </h2>
              <PaymentsList 
                payments={recentPayments} 
                showAll={false}
                onRefresh={loadDashboardData}
              />
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">All Payments</h1>
              <button 
                onClick={loadDashboardData}
                className="btn-secondary"
              >
                Refresh
              </button>
            </div>
            <div className="card p-6">
              <PaymentsList 
                payments={recentPayments} 
                showAll={true}
                onRefresh={loadDashboardData}
              />
            </div>
          </div>
        )}

        {activeTab === 'api-keys' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
            </div>
            <ApiKeysSection />
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
            </div>
            <WebhooksSection />
          </div>
        )}
      </div>
      </div>
    </AuthGuard>
  );
}