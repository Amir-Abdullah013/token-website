'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { useTiki } from '../../../lib/tiki-context';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useToast, ToastContainer } from '../../../components/Toast';

export default function WithdrawPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const { usdBalance, tikiBalance, tikiPrice, formatCurrency, formatTiki } = useTiki();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    binanceAddress: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Withdrawal history state
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);

  // Validation rules
  const MIN_WITHDRAW_AMOUNT = 10;
  const MAX_WITHDRAW_AMOUNT = 10000;

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
      } else if (amount > usdBalance) {
        newErrors.amount = 'Insufficient balance';
      }
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
          binanceAddress: formData.binanceAddress
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
        setFormData({ amount: '', binanceAddress: '' });
        
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mr-4"
            >
              ← Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Withdraw Funds</h1>
              <p className="text-gray-600 mt-1">Withdraw money to your Binance account</p>
            </div>
          </div>
        </div>

        {/* Current Balances */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">USD Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {formatCurrency(usdBalance, 'USD')}
                </h2>
                <p className="text-sm text-gray-500">Available USD</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tiki Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {formatTiki(tikiBalance)} TIKI
                </h2>
                <p className="text-sm text-gray-500">Available Tokens</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">📋 Withdrawal Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Step 1: Enter Withdrawal Details</h3>
                <p className="text-blue-800 text-sm">
                  Enter the amount you want to withdraw and your Binance wallet address.
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Step 2: Submit Request</h3>
                <p className="text-green-800 text-sm">
                  Submit your withdrawal request. The amount will be deducted from your balance immediately.
                </p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">Step 3: Admin Processing</h3>
                <p className="text-yellow-800 text-sm">
                  Our admin team will manually send the funds to your Binance account within 24 hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit Withdrawal Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`pr-20 ${errors.amount ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 text-sm">USD</span>
                  </div>
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Minimum: ${MIN_WITHDRAW_AMOUNT} | Maximum: ${MAX_WITHDRAW_AMOUNT} | Available: {formatCurrency(usdBalance, 'USD')}
                </p>
              </div>

              {/* Binance Address Input */}
              <div>
                <label htmlFor="binanceAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Binance Wallet Address *
                </label>
                <Input
                  id="binanceAddress"
                  name="binanceAddress"
                  type="text"
                  value={formData.binanceAddress}
                  onChange={handleInputChange}
                  placeholder="Enter your Binance wallet address"
                  className={errors.binanceAddress ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {errors.binanceAddress && (
                  <p className="mt-1 text-sm text-red-600">{errors.binanceAddress}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Enter your Binance wallet address where you want to receive the funds
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={isSubmitting || !formData.amount || !formData.binanceAddress || !!errors.amount || !!errors.binanceAddress}
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

        {/* Withdrawal History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWithdrawals ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading withdrawals...</p>
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No withdrawal requests yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(withdrawal.amount, 'USD')}
                        </p>
                        <p className="text-sm text-gray-500">
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
                    <div className="text-sm text-gray-600">
                      <p><strong>Binance Address:</strong> {withdrawal.binanceAddress}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Important Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Processing Time</h3>
                  <p className="text-sm text-gray-600">Withdrawals are typically processed within 24 hours after admin review.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Balance Deduction</h3>
                  <p className="text-sm text-gray-600">The withdrawal amount is deducted immediately when you submit the request.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🔄</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Refunds</h3>
                  <p className="text-sm text-gray-600">If your withdrawal is rejected, the amount will be automatically refunded to your balance.</p>
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
