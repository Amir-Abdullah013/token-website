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
  const { usdBalance, tikiBalance, tikiPrice, withdrawUSD, formatCurrency, formatTiki } = useTiki();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // Form state - USD only for withdrawals
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation rules
  const MIN_WITHDRAW_AMOUNT = 500;
  const MAX_WITHDRAW_AMOUNT = 1000000;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      router.push('/auth/signin?redirect=/user/withdraw');
    }
  }, [mounted, loading, isAuthenticated, router]);

  // No need for wallet data initialization since we're using global Tiki state

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
      } else if (amount > usdBalance) {
        // Check if withdrawal amount exceeds available USD balance from global state
        newErrors.amount = `Insufficient balance. Available: ${formatCurrency(usdBalance, 'USD')}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission with global state integration
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const withdrawAmount = parseFloat(formData.amount);
      
      // Step 1: Check if user has sufficient USD balance from global state
      if (usdBalance >= withdrawAmount) {
        // Step 2: Process the withdrawal using global state function
        // This automatically updates usdBalance in global state and persists to localStorage
        const withdrawalSuccess = withdrawUSD(withdrawAmount);
        
        if (withdrawalSuccess) {
          // Step 3: Show success message with updated balance
          success(`Successfully withdrew ${formatCurrency(withdrawAmount, 'USD')}. New balance: ${formatCurrency(usdBalance - withdrawAmount, 'USD')}`);
          
          // Step 4: Reset form after successful withdrawal
          setFormData({ amount: '', currency: 'USD' });
        } else {
          // Step 5: Handle withdrawal failure
          error('Withdrawal failed. Please try again.');
        }
      } else {
        // Step 6: Show insufficient balance error with current balance
        error(`Insufficient balance. Available: ${formatCurrency(usdBalance, 'USD')}, Requested: ${formatCurrency(withdrawAmount, 'USD')}`);
      }
    } catch (err) {
      console.error('Error processing withdrawal:', err);
      error('Failed to process withdrawal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (!mounted || loading) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading withdrawal page...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading state if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to sign in...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Use global state values directly (no need for memoization since we're using Tiki context)
  // These values are already optimized in the Tiki context

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Withdraw Funds</h1>
                <p className="text-gray-600 mt-2">Withdraw money from your wallet</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => router.push('/user/dashboard')}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md font-medium"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Withdraw Funds</h1>
                <p className="text-xs text-gray-600">Withdraw money from your wallet</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Current USD Balance Display */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Current USD Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Available for Withdrawal</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {formatCurrency(usdBalance, 'USD')}
              </h2>
              <p className="text-sm text-gray-500">
                Real-time balance from global state
              </p>
            </div>
          </CardContent>
        </Card>

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
                    max={usdBalance}
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    className={`pr-20 ${errors.amount ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 text-sm">{formData.currency}</span>
                  </div>
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Minimum: {MIN_WITHDRAW_AMOUNT} {formData.currency} | Maximum: {formatCurrency(usdBalance, 'USD')}
                </p>
              </div>

              {/* Currency Selection - USD Only for Withdrawals */}
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
                  disabled={isSubmitting}
                >
                  <option value="USD">US Dollar (USD) - Only USD withdrawals allowed</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Withdrawals are only available in USD from your USD balance
                </p>
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
                        {formatCurrency(usdBalance - parseFloat(formData.amount), 'USD')}
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
                  onClick={() => router.push('/user/dashboard')}
                  className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
                  disabled={isSubmitting || !formData.amount || !!errors.amount}
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
        
        </div>
        
        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </Layout>
  );
}





