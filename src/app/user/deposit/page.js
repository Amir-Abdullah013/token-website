'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { useTiki } from '../../../lib/tiki-context';
// Removed complex session logic - using simple authentication
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useToast, ToastContainer } from '../../../components/Toast';

export default function DepositPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const { usdBalance, tikiBalance, tikiPrice, formatCurrency, formatTiki } = useTiki();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    screenshot: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [binanceAddress, setBinanceAddress] = useState('');
  const [exchangeRates, setExchangeRates] = useState({});
  const [convertedAmount, setConvertedAmount] = useState(0);

  // Validation rules
  const MIN_AMOUNT = 10;
  const MAX_AMOUNT = 10000;

  // Currency options
  const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else {
        loadBinanceAddress();
        loadExchangeRates();
      }
    }
  }, [mounted, loading, isAuthenticated, router]);

  // Load exchange rates
  const loadExchangeRates = async () => {
    try {
      // For demo purposes, using static rates. In production, use a real API like exchangerate-api.com
      const rates = {
        USD: 1,
        PKR: 280,
        EUR: 0.85,
        GBP: 0.73,
        CAD: 1.35,
        AUD: 1.48,
        JPY: 110,
        INR: 83,
        CNY: 7.2,
        AED: 3.67
      };
      setExchangeRates(rates);
    } catch (err) {
      console.error('Error loading exchange rates:', err);
    }
  };

  const loadBinanceAddress = async () => {
    try {
      const response = await fetch('/api/system/binance-address');
      if (response.ok) {
        const data = await response.json();
        setBinanceAddress(data.address || 'TX7k8t9w2ZkDh8mA1pQw6yLbNvF3gHjK9mP2qR5sT8uV1wX4yZ7aBcEfGhJkLmNoPqRsTuVwXyZ');
      }
    } catch (err) {
      console.error('Error loading Binance address:', err);
      // Use fallback address
      setBinanceAddress('TX7k8t9w2ZkDh8mA1pQw6yLbNvF3gHjK9mP2qR5sT8uV1wX4yZ7aBcEfGhJkLmNoPqRsTuVwXyZ');
    }
  };

  // Copy Binance address to clipboard
  const copyBinanceAddress = async () => {
    try {
      await navigator.clipboard.writeText(binanceAddress);
      success('Binance address copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy address:', err);
      error('Failed to copy address. Please copy manually.');
    }
  };

  // Convert amount to USD
  const convertToUSD = (amount, fromCurrency) => {
    if (!amount || !exchangeRates[fromCurrency]) return 0;
    return (parseFloat(amount) / exchangeRates[fromCurrency]).toFixed(2);
  };

  // Handle currency change
  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setFormData(prev => ({
      ...prev,
      currency: newCurrency
    }));
    
    // Recalculate USD amount if amount is entered
    if (formData.amount) {
      const usdAmount = convertToUSD(formData.amount, newCurrency);
      setConvertedAmount(parseFloat(usdAmount));
    }
  };

  // Handle amount change
  const handleAmountChange = (e) => {
    const amount = e.target.value;
    setFormData(prev => ({
      ...prev,
      amount
    }));
    
    // Convert to USD
    if (amount) {
      const usdAmount = convertToUSD(amount, formData.currency);
      setConvertedAmount(parseFloat(usdAmount));
    } else {
      setConvertedAmount(0);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle amount field with currency conversion
    if (name === 'amount') {
      handleAmountChange(e);
      return;
    }
    
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

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          screenshot: 'Only JPG, JPEG, and PNG files are allowed'
        }));
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          screenshot: 'File size must be less than 5MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        screenshot: file
      }));

      // Clear error
      if (errors.screenshot) {
        setErrors(prev => ({
          ...prev,
          screenshot: ''
        }));
      }
    }
  };

  // Validate form - SIMPLIFIED
  const validateForm = () => {
    const newErrors = {};
    
    // Amount validation
    if (!formData.amount || formData.amount.trim() === '') {
      newErrors.amount = 'Amount is required';
    } else {
      const usdAmount = convertedAmount || parseFloat(formData.amount);
      
      if (isNaN(usdAmount) || usdAmount <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      } else if (usdAmount < MIN_AMOUNT) {
        newErrors.amount = `Minimum deposit amount is $${MIN_AMOUNT} USD`;
      } else if (usdAmount > MAX_AMOUNT) {
        newErrors.amount = `Maximum deposit amount is $${MAX_AMOUNT} USD`;
      }
    }

    // Screenshot validation
    if (!formData.screenshot) {
      newErrors.screenshot = 'Screenshot is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission - SIMPLIFIED APPROACH
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Form submission started');
    console.log('👤 User:', user ? { email: user.email, id: user.id } : 'No user');
    
    // Validate form first
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      const usdAmount = convertedAmount || parseFloat(formData.amount);
      formDataToSend.append('amount', usdAmount.toString());
      formDataToSend.append('screenshot', formData.screenshot);

      console.log('📤 Submitting deposit request...', {
        amount: usdAmount,
        user: user?.email,
        hasScreenshot: !!formData.screenshot
      });

      const response = await fetch('/api/deposit', {
        method: 'POST',
        body: formDataToSend
      });

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      let data;
      try {
        const responseText = await response.text();
        console.log('📄 Raw response:', responseText);
        
        if (responseText && responseText.trim() !== '') {
          data = JSON.parse(responseText);
        } else {
          console.warn('⚠️ Empty response from server');
          data = { success: false, error: 'Empty response from server' };
        }
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError);
        data = { success: false, error: 'Invalid response format' };
      }

      console.log('📊 Parsed response data:', data);

      if (response.ok) {
        success('Deposit request submitted successfully. Waiting for admin confirmation.');
        
        // Reset form
        setFormData({ amount: '', currency: 'USD', screenshot: null });
        setConvertedAmount(0);
        const fileInput = document.getElementById('screenshot');
        if (fileInput) fileInput.value = '';
      } else {
        console.error('❌ Deposit request failed:', data);
        
        if (response.status === 401) {
          error('Authentication required. Please log in again.');
          setTimeout(() => {
            router.push('/auth/signin');
          }, 2000);
        } else {
          error(data.error || 'Failed to submit deposit request');
        }
      }
    } catch (err) {
      console.error('❌ Error submitting deposit request:', err);
      error('Failed to submit deposit request. Please try again.');
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
              <h1 className="text-3xl font-bold text-gray-900">Deposit Funds</h1>
              <p className="text-gray-600 mt-1">Add money to your wallet via Binance</p>
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

        {/* Binance Deposit Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">📋 Deposit Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Step 1: Send Amount to Binance</h3>
                <p className="text-blue-800 text-sm mb-3">
                  Send your amount to the Binance address below:
                </p>
                <div className="bg-white p-3 rounded border flex items-center justify-between">
                  <code className="text-sm font-mono break-all flex-1 mr-3">{binanceAddress}</code>
                  <Button
                    type="button"
                    size="sm"
                    onClick={copyBinanceAddress}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                  >
                    📋 Copy
                  </Button>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Step 2: Submit Deposit Request</h3>
                <p className="text-green-800 text-sm">
                  After sending amount, enter the USD equivalent amount and upload a screenshot of your transaction.
                </p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">Step 3: Wait for Approval</h3>
                <p className="text-yellow-800 text-sm">
                  Our admin team will review your deposit request and approve it within 24 hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Deposit Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Currency Selection */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Currency *
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleCurrencyChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount in {formData.currency} *
                </label>
                <div className="relative">
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder={`Enter amount in ${formData.currency}`}
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
                
                {/* USD Conversion Display */}
                {formData.amount && convertedAmount > 0 && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-800">
                        <strong>USD Equivalent:</strong> ${convertedAmount.toFixed(2)}
                      </span>
                      <span className="text-xs text-green-600">
                        Rate: 1 {formData.currency} = ${(1 / exchangeRates[formData.currency]).toFixed(4)} USD
                      </span>
                    </div>
                  </div>
                )}
                
                <p className="mt-1 text-sm text-gray-500">
                  Minimum: ${MIN_AMOUNT} USD | Maximum: ${MAX_AMOUNT} USD
                </p>
              </div>

              {/* Screenshot Upload */}
              <div>
                <label htmlFor="screenshot" className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Screenshot *
                </label>
                <input
                  id="screenshot"
                  name="screenshot"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileChange}
                  className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${errors.screenshot ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.screenshot && (
                  <p className="mt-1 text-sm text-red-600">{errors.screenshot}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Upload a screenshot of your Binance transaction (JPG, PNG, max 5MB)
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
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Deposit Request'
                  )}
                </Button>
              </div>
              
            </form>
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
                  <p className="text-sm text-gray-600">Deposits are typically processed within 24 hours after admin review.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🔒</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Security</h3>
                  <p className="text-sm text-gray-600">All transactions are verified by our admin team for security.</p>
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

// Disable prerendering for this page
export const dynamic = 'force-dynamic';

