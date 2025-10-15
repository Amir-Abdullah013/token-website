'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Removed direct database import - using API calls instead
import { authHelpers } from '@/lib/supabase';;
import { Button, Card, Input, Loader, Toast } from '@/components';

export default function AdminSystemSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Settings state
  const [settings, setSettings] = useState({
    tokenPrice: '',
    tokenSupply: '',
    paymentGateways: [],
    feeConfig: {
      transactionFeeRate: 0.05,
      feeReceiverId: 'ADMIN_WALLET',
      isActive: true
    }
  });
  
  // Form state
  const [forms, setForms] = useState({
    tokenPrice: { value: '', error: '' },
    tokenSupply: { value: '', error: '' },
    newGateway: { name: '', active: true },
    feeRate: { value: '5', error: '' },
    feeReceiverId: { value: 'ADMIN_WALLET', error: '' },
    feeActive: true
  });

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
      const [tokenPrice, tokenSupply, paymentGateways, feeConfig] = await Promise.all([
        databaseHelpers.settings.getTokenPrice(),
        databaseHelpers.settings.getTokenSupply(),
        databaseHelpers.settings.getPaymentGateways(),
        databaseHelpers.feeConfig.getFeeConfig()
      ]);
      
      setSettings({
        tokenPrice,
        tokenSupply,
        paymentGateways,
        feeConfig: feeConfig || {
          transactionFeeRate: 0.05,
          feeReceiverId: 'ADMIN_WALLET',
          isActive: true
        }
      });
      
      setForms(prev => ({
        ...prev,
        tokenPrice: { value: tokenPrice.toString(), error: '' },
        tokenSupply: { value: tokenSupply.toString(), error: '' },
        feeRate: { value: ((feeConfig?.transactionFeeRate || 0.05) * 100).toString(), error: '' },
        feeReceiverId: { value: feeConfig?.feeReceiverId || 'ADMIN_WALLET', error: '' },
        feeActive: feeConfig?.isActive !== false
      }));
      
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

  const handleInputChange = (field, value) => {
    setForms(prev => ({
      ...prev,
      [field]: { value, error: '' }
    }));
  };

  const validateForm = (field, value) => {
    const numValue = parseFloat(value);
    
    if (field === 'tokenPrice' || field === 'tokenSupply') {
      if (isNaN(numValue) || numValue <= 0) {
        return `${field === 'tokenPrice' ? 'Token price' : 'Token supply'} must be greater than 0`;
      }
    }
    
    return '';
  };

  const handleSaveTokenPrice = async () => {
    const price = parseFloat(forms.tokenPrice.value);
    const error = validateForm('tokenPrice', forms.tokenPrice.value);
    
    if (error) {
      setForms(prev => ({
        ...prev,
        tokenPrice: { ...prev.tokenPrice, error }
      }));
      return;
    }

    try {
      setSaving(true);
      await databaseHelpers.settings.setTokenPrice(price);
      
      // Log admin action
      await databaseHelpers.admin.logAdminAction(
        user.id,
        `Updated token price to $${price}`,
        'system_settings',
        'token_price',
        `Token price changed from $${settings.tokenPrice} to $${price}`
      );
      
      setSettings(prev => ({ ...prev, tokenPrice: price }));
      setToast({
        type: 'success',
        message: 'Token price updated successfully'
      });
      
    } catch (error) {
      console.error('Error saving token price:', error);
      setToast({
        type: 'error',
        message: 'Failed to update token price'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTokenSupply = async () => {
    const supply = parseFloat(forms.tokenSupply.value);
    const error = validateForm('tokenSupply', forms.tokenSupply.value);
    
    if (error) {
      setForms(prev => ({
        ...prev,
        tokenSupply: { ...prev.tokenSupply, error }
      }));
      return;
    }

    try {
      setSaving(true);
      await databaseHelpers.settings.setTokenSupply(supply);
      
      // Log admin action
      await databaseHelpers.admin.logAdminAction(
        user.id,
        `Updated token supply to ${supply.toLocaleString()}`,
        'system_settings',
        'token_supply',
        `Token supply changed from ${settings.tokenSupply.toLocaleString()} to ${supply.toLocaleString()}`
      );
      
      setSettings(prev => ({ ...prev, tokenSupply: supply }));
      setToast({
        type: 'success',
        message: 'Token supply updated successfully'
      });
      
    } catch (error) {
      console.error('Error saving token supply:', error);
      setToast({
        type: 'error',
        message: 'Failed to update token supply'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddGateway = async () => {
    if (!forms.newGateway.name.trim()) {
      setToast({
        type: 'error',
        message: 'Please enter a gateway name'
      });
      return;
    }

    try {
      setSaving(true);
      const newGateways = [
        ...settings.paymentGateways,
        {
          name: forms.newGateway.name,
          active: forms.newGateway.active
        }
      ];
      
      await databaseHelpers.settings.setPaymentGateways(newGateways);
      
      // Log admin action
      await databaseHelpers.admin.logAdminAction(
        user.id,
        `Added payment gateway: ${forms.newGateway.name}`,
        'system_settings',
        'payment_gateways',
        `Added ${forms.newGateway.name} gateway (${forms.newGateway.active ? 'active' : 'inactive'})`
      );
      
      setSettings(prev => ({ ...prev, paymentGateways: newGateways }));
      setForms(prev => ({
        ...prev,
        newGateway: { name: '', active: true }
      }));
      
      setToast({
        type: 'success',
        message: 'Payment gateway added successfully'
      });
      
    } catch (error) {
      console.error('Error adding payment gateway:', error);
      setToast({
        type: 'error',
        message: 'Failed to add payment gateway'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleGateway = async (index) => {
    try {
      setSaving(true);
      const updatedGateways = [...settings.paymentGateways];
      updatedGateways[index].active = !updatedGateways[index].active;
      
      await databaseHelpers.settings.setPaymentGateways(updatedGateways);
      
      // Log admin action
      await databaseHelpers.admin.logAdminAction(
        user.id,
        `${updatedGateways[index].active ? 'Activated' : 'Deactivated'} payment gateway: ${updatedGateways[index].name}`,
        'system_settings',
        'payment_gateways',
        `Gateway ${updatedGateways[index].name} is now ${updatedGateways[index].active ? 'active' : 'inactive'}`
      );
      
      setSettings(prev => ({ ...prev, paymentGateways: updatedGateways }));
      setToast({
        type: 'success',
        message: `Payment gateway ${updatedGateways[index].active ? 'activated' : 'deactivated'}`
      });
      
    } catch (error) {
      console.error('Error toggling payment gateway:', error);
      setToast({
        type: 'error',
        message: 'Failed to update payment gateway'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveGateway = async (index) => {
    if (!confirm('Are you sure you want to remove this payment gateway?')) {
      return;
    }

    try {
      setSaving(true);
      const gatewayName = settings.paymentGateways[index].name;
      const updatedGateways = settings.paymentGateways.filter((_, i) => i !== index);
      
      await databaseHelpers.settings.setPaymentGateways(updatedGateways);
      
      // Log admin action
      await databaseHelpers.admin.logAdminAction(
        user.id,
        `Removed payment gateway: ${gatewayName}`,
        'system_settings',
        'payment_gateways',
        `Removed ${gatewayName} from available payment gateways`
      );
      
      setSettings(prev => ({ ...prev, paymentGateways: updatedGateways }));
      setToast({
        type: 'success',
        message: 'Payment gateway removed successfully'
      });
      
    } catch (error) {
      console.error('Error removing payment gateway:', error);
      setToast({
        type: 'error',
        message: 'Failed to remove payment gateway'
      });
    } finally {
      setSaving(false);
    }
  };

  // Fee configuration handlers
  const handleSaveFeeConfig = async () => {
    const feeRate = parseFloat(forms.feeRate.value) / 100; // Convert percentage to decimal
    const feeReceiverId = forms.feeReceiverId.value.trim();
    const isActive = forms.feeActive;
    
    // Validate fee rate
    if (isNaN(feeRate) || feeRate < 0 || feeRate > 1) {
      setForms(prev => ({
        ...prev,
        feeRate: { ...prev.feeRate, error: 'Fee rate must be between 0% and 100%' }
      }));
      return;
    }

    // Validate fee receiver ID
    if (!feeReceiverId) {
      setForms(prev => ({
        ...prev,
        feeReceiverId: { ...prev.feeReceiverId, error: 'Fee receiver ID is required' }
      }));
      return;
    }

    try {
      setSaving(true);
      
      const feeConfigData = {
        transactionFeeRate: feeRate,
        feeReceiverId: feeReceiverId,
        isActive: isActive
      };
      
      await databaseHelpers.feeConfig.updateFeeConfig(feeConfigData);
      
      // Log admin action
      await databaseHelpers.adminLog.createAdminLog({
        adminId: user.id,
        action: 'UPDATE_FEE_CONFIG',
        targetType: 'FEE_CONFIG',
        targetId: 'fee_config',
        details: `Updated fee rate to ${(feeRate * 100).toFixed(2)}%, receiver: ${feeReceiverId}, active: ${isActive}`
      });
      
      setSettings(prev => ({ 
        ...prev, 
        feeConfig: {
          transactionFeeRate: feeRate,
          feeReceiverId: feeReceiverId,
          isActive: isActive
        }
      }));
      
      setToast({
        type: 'success',
        message: 'Fee configuration updated successfully'
      });
      
    } catch (error) {
      console.error('Error saving fee config:', error);
      setToast({
        type: 'error',
        message: 'Failed to update fee configuration'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFeeInputChange = (field, value) => {
    setForms(prev => ({
      ...prev,
      [field]: { value, error: '' }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600 mt-2">
                Manage system configuration and settings
              </p>
            </div>
            <Button
              onClick={() => router.push('/admin/dashboard')}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Token Price Settings */}
          <Card>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-3xl">💰</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Token Price</h3>
                  <p className="text-sm text-gray-600">Set the current token price in USD</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Price: ${settings.tokenPrice}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={forms.tokenPrice.value}
                    onChange={(e) => handleInputChange('tokenPrice', e.target.value)}
                    placeholder="Enter new token price"
                    className="w-full"
                  />
                  {forms.tokenPrice.error && (
                    <p className="text-sm text-red-600 mt-1">{forms.tokenPrice.error}</p>
                  )}
                </div>
                
                <Button
                  onClick={handleSaveTokenPrice}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Saving...' : 'Update Token Price'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Token Supply Settings */}
          <Card>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-3xl">📊</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Token Supply</h3>
                  <p className="text-sm text-gray-600">Set the total token supply</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Supply: {settings.tokenSupply.toLocaleString()}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={forms.tokenSupply.value}
                    onChange={(e) => handleInputChange('tokenSupply', e.target.value)}
                    placeholder="Enter new token supply"
                    className="w-full"
                  />
                  {forms.tokenSupply.error && (
                    <p className="text-sm text-red-600 mt-1">{forms.tokenSupply.error}</p>
                  )}
                </div>
                
                <Button
                  onClick={handleSaveTokenSupply}
                  disabled={saving}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? 'Saving...' : 'Update Token Supply'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Transaction Fee Settings */}
        <div className="mt-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-3xl">💰</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Transaction Fees</h3>
                  <p className="text-sm text-gray-600">Configure transaction fee system</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fee Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Fee Rate (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={forms.feeRate.value}
                    onChange={(e) => handleFeeInputChange('feeRate', e.target.value)}
                    placeholder="Enter fee rate (e.g., 5 for 5%)"
                    className="w-full"
                  />
                  {forms.feeRate.error && (
                    <p className="text-sm text-red-600 mt-1">{forms.feeRate.error}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {(settings.feeConfig.transactionFeeRate * 100).toFixed(2)}%
                  </p>
                </div>

                {/* Fee Receiver ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fee Receiver ID
                  </label>
                  <Input
                    type="text"
                    value={forms.feeReceiverId.value}
                    onChange={(e) => handleFeeInputChange('feeReceiverId', e.target.value)}
                    placeholder="ADMIN_WALLET"
                    className="w-full"
                  />
                  {forms.feeReceiverId.error && (
                    <p className="text-sm text-red-600 mt-1">{forms.feeReceiverId.error}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {settings.feeConfig.feeReceiverId}
                  </p>
                </div>
              </div>

              {/* Fee System Active Toggle */}
              <div className="mt-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="feeActive"
                    checked={forms.feeActive}
                    onChange={(e) => setForms(prev => ({
                      ...prev,
                      feeActive: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <label htmlFor="feeActive" className="text-sm font-medium text-gray-700">
                    Enable Transaction Fee System
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Current Status: {settings.feeConfig.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>

              {/* Save Button */}
              <div className="mt-6">
                <Button
                  onClick={handleSaveFeeConfig}
                  disabled={saving}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {saving ? 'Saving...' : 'Update Fee Configuration'}
                </Button>
              </div>

              {/* Fee Preview */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Fee Preview</h4>
                <div className="text-sm text-gray-600">
                  <p>For a $100 transaction:</p>
                  <p>• Fee: ${(100 * (parseFloat(forms.feeRate.value) / 100 || 0.05)).toFixed(2)}</p>
                  <p>• Net Amount: ${(100 - (100 * (parseFloat(forms.feeRate.value) / 100 || 0.05))).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Payment Gateways Settings */}
        <div className="mt-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-3xl">💳</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Payment Gateways</h3>
                  <p className="text-sm text-gray-600">Manage available payment gateways</p>
                </div>
              </div>
              
              {/* Add New Gateway */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Add New Gateway</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    type="text"
                    value={forms.newGateway.name}
                    onChange={(e) => setForms(prev => ({
                      ...prev,
                      newGateway: { ...prev.newGateway, name: e.target.value }
                    }))}
                    placeholder="Gateway name"
                    className="w-full"
                  />
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="newGatewayActive"
                      checked={forms.newGateway.active}
                      onChange={(e) => setForms(prev => ({
                        ...prev,
                        newGateway: { ...prev.newGateway, active: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <label htmlFor="newGatewayActive" className="text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                  
                  <Button
                    onClick={handleAddGateway}
                    disabled={saving}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Add Gateway
                  </Button>
                </div>
              </div>
              
              {/* Existing Gateways */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Current Gateways</h4>
                {settings.paymentGateways.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No payment gateways configured</p>
                ) : (
                  settings.paymentGateways.map((gateway, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">💳</div>
                        <div>
                          <h5 className="font-medium text-gray-900">{gateway.name}</h5>
                          <p className="text-sm text-gray-600">
                            Status: {gateway.active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleToggleGateway(index)}
                          disabled={saving}
                          size="sm"
                          className={`${
                            gateway.active 
                              ? 'bg-yellow-600 hover:bg-yellow-700' 
                              : 'bg-green-600 hover:bg-green-700'
                          } text-white`}
                        >
                          {gateway.active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          onClick={() => handleRemoveGateway(index)}
                          disabled={saving}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Settings Overview */}
        <div className="mt-8">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Settings Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">${settings.tokenPrice}</div>
                  <div className="text-blue-800 font-medium">Token Price</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {settings.tokenSupply.toLocaleString()}
                  </div>
                  <div className="text-green-800 font-medium">Token Supply</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {(settings.feeConfig.transactionFeeRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-orange-800 font-medium">Transaction Fee</div>
                  <div className="text-xs text-orange-600 mt-1">
                    {settings.feeConfig.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {settings.paymentGateways.length}
                  </div>
                  <div className="text-purple-800 font-medium">Payment Gateways</div>
                </div>
              </div>
            </div>
          </Card>
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

// Disable prerendering for this page
export const dynamic = 'force-dynamic';
















