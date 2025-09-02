'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  { id: 'payment_intent.created', name: 'Payment Intent Created' },
  { id: 'payment_intent.confirmed', name: 'Payment Intent Confirmed' },
  { id: 'payment_intent.expired', name: 'Payment Intent Expired' },
  { id: 'payment_intent.cancelled', name: 'Payment Intent Cancelled' },
];

export function WebhooksSection() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    events: [] as string[]
  });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const data = await api.getWebhookEndpoints();
      setWebhooks(data);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url || formData.events.length === 0) return;

    try {
      await api.createWebhookEndpoint(formData.url, formData.events);
      setFormData({ url: '', events: [] });
      setShowCreateForm(false);
      await loadWebhooks();
    } catch (error) {
      console.error('Failed to create webhook:', error);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await api.updateWebhookEndpoint(id, { active: !currentActive });
      await loadWebhooks();
    } catch (error) {
      console.error('Failed to update webhook:', error);
    }
  };

  const handleDeleteWebhook = async (id: string, url: string) => {
    if (!confirm(`Are you sure you want to delete the webhook endpoint for ${url}?`)) {
      return;
    }

    try {
      await api.deleteWebhookEndpoint(id);
      await loadWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const handleEventChange = (eventId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      events: checked 
        ? [...prev.events, eventId]
        : prev.events.filter(e => e !== eventId)
    }));
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Webhooks List */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Webhook Endpoints</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure endpoints to receive real-time payment notifications
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Endpoint</span>
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateWebhook} className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
            <div>
              <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Endpoint URL
              </label>
              <input
                id="webhookUrl"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://yoursite.com/webhooks/sgate"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Events to send
              </label>
              <div className="space-y-2">
                {AVAILABLE_EVENTS.map(event => (
                  <label key={event.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event.id)}
                      onChange={(e) => handleEventChange(event.id, e.target.checked)}
                      className="rounded border-gray-300 text-sgate-blue focus:ring-sgate-blue"
                    />
                    <span className="ml-2 text-sm text-gray-700">{event.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create Endpoint
              </button>
            </div>
          </form>
        )}

        {/* Webhooks Table */}
        <div className="space-y-4">
          {webhooks.length === 0 ? (
            <div className="text-center py-8">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">No webhook endpoints configured</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="text-sgate-blue hover:text-blue-700 font-medium text-sm"
                >
                  Create your first webhook endpoint
                </button>
              </div>
            </div>
          ) : (
            webhooks.map((webhook) => (
              <div key={webhook.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleActive(webhook.id, webhook.active)}
                          className={`${webhook.active ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          {webhook.active ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <span className={`text-sm font-medium ${webhook.active ? 'text-green-600' : 'text-gray-500'}`}>
                          {webhook.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                          {webhook.url}
                        </code>
                        <button
                          onClick={() => window.open(webhook.url, '_blank')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Events:</p>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map(event => (
                          <span key={event} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      Created {format(new Date(webhook.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteWebhook(webhook.id, webhook.url)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Webhook Testing */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Testing Webhooks</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-3">
            To test your webhook endpoints, you can use tools like:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li><strong>ngrok</strong> - Expose your local development server</li>
            <li><strong>webhook.site</strong> - Temporary webhook URLs for testing</li>
            <li><strong>requestbin.com</strong> - Inspect webhook payloads</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Webhook payloads are signed with HMAC SHA-256. Check our documentation for signature verification examples.
          </p>
        </div>
      </div>
    </div>
  );
}