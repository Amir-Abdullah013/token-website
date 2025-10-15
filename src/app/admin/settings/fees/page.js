'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../../lib/admin-auth';
import Layout from '../../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../../components/Card';
import Button from '../../../../components/Button';
import Input from '../../../../components/Input';
import { useToast, ToastContainer } from '../../../../components/Toast';

export default function AdminFeeSettingsPage() {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  // State for fee settings
  const [feeSettings, setFeeSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorState, setErrorState] = useState(null);

  // Form state for each fee type
  const [formData, setFormData] = useState({
    transfer: { rate: 0.05, isActive: true },
    withdraw: { rate: 0.10, isActive: true },
    buy: { rate: 0.01, isActive: true },
    sell: { rate: 0.01, isActive: true }
  });

  // Track changes
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else {
        fetchFeeSettings();
      }
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  const fetchFeeSettings = async () => {
    setLoading(true);
    setErrorState(null);

    try {
      const response = await fetch('/api/admin/fees');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch fee settings: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const settings = data.feeSettings || [];
        setFeeSettings(settings);
        
        // Convert to form data
        const newFormData = {
          transfer: { rate: 0.05, isActive: true },
          withdraw: { rate: 0.10, isActive: true },
          buy: { rate: 0.01, isActive: true },
          sell: { rate: 0.01, isActive: true }
        };

        settings.forEach(setting => {
          newFormData[setting.type] = {
            rate: setting.rate,
            isActive: setting.isActive
          };
        });

        setFormData(newFormData);
        setOriginalData(newFormData);
      } else {
        throw new Error(data.error || 'Failed to load fee settings');
      }
    } catch (err) {
      console.error('Error fetching fee settings:', err);
      setErrorState(err.message || 'Failed to load fee settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (type, value) => {
    const newRate = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        rate: newRate
      }
    }));
    checkForChanges();
  };

  const handleActiveChange = (type, isActive) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        isActive
      }
    }));
    checkForChanges();
  };

  const checkForChanges = () => {
    const hasChanges = Object.keys(formData).some(type => {
      const current = formData[type];
      const original = originalData[type];
      return current.rate !== original.rate || current.isActive !== original.isActive;
    });
    setHasChanges(hasChanges);
  };

  const saveFeeSetting = async (type) => {
    setSaving(true);
    
    try {
      const setting = formData[type];
      const response = await fetch('/api/admin/fees', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          rate: setting.rate,
          isActive: setting.isActive
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${type} fee: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        success(`${type.toUpperCase()} fee rate updated to ${(setting.rate * 100).toFixed(2)}%`);
        
        // Update original data to reflect saved state
        setOriginalData(prev => ({
          ...prev,
          [type]: { ...setting }
        }));
        
        // Check if there are still changes
        checkForChanges();
      } else {
        throw new Error(data.error || `Failed to update ${type} fee`);
      }
    } catch (err) {
      console.error(`Error updating ${type} fee:`, err);
      error(`Failed to update ${type} fee: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveAllChanges = async () => {
    setSaving(true);
    
    try {
      const promises = Object.keys(formData).map(type => {
        const setting = formData[type];
        return fetch('/api/admin/fees', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type,
            rate: setting.rate,
            isActive: setting.isActive
          })
        });
      });

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        throw new Error(`Failed to update ${failed.length} fee settings`);
      }

      success('All fee settings updated successfully');
      
      // Update original data
      setOriginalData({ ...formData });
      setHasChanges(false);
      
    } catch (err) {
      console.error('Error updating fee settings:', err);
      error(`Failed to update fee settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setFormData({ ...originalData });
    setHasChanges(false);
  };

  const formatPercentage = (rate) => {
    return (rate * 100).toFixed(2);
  };

  if (!mounted || isLoading || loading) {
    return (
      <Layout showSidebar={true}>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (errorState) {
    return (
      <Layout showSidebar={true}>
        <div className="container mx-auto p-6">
          <div className="text-center">
            <div className="text-red-400 text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-white mb-2">Error Loading Fee Settings</h3>
            <p className="text-slate-300 mb-4">{errorState}</p>
            <Button onClick={fetchFeeSettings} className="bg-gradient-to-r from-cyan-500 to-blue-600">
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-6">
            Fee Settings Management
          </h1>

          <p className="text-slate-300 mb-8">
            Manage transaction fee rates for different transaction types. Changes take effect immediately across the system.
          </p>

          {/* Fee Settings Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {Object.keys(formData).map((type) => {
              const setting = formData[type];
              const original = originalData[type] || { rate: 0, isActive: true };
              const hasChanged = originalData[type] ? 
                (setting.rate !== original.rate || setting.isActive !== original.isActive) : 
                false;
              
              return (
                <Card 
                  key={type}
                  className={`bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm ${
                    hasChanged ? 'ring-2 ring-amber-400/50' : ''
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="text-lg bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                      {type.toUpperCase()} Fee
                      {hasChanged && <span className="ml-2 text-amber-400">●</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Rate Input */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Fee Rate (%)
                        </label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            max="1"
                            value={setting.rate}
                            onChange={(e) => handleRateChange(type, e.target.value)}
                            className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white"
                            disabled={saving}
                          />
                          <span className="text-slate-300 text-sm">
                            ({formatPercentage(setting.rate)}%)
                          </span>
                        </div>
                      </div>

                      {/* Active Toggle */}
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={setting.isActive}
                            onChange={(e) => handleActiveChange(type, e.target.checked)}
                            className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-500 rounded focus:ring-cyan-500"
                            disabled={saving}
                          />
                          <span className="text-sm text-slate-300">Active</span>
                        </label>
                      </div>

                      {/* Save Button */}
                      <Button
                        onClick={() => saveFeeSetting(type)}
                        disabled={saving || !hasChanged}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Global Actions */}
          <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Global Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button
                  onClick={saveAllChanges}
                  disabled={saving || !hasChanges}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 disabled:opacity-50"
                >
                  {saving ? 'Saving All...' : 'Save All Changes'}
                </Button>
                
                <Button
                  onClick={resetChanges}
                  disabled={saving || !hasChanges}
                  variant="outline"
                  className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 disabled:opacity-50"
                >
                  Reset Changes
                </Button>
                
                <Button
                  onClick={fetchFeeSettings}
                  disabled={saving}
                  variant="outline"
                  className="bg-gradient-to-r from-cyan-600/50 to-blue-700/50 text-cyan-300 disabled:opacity-50"
                >
                  Refresh
                </Button>
              </div>
              
              {hasChanges && (
                <div className="mt-4 p-3 bg-amber-500/20 border border-amber-400/30 rounded-lg">
                  <p className="text-amber-200 text-sm">
                    ⚠️ You have unsaved changes. Click "Save All Changes" to apply them.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fee Information */}
          <Card className="mt-6 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                Fee Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                <div>
                  <h4 className="font-medium text-white mb-2">Transaction Types:</h4>
                  <ul className="space-y-1">
                    <li>• <strong>Transfer:</strong> Peer-to-peer token transfers</li>
                    <li>• <strong>Withdraw:</strong> Withdrawals to external wallets</li>
                    <li>• <strong>Buy:</strong> Purchasing TIKI tokens</li>
                    <li>• <strong>Sell:</strong> Selling TIKI tokens</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Important Notes:</h4>
                  <ul className="space-y-1">
                    <li>• Fee rates are applied as percentages (0.05 = 5%)</li>
                    <li>• Changes take effect immediately</li>
                    <li>• Disabled fees are set to 0%</li>
                    <li>• All changes are logged for audit</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';
