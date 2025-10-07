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

export default function DepositPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const { usdBalance, tikiBalance, tikiPrice, depositUSD, formatCurrency, formatTiki, getCurrencies } = useTiki();
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
  
  // Currency conversion state
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState(null);

  // Validation rules
  const MIN_AMOUNT = 100;
  const MAX_AMOUNT = 1000000;

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

  // Currency conversion function using exchangerate.host API
  const convertCurrency = async (amount, fromCurrency, toCurrency = 'USD') => {
    if (!amount || amount <= 0) {
      setConvertedAmount(null);
      setConversionError(null);
      return;
    }

    setIsConverting(true);
    setConversionError(null);

    try {
      // Call the exchangerate.host API for real-time conversion
      const response = await fetch(
        `https://api.exchangerate.host/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setConvertedAmount({
          originalAmount: amount,
          originalCurrency: fromCurrency,
          convertedAmount: data.result,
          convertedCurrency: toCurrency,
          rate: data.info?.rate || 1
        });
      } else {
        throw new Error(data.error?.info || 'Conversion failed');
      }
    } catch (err) {
      console.error('Currency conversion error:', err);
      setConversionError(err.message);
      setConvertedAmount(null);
    } finally {
      setIsConverting(false);
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
      } else if (amount < MIN_AMOUNT) {
        newErrors.amount = `Minimum deposit amount is ${MIN_AMOUNT} ${formData.currency}`;
      } else if (amount > MAX_AMOUNT) {
        newErrors.amount = `Maximum deposit amount is ${MAX_AMOUNT} ${formData.currency}`;
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
      const amount = parseFloat(formData.amount);
      
      // Use global state function to deposit USD (with currency conversion)
      // This automatically updates usdBalance in global state and persists to localStorage
      const usdAmount = depositUSD(amount, formData.currency);
      
      // Show success message with conversion details
      success(`Successfully deposited ${formatCurrency(amount, formData.currency)} (${formatCurrency(usdAmount, 'USD')} USD). New balance: ${formatCurrency(usdBalance + usdAmount, 'USD')}`);
      
      // Reset form after successful deposit
      setFormData({ amount: '', currency: 'PKR' });
    } catch (err) {
      console.error('Error processing deposit:', err);
      error('Failed to process deposit. Please try again.');
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
              <h1 className="text-3xl font-bold text-gray-900">Deposit Funds</h1>
              <p className="text-gray-600 mt-1">Add money to your wallet</p>
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

        {/* Current Tiki Price */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Current Tiki Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-blue-600">
                {formatCurrency(tikiPrice, 'USD')}
              </h2>
              <p className="text-sm text-gray-500">Per Tiki Token</p>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Deposit Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Deposit
                </label>
                <div className="relative">
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min={MIN_AMOUNT}
                    max={MAX_AMOUNT}
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
                  Minimum: {MIN_AMOUNT} {formData.currency} | Maximum: {MAX_AMOUNT} {formData.currency}
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
                  disabled={isSubmitting}
                >
                  {getCurrencies().map(currency => (
                    <option key={currency} value={currency}>
                      {currency} - {currency === 'USD' ? 'US Dollar' : 
                       currency === 'PKR' ? 'Pakistani Rupee' :
                       currency === 'EUR' ? 'Euro' :
                       currency === 'GBP' ? 'British Pound' :
                       currency === 'INR' ? 'Indian Rupee' :
                       currency === 'CAD' ? 'Canadian Dollar' :
                       currency === 'AUD' ? 'Australian Dollar' : currency}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Preview */}
              {formData.amount && !errors.amount && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Deposit Summary</h3>
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
                    <div className="border-t border-blue-200 pt-1 mt-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-blue-800">Total:</span>
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
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting || !formData.amount || !!errors.amount}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Continue to Payment'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Deposit Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Processing Time</h3>
                  <p className="text-sm text-gray-600">Deposits are typically processed within 1-2 business days.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🔒</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Security</h3>
                  <p className="text-sm text-gray-600">All transactions are encrypted and secure.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📞</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Support</h3>
                  <p className="text-sm text-gray-600">Contact support if you have any questions about your deposit.</p>
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
