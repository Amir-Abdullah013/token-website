'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { systemSettingsHelpers, adminHelpers } from '@/lib/database';
import { authHelpers } from '@/lib/supabase';;
import { Button, Card, Loader, Toast } from '@/components';

export default function TestSystemSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadUserAndSettings();
  }, []);

  const loadUserAndSettings = async () => {
    try {
      setLoading(true);
      const currentUser = await authHelpers.getCurrentUser();
      
      if (!currentUser) {
        router.push('/auth/signin');
        return;
      }

      setUser(currentUser);
      
      // Load system settings
      const [tokenPrice, tokenSupply, paymentGateways] = await Promise.all([
        databaseHelpers.settings.getTokenPrice(),
        databaseHelpers.settings.getTokenSupply(),
        databaseHelpers.settings.getPaymentGateways()
      ]);
      
      setSettings({
        tokenPrice,
        tokenSupply,
        paymentGateways
      });
      
    } catch (error) {
      console.error('Error loading system settings:', error);
      setToast({
        type: 'error',
        message: 'Failed to load system settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const testUpdateTokenPrice = async () => {
    try {
      const newPrice = 1.25;
      await databaseHelpers.settings.setTokenPrice(newPrice);
      
      // Log admin action
      await databaseHelpers.admin.logAdminAction(
        user.id,
        `Test: Updated token price to $${newPrice}`,
        'system_settings',
        'token_price',
        'Test update of token price'
      );
      
      setToast({
        type: 'success',
        message: `Token price updated to $${newPrice}`
      });
      
      // Reload settings
      loadUserAndSettings();
      
    } catch (error) {
      console.error('Error updating token price:', error);
      setToast({
        type: 'error',
        message: 'Failed to update token price'
      });
    }
  };

  const testUpdateTokenSupply = async () => {
    try {
      const newSupply = 2000000;
      await databaseHelpers.settings.setTokenSupply(newSupply);
      
      // Log admin action
      await databaseHelpers.admin.logAdminAction(
        user.id,
        `Test: Updated token supply to ${newSupply.toLocaleString()}`,
        'system_settings',
        'token_supply',
        'Test update of token supply'
      );
      
      setToast({
        type: 'success',
        message: `Token supply updated to ${newSupply.toLocaleString()}`
      });
      
      // Reload settings
      loadUserAndSettings();
      
    } catch (error) {
      console.error('Error updating token supply:', error);
      setToast({
        type: 'error',
        message: 'Failed to update token supply'
      });
    }
  };

  const testAddGateway = async () => {
    try {
      const newGateway = {
        name: 'Test Gateway',
        active: true
      };
      
      const updatedGateways = [
        ...settings.paymentGateways,
        newGateway
      ];
      
      await databaseHelpers.settings.setPaymentGateways(updatedGateways);
      
      // Log admin action
      await databaseHelpers.admin.logAdminAction(
        user.id,
        `Test: Added payment gateway: ${newGateway.name}`,
        'system_settings',
        'payment_gateways',
        'Test addition of payment gateway'
      );
      
      setToast({
        type: 'success',
        message: `Payment gateway "${newGateway.name}" added`
      });
      
      // Reload settings
      loadUserAndSettings();
      
    } catch (error) {
      console.error('Error adding payment gateway:', error);
      setToast({
        type: 'error',
        message: 'Failed to add payment gateway'
      });
    }
  };

  const testToggleGateway = async () => {
    if (settings.paymentGateways.length === 0) {
      setToast({
        type: 'error',
        message: 'No payment gateways to toggle'
      });
      return;
    }

    try {
      const updatedGateways = [...settings.paymentGateways];
      updatedGateways[0].active = !updatedGateways[0].active;
      
      await databaseHelpers.settings.setPaymentGateways(updatedGateways);
      
      // Log admin action
      await databaseHelpers.admin.logAdminAction(
        user.id,
        `Test: ${updatedGateways[0].active ? 'Activated' : 'Deactivated'} payment gateway: ${updatedGateways[0].name}`,
        'system_settings',
        'payment_gateways',
        'Test toggle of payment gateway'
      );
      
      setToast({
        type: 'success',
        message: `Payment gateway ${updatedGateways[0].active ? 'activated' : 'deactivated'}`
      });
      
      // Reload settings
      loadUserAndSettings();
      
    } catch (error) {
      console.error('Error toggling payment gateway:', error);
      setToast({
        type: 'error',
        message: 'Failed to toggle payment gateway'
      });
    }
  };

  const initializeDefaultSettings = async () => {
    try {
      await databaseHelpers.settings.initializeDefaultSettings();
      
      // Log admin action
      await databaseHelpers.admin.logAdminAction(
        user.id,
        'Initialized default system settings',
        'system_settings',
        'all',
        'Initialized default settings for token price, supply, and payment gateways'
      );
      
      setToast({
        type: 'success',
        message: 'Default settings initialized successfully'
      });
      
      // Reload settings
      loadUserAndSettings();
      
    } catch (error) {
      console.error('Error initializing default settings:', error);
      setToast({
        type: 'error',
        message: 'Failed to initialize default settings'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Test System Settings</h1>
          <p className="text-gray-600 mt-2">
            Test the system settings functionality
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Actions */}
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Actions</h3>
                <div className="space-y-3">
                  <Button
                    onClick={testUpdateTokenPrice}
                    className="w-full text-left justify-start bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    💰 Test Update Token Price ($1.25)
                  </Button>
                  
                  <Button
                    onClick={testUpdateTokenSupply}
                    className="w-full text-left justify-start bg-green-600 hover:bg-green-700 text-white"
                  >
                    📊 Test Update Token Supply (2,000,000)
                  </Button>
                  
                  <Button
                    onClick={testAddGateway}
                    className="w-full text-left justify-start bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    💳 Test Add Payment Gateway
                  </Button>
                  
                  <Button
                    onClick={testToggleGateway}
                    className="w-full text-left justify-start bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    🔄 Test Toggle Gateway Status
                  </Button>
                  
                  <Button
                    onClick={initializeDefaultSettings}
                    className="w-full text-left justify-start bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    ⚙️ Initialize Default Settings
                  </Button>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/admin/settings')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    ⚙️ Go to System Settings
                  </Button>
                  
                  <Button
                    onClick={loadUserAndSettings}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    🔄 Refresh Settings
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Current Settings */}
          <div className="space-y-6">
            {/* Settings Overview */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Settings</h3>
                {settings ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900">Token Price</h4>
                          <p className="text-blue-700">${settings.tokenPrice}</p>
                        </div>
                        <div className="text-2xl">💰</div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-green-900">Token Supply</h4>
                          <p className="text-green-700">{settings.tokenSupply.toLocaleString()}</p>
                        </div>
                        <div className="text-2xl">📊</div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-purple-900">Payment Gateways</h4>
                          <p className="text-purple-700">{settings.paymentGateways.length} configured</p>
                        </div>
                        <div className="text-2xl">💳</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No settings loaded</p>
                )}
              </div>
            </Card>

            {/* Payment Gateways Details */}
            {settings && settings.paymentGateways.length > 0 && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Gateways</h3>
                  <div className="space-y-3">
                    {settings.paymentGateways.map((gateway, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-xl">💳</div>
                          <div>
                            <h5 className="font-medium text-gray-900">{gateway.name}</h5>
                            <p className="text-sm text-gray-600">
                              Status: {gateway.active ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          gateway.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {gateway.active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-8">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">✅ Implemented Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• SystemSettings collection with proper schema</li>
                    <li>• Token price management with validation</li>
                    <li>• Token supply management with validation</li>
                    <li>• Payment gateway management</li>
                    <li>• Add/remove payment gateways</li>
                    <li>• Toggle gateway active/inactive status</li>
                    <li>• Admin action logging for all changes</li>
                    <li>• Form validation (price &gt; 0, supply &gt; 0)</li>
                    <li>• Real-time settings updates</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">🔧 Test Instructions</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Click test buttons to update settings</li>
                    <li>• Visit /admin/settings for full interface</li>
                    <li>• Test form validation with invalid values</li>
                    <li>• Check admin logs for action tracking</li>
                    <li>• Verify settings persistence</li>
                    <li>• Test payment gateway management</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <Button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            Back to Admin Dashboard
          </Button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
