'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTiki } from '@/lib/tiki-context';
import { useFeeCalculator } from '@/lib/hooks/useFeeCalculator';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast, ToastContainer } from '@/components/Toast';

export default function WithdrawPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const { usdBalance, tikiBalance, tikiPrice, formatCurrency, formatTiki } = useTiki();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    binanceAddress: '',
    network: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Withdrawal history state
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);

  // Validation rules
  const MIN_WITHDRAW_AMOUNT = 10;
  const MAX_WITHDRAW_AMOUNT = 10000;

  // Calculate fee for withdrawal (10% fee)
  const amount = parseFloat(formData.amount) || 0;
  const feeCalculation = useFeeCalculator('withdraw', amount);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else {
        loadWithdrawals();
      }
    }
  }, [mounted, loading, isAuthenticated, router]);

  const loadWithdrawals = async () => {
    try {
      setLoadingWithdrawals(true);
      const response = await fetch('/api/withdraw');
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (err) {
      console.error('Error loading withdrawals:', err);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Amount validation
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      } else if (amount < MIN_WITHDRAW_AMOUNT) {
        newErrors.amount = `Minimum withdrawal amount is $${MIN_WITHDRAW_AMOUNT}`;
      } else if (amount > MAX_WITHDRAW_AMOUNT) {
        newErrors.amount = `Maximum withdrawal amount is $${MAX_WITHDRAW_AMOUNT}`;
      } else {
        const totalRequired = amount + feeCalculation.fee;
        if (totalRequired > usdBalance) {
          newErrors.amount = `Insufficient balance. Required: $${totalRequired.toFixed(2)} ($${amount.toFixed(2)} + $${feeCalculation.fee.toFixed(2)} fee)`;
        }
      }
    }

    // Network validation
    if (!formData.network) {
      newErrors.network = 'Network selection is required';
    }

    // Binance address validation
    if (!formData.binanceAddress) {
      newErrors.binanceAddress = 'Binance address is required';
    } else if (formData.binanceAddress.length < 20) {
      newErrors.binanceAddress = 'Binance address must be at least 20 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          binanceAddress: formData.binanceAddress,
          network: formData.network
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing response JSON:', jsonError);
        error('Server returned invalid response. Please try again.');
        return;
      }

      if (response.ok) {
        success('Withdrawal request submitted successfully. Waiting for admin confirmation.');
        
        // Reset form
        setFormData({ amount: '', binanceAddress: '', network: '' });
        
        // Reload withdrawals to show the new request
        loadWithdrawals();
      } else {
        const errorMessage = data.details ? `${data.error}: ${data.details}` : data.error;
        error(errorMessage || 'Failed to submit withdrawal request');
      }
    } catch (err) {
      console.error('Error submitting withdrawal request:', err);
      error('Failed to submit withdrawal request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'COMPLETED': return 'Approved';
      case 'FAILED': return 'Rejected';
      default: return status;
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout showSidebar={true}>
      <div className="max-w-4xl mx-auto">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mr-4 text-slate-300 hover:text-white hover:bg-slate-700/50"
            >
              ← Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Withdraw Funds</h1>
              <p className="text-slate-300 mt-1">Withdraw money to your Binance account</p>
            </div>
          </div>
        </div>

        {/* Premium Current Balances */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 border border-emerald-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20">
            <CardHeader>
              <CardTitle className="text-lg text-emerald-200">USD Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">
                  {formatCurrency(usdBalance, 'USD')}
                </h2>
                <p className="text-sm text-emerald-300">Available USD</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20">
            <CardHeader>
              <CardTitle className="text-lg text-amber-200">Tiki Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">
                  {formatTiki(tikiBalance)} TIKI
                </h2>
                <p className="text-sm text-amber-300">Available Tokens</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Premium Withdrawal Instructions */}
        <Card className="mb-6 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">📋 Withdrawal Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-4 rounded-lg border border-cyan-400/30">
                <h3 className="font-semibold text-cyan-200 mb-2">Step 1: Enter Withdrawal Details</h3>
                <p className="text-cyan-300 text-sm">
                  Enter the amount you want to withdraw and your Binance wallet address.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 p-4 rounded-lg border border-emerald-400/30">
                <h3 className="font-semibold text-emerald-200 mb-2">Step 2: Submit Request</h3>
                <p className="text-emerald-300 text-sm">
                  Submit your withdrawal request. The amount will be deducted from your balance immediately.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 p-4 rounded-lg border border-amber-400/30">
                <h3 className="font-semibold text-amber-200 mb-2">Step 3: Admin Processing</h3>
                <p className="text-amber-300 text-sm">
                  Our admin team will manually send the funds to your Binance account within 24 hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Withdrawal Form */}
        <Card className="mb-6 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">Submit Withdrawal Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
                  Withdrawal Amount (USD) *
                </label>
                <div className="relative">
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min={MIN_WITHDRAW_AMOUNT}
                    max={MAX_WITHDRAW_AMOUNT}
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Enter amount in USD"
                    className={`pr-20 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30 ${errors.amount ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-slate-400 text-sm">USD</span>
                  </div>
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-400">{errors.amount}</p>
                )}
                <p className="mt-1 text-sm text-slate-400">
                  Minimum: ${MIN_WITHDRAW_AMOUNT} | Maximum: ${MAX_WITHDRAW_AMOUNT} | Available: {formatCurrency(usdBalance, 'USD')}
                </p>
                
                {/* Fee Information Display */}
                {amount > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between items-center mb-1">
                        <span>Withdrawal Amount:</span>
                        <span className="font-medium">${amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span>Fee ({feeCalculation.feePercentage}%):</span>
                        <span className="font-medium text-orange-600">${feeCalculation.fee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-1">
                        <span className="font-medium">Total Required:</span>
                        <span className="font-bold text-blue-600">${(amount + feeCalculation.fee).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        You will receive: ${amount.toFixed(2)} (after fee deduction)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Premium Network Selection - Mobile Responsive */}
              <div>
                <label htmlFor="network" className="block text-sm font-medium text-slate-200 mb-3">
                  <span className="flex items-center">
                    <span className="mr-2">🌐</span>
                    Network Type *
                  </span>
                </label>
                <div className="relative">
                  <select
                    id="network"
                    name="network"
                    value={formData.network}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 transition-all duration-200 hover:border-slate-400/50 appearance-none cursor-pointer text-sm sm:text-base ${errors.network ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  >
                    <option value="" className="bg-slate-800 text-white py-2">🌐 Select Network</option>
                    <option value="BEP20" className="bg-slate-800 text-white py-2">🟡 BSC (BNB Smart Chain) - BEP20</option>
                    <option value="TRC20" className="bg-slate-800 text-white py-2">🔴 TRX (Tron Network) - TRC20</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.network && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.network}
                  </p>
                )}
                
                {/* Premium Network Information */}
                <div className="mt-3 p-3 bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-lg border border-slate-600/30">
                  <div className="text-xs text-slate-300">
                    <div className="flex items-center mb-1">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                      <span className="font-medium">BEP20:</span>
                      <span className="ml-1 text-slate-400">Lower fees, faster transactions</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      <span className="font-medium">TRC20:</span>
                      <span className="ml-1 text-slate-400">Widely supported, stable network</span>
                    </div>
                  </div>
                </div>
                
                <p className="mt-2 text-xs sm:text-sm text-slate-400">
                  Choose the network type for your withdrawal address
                </p>
              </div>

              {/* Binance Address Input */}
              <div>
                <label htmlFor="binanceAddress" className="block text-sm font-medium text-slate-300 mb-2">
                  Binance Wallet Address *
                </label>
                <Input
                  id="binanceAddress"
                  name="binanceAddress"
                  type="text"
                  value={formData.binanceAddress}
                  onChange={handleInputChange}
                  placeholder="Enter your Binance wallet address"
                  className={`bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30 ${errors.binanceAddress ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.binanceAddress && (
                  <p className="mt-1 text-sm text-red-400">{errors.binanceAddress}</p>
                )}
                <p className="mt-1 text-sm text-slate-400">
                  Enter your Binance wallet address where you want to receive the funds
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-rose-500 via-red-500 to-pink-600 hover:from-rose-600 hover:via-red-600 hover:to-pink-700 text-white shadow-lg shadow-rose-500/25 border border-rose-400/30"
                  disabled={isSubmitting || !formData.amount || !formData.binanceAddress || !formData.network || !!errors.amount || !!errors.binanceAddress || !!errors.network}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Withdrawal Request'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Premium Withdrawal History */}
        <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWithdrawals ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2"></div>
                <p className="text-slate-300">Loading withdrawals...</p>
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No withdrawal requests yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="bg-gradient-to-r from-slate-700/30 to-slate-800/30 border border-slate-600/30 rounded-lg p-4 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-white">
                          {formatCurrency(withdrawal.amount, 'USD')}
                        </p>
                        <p className="text-sm text-slate-400">
                          {new Date(withdrawal.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(withdrawal.status)}`}>
                        {getStatusText(withdrawal.status)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-300">
                      <p><strong>Binance Address:</strong> {withdrawal.binanceAddress}</p>
                      {withdrawal.network && (
                        <p><strong>Network:</strong> {withdrawal.network}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Premium Information Card */}
        <Card className="mt-6 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Important Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-white">Processing Time</h3>
                  <p className="text-sm text-slate-300">Withdrawals are typically processed within 24 hours after admin review.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-white">Balance Deduction</h3>
                  <p className="text-sm text-slate-300">The withdrawal amount is deducted immediately when you submit the request.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🔄</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-white">Refunds</h3>
                  <p className="text-sm text-slate-300">If your withdrawal is rejected, the amount will be automatically refunded to your balance.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';
