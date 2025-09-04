'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, Eye, EyeOff, BarChart3, Shield, Clock, Globe } from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';

interface ApiKey {
  id: string;
  keyPrefix: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
  permissions?: string[];
  requestCount?: number;
  rateLimit?: {
    limit: number;
    remaining: number;
    resetTime: string;
  };
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked';
}

export function ApiKeysSection() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['payments:read', 'payments:write']);
  const [newKeyExpiry, setNewKeyExpiry] = useState<string>('never');
  const [createdKey, setCreatedKey] = useState<{ key: string; name: string } | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [selectedKeyStats, setSelectedKeyStats] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const keys = await api.getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const result = await api.createApiKey({
        name: newKeyName.trim(),
        permissions: newKeyPermissions,
        expiresIn: newKeyExpiry === 'never' ? null : newKeyExpiry
      });
      setCreatedKey(result);
      setNewKeyName('');
      setNewKeyPermissions(['payments:read', 'payments:write']);
      setNewKeyExpiry('never');
      setShowCreateForm(false);
      await loadApiKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke the API key "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.revokeApiKey(id);
      await loadApiKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Created Key Modal */}
      {createdKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              API Key Created Successfully
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Name
                </label>
                <p className="text-sm text-gray-900">{createdKey.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 text-xs bg-gray-100 p-2 rounded font-mono">
                    {createdKey.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdKey.key)}
                    className="btn-secondary p-2"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Save this API key now. You won't be able to see it again.
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setCreatedKey(null)}
                className="btn-primary"
              >
                I've saved the key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your API keys for accessing the sGate API
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Key</span>
          </button>
        </div>

        {/* Enhanced Create Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateKey} className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="keyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Key Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="keyName"
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API, Test Integration"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Permissions
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'payments:read', label: 'Read payments', desc: 'View payment intents and status' },
                    { id: 'payments:write', label: 'Create payments', desc: 'Create new payment intents' },
                    { id: 'merchants:read', label: 'Read merchant data', desc: 'Access merchant information' },
                    { id: 'webhooks:read', label: 'Read webhooks', desc: 'View webhook configurations' },
                    { id: 'webhooks:write', label: 'Manage webhooks', desc: 'Create and modify webhooks' },
                  ].map((permission) => (
                    <label key={permission.id} className="flex items-start space-x-3 p-2 hover:bg-gray-100 rounded">
                      <input
                        type="checkbox"
                        checked={newKeyPermissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKeyPermissions([...newKeyPermissions, permission.id]);
                          } else {
                            setNewKeyPermissions(newKeyPermissions.filter(p => p !== permission.id));
                          }
                        }}
                        className="mt-0.5 h-4 w-4 text-sgate-blue focus:ring-sgate-blue border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{permission.label}</div>
                        <div className="text-xs text-gray-500">{permission.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="keyExpiry" className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Expiration
                </label>
                <select
                  id="keyExpiry"
                  value={newKeyExpiry}
                  onChange={(e) => setNewKeyExpiry(e.target.value)}
                  className="input-field"
                >
                  <option value="never">Never expires</option>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                  <option value="90d">90 days</option>
                  <option value="1y">1 year</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewKeyName('');
                  setNewKeyPermissions(['payments:read', 'payments:write']);
                  setNewKeyExpiry('never');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create API Key
              </button>
            </div>
          </form>
        )}

        {/* Keys Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
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
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    <div className="space-y-2">
                      <p>No API keys created yet</p>
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="text-sgate-blue hover:text-blue-700 font-medium"
                      >
                        Create your first API key
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{key.name}</div>
                        {key.permissions && key.permissions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {key.permissions.slice(0, 2).map((permission) => (
                              <span key={permission} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {permission.split(':')[0]}
                              </span>
                            ))}
                            {key.permissions.length > 2 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                +{key.permissions.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm text-gray-600 font-mono">
                          {revealedKey === key.id ? key.keyPrefix + '••••••••••••••••' : key.keyPrefix + '••••••••••••••••'}
                        </code>
                        <button
                          onClick={() => setRevealedKey(revealedKey === key.id ? null : key.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {revealedKey === key.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(key.keyPrefix + '••••••••••••••••')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            key.status === 'active' ? 'bg-green-100 text-green-800' :
                            key.status === 'expired' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {key.status}
                          </span>
                        </div>
                        {key.expiresAt && (
                          <div className="text-xs text-gray-500">
                            Expires {format(new Date(key.expiresAt), 'MMM dd, yyyy')}
                          </div>
                        )}
                        {key.lastUsedAt && (
                          <div className="text-xs text-gray-500">
                            Used {format(new Date(key.lastUsedAt), 'MMM dd')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{key.requestCount || 0} requests</span>
                        </div>
                        {key.rateLimit && (
                          <div className="text-xs text-gray-500">
                            {key.rateLimit.remaining}/{key.rateLimit.limit} remaining
                          </div>
                        )}
                        <button
                          onClick={() => setSelectedKeyStats(selectedKeyStats === key.id ? null : key.id)}
                          className="text-xs text-sgate-blue hover:text-blue-700 font-medium"
                        >
                          View details
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(key.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedKeyStats(selectedKeyStats === key.id ? null : key.id)}
                          className="text-sgate-blue hover:text-blue-700 flex items-center space-x-1"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRevokeKey(key.id, key.name)}
                          className="text-red-600 hover:text-red-700 flex items-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* API Key Statistics Panel */}
        {selectedKeyStats && (
          <div className="mt-6 bg-gradient-to-r from-sgate-blue to-blue-700 rounded-lg p-6 text-white">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold">API Key Analytics</h3>
                <p className="text-blue-100 text-sm mt-1">
                  {apiKeys.find(k => k.id === selectedKeyStats)?.name || 'Unknown Key'}
                </p>
              </div>
              <button
                onClick={() => setSelectedKeyStats(null)}
                className="text-blue-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-8 h-8 text-blue-200" />
                  <div>
                    <div className="text-2xl font-bold">
                      {apiKeys.find(k => k.id === selectedKeyStats)?.requestCount || 0}
                    </div>
                    <div className="text-sm text-blue-200">Total Requests</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-8 h-8 text-blue-200" />
                  <div>
                    <div className="text-2xl font-bold">
                      {apiKeys.find(k => k.id === selectedKeyStats)?.lastUsedAt ? 
                        format(new Date(apiKeys.find(k => k.id === selectedKeyStats)!.lastUsedAt!), 'MMM dd') : 
                        'Never'
                      }
                    </div>
                    <div className="text-sm text-blue-200">Last Used</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Shield className="w-8 h-8 text-blue-200" />
                  <div>
                    <div className="text-2xl font-bold">
                      {apiKeys.find(k => k.id === selectedKeyStats)?.permissions?.length || 0}
                    </div>
                    <div className="text-sm text-blue-200">Permissions</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rate Limit Progress */}
            {apiKeys.find(k => k.id === selectedKeyStats)?.rateLimit && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-blue-200">Rate Limit Usage</span>
                  <span className="text-sm text-blue-200">
                    {apiKeys.find(k => k.id === selectedKeyStats)?.rateLimit?.remaining}/
                    {apiKeys.find(k => k.id === selectedKeyStats)?.rateLimit?.limit}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-300"
                    style={{ 
                      width: `${((apiKeys.find(k => k.id === selectedKeyStats)?.rateLimit?.limit! - 
                                apiKeys.find(k => k.id === selectedKeyStats)?.rateLimit?.remaining!) / 
                                apiKeys.find(k => k.id === selectedKeyStats)?.rateLimit?.limit!) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Permissions List */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-blue-200 mb-3">Permissions</h4>
              <div className="flex flex-wrap gap-2">
                {apiKeys.find(k => k.id === selectedKeyStats)?.permissions?.map((permission) => (
                  <span key={permission} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                    {permission}
                  </span>
                )) || <span className="text-blue-200 text-sm">No permissions set</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}