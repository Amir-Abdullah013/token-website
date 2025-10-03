'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useToast, ToastContainer } from '../../../components/Toast';

export default function WithdrawPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'PKR'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);

  // Validation rules
  const MIN_WITHDRAW_AMOUNT = 500;
  const MAX_WITHDRAW_AMOUNT = 1000000;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      }
    }
  }, [mounted, loading, isAuthenticated, router]);

  // Fetch wallet data
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user?.$id) return;
      
      try {
        setIsLoadingWallet(true);
        
        // Fetch wallet data from API
        const response = await fetch(`/api/wallet?userId=${user.$id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch wallet data');
        }
        
        const data = await response.json();
        setWalletData(data.wallet);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        error('Failed to load wallet information');
      } finally {
        setIsLoadingWallet(false);
      }
    };

    if (user?.$id) {
      fetchWalletData();
    }
  }, [user?.$id, error]);

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
        newErrors.amount = `Minimum withdrawal amount is ${MIN_WITHDRAW_AMOUNT} ${formData.currency}`;
      } else if (amount > MAX_WITHDRAW_AMOUNT) {
        newErrors.amount = `Maximum withdrawal amount is ${MAX_WITHDRAW_AMOUNT} ${formData.currency}`;
      } else if (walletData && amount > walletData.balance) {
        newErrors.amount = `Insufficient balance. Available: ${walletData.balance.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} ${walletData.currency}`;
      }
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
      // Store form data in session storage for confirmation page
      sessionStorage.setItem('withdrawData', JSON.stringify({
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        timestamp: new Date().toISOString()
      }));

      // Navigate to confirmation page
      router.push('/user/withdraw/confirm');
    } catch (err) {
      console.error('Error processing withdrawal:', err);
      error('Failed to process withdrawal request. Please try again.');
    } finally {
      setIsSubmitting(false);
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

  const currentBalance = walletData?.balance || 0;
  const currency = walletData?.currency || 'PKR';

  return (
    <Layout showSidebar={true}>
      <div className="max-w-2xl mx-auto">
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
              <p className="text-gray-600 mt-1">Withdraw money from your wallet</p>
            </div>
          </div>
        </div>

        {/* Current Balance */}
        {isLoadingWallet ? (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-48"></div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Available Balance</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentBalance.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} {currency}
                </h2>
                <p className="text-sm text-gray-500">
                  Last updated {walletData?.lastUpdated ? new Date(walletData.lastUpdated).toLocaleString() : 'Unknown'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Withdrawal Form */}
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Withdraw
                </label>
                <div className="relative">
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min={MIN_WITHDRAW_AMOUNT}
                    max={currentBalance}
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    className={`pr-20 ${errors.amount ? 'border-red-500' : ''}`}
                    disabled={isSubmitting || isLoadingWallet}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 text-sm">{formData.currency}</span>
                  </div>
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Minimum: {MIN_WITHDRAW_AMOUNT} {formData.currency} | Maximum: {currentBalance.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} {formData.currency}
                </p>
              </div>

              {/* Currency Selection */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting || isLoadingWallet}
                >
                  <option value="PKR">Pakistani Rupee (PKR)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>

              {/* Amount Preview */}
              {formData.amount && !errors.amount && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Withdrawal Summary</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">Amount:</span>
                      <span className="font-medium text-blue-900">
                        {parseFloat(formData.amount).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} {formData.currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">Processing Fee:</span>
                      <span className="font-medium text-blue-900">Free</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">Remaining Balance:</span>
                      <span className="font-medium text-blue-900">
                        {(currentBalance - parseFloat(formData.amount)).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} {formData.currency}
                      </span>
                    </div>
                    <div className="border-t border-blue-200 pt-1 mt-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-blue-800">Total Withdrawal:</span>
                        <span className="text-blue-900">
                          {parseFloat(formData.amount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} {formData.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                  disabled={isSubmitting || !formData.amount || !!errors.amount || isLoadingWallet}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Continue to Confirmation'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Withdrawal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Processing Time</h3>
                  <p className="text-sm text-gray-600">Withdrawals are typically processed within 1-2 business days.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🔒</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Security</h3>
                  <p className="text-sm text-gray-600">All withdrawal requests are reviewed for security purposes.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📧</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                  <p className="text-sm text-gray-600">You will receive email updates about your withdrawal status.</p>
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





