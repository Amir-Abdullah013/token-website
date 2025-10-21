'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useVon } from '@/lib/Von-context';
// Removed complex session logic - using simple authentication
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast, ToastContainer } from '@/components/Toast';

export default function DepositPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const { usdBalance, VonBalance, VonPrice, formatCurrency, formatVon } = useVon();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    network: '',
    screenshot: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [binanceAddress, setBinanceAddress] = useState('');
  const [exchangeRates, setExchangeRates] = useState({});
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [depositAddresses, setDepositAddresses] = useState({ bep20: '', trc20: '' });

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

  // Fetch deposit addresses
  useEffect(() => {
    const fetchDepositAddresses = async () => {
      try {
        const response = await fetch('/api/deposit-addresses');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setDepositAddresses(data.data);
          }
        }
      } catch (err) {
        console.error('Error fetching deposit addresses:', err);
      }
    };

    if (mounted) {
      fetchDepositAddresses();
    }
  }, [mounted]);

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

    // Network validation
    if (!formData.network || formData.network.trim() === '') {
      newErrors.network = 'Network type is required';
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Deposit Funds</h1>
              <p className="text-slate-300 mt-1">Add money to your wallet via Binance</p>
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
              <CardTitle className="text-lg text-amber-200">Von Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">
                  {formatVon(VonBalance)} Von
                </h2>
                <p className="text-sm text-amber-300">Available Tokens</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Premium Deposit Addresses */}
        <Card className="mb-6 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">🏦 Deposit Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-4 rounded-lg border border-yellow-400/30">
                <h3 className="font-semibold text-yellow-200 mb-2">BEP20 Address (BSC Network)</h3>
                <div className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 p-3 rounded border border-slate-500/30 flex items-center justify-between">
                  <code className="text-sm font-mono break-all flex-1 mr-3 text-slate-300">
                    {depositAddresses.bep20 || 'Address not configured'}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(depositAddresses.bep20 || '')}
                    disabled={!depositAddresses.bep20}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-3 py-1 text-xs shadow-lg shadow-yellow-500/25 disabled:opacity-50"
                  >
                    📋 Copy
                  </Button>
                </div>
                <p className="text-xs text-yellow-300 mt-2">Use this address for BEP20 tokens on BSC network</p>
              </div>
              
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 p-4 rounded-lg border border-red-400/30">
                <h3 className="font-semibold text-red-200 mb-2">TRC20 Address (Tron Network)</h3>
                <div className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 p-3 rounded border border-slate-500/30 flex items-center justify-between">
                  <code className="text-sm font-mono break-all flex-1 mr-3 text-slate-300">
                    {depositAddresses.trc20 || 'Address not configured'}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(depositAddresses.trc20 || '')}
                    disabled={!depositAddresses.trc20}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-3 py-1 text-xs shadow-lg shadow-red-500/25 disabled:opacity-50"
                  >
                    📋 Copy
                  </Button>
                </div>
                <p className="text-xs text-red-300 mt-2">Use this address for TRC20 tokens on Tron network</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Binance Deposit Instructions */}
        <Card className="mb-6 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">📋 Deposit Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-4 rounded-lg border border-cyan-400/30">
                <h3 className="font-semibold text-cyan-200 mb-2">Step 1: Send Amount to Binance</h3>
                <p className="text-cyan-300 text-sm mb-3">
                  Send your amount to either of the  Binance addresses (BEP20 or TRC20) :
                </p>
                
              </div>
              
              <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 p-4 rounded-lg border border-emerald-400/30">
                <h3 className="font-semibold text-emerald-200 mb-2">Step 2: Submit Deposit Request</h3>
                <p className="text-emerald-300 text-sm">
                  After sending amount, enter the USD equivalent amount and upload a screenshot of your transaction.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 p-4 rounded-lg border border-amber-400/30">
                <h3 className="font-semibold text-amber-200 mb-2">Step 3: Wait for Approval</h3>
                <p className="text-amber-300 text-sm">
                  Our admin team will review your deposit request and approve it within 24 hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Deposit Form */}
        <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">Submit Deposit Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Currency Selection */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-slate-300 mb-2">
                  Select Currency *
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleCurrencyChange}
                  className="w-full px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400"
                  disabled={isSubmitting}
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency.code} value={currency.code} className="bg-slate-800 text-white">
                      {currency.symbol} {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
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
                    className={`w-full px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200 hover:border-slate-400/50 appearance-none cursor-pointer text-sm sm:text-base ${errors.network ? 'border-red-500' : ''}`}
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
                  Choose the network type for your deposit transaction
                </p>
              </div>

              {/* Premium Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
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
                    className={`pr-20 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 ${errors.amount ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-slate-400 text-sm">{formData.currency}</span>
                  </div>
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-400">{errors.amount}</p>
                )}
                
                {/* Premium USD Conversion Display */}
                {formData.amount && convertedAmount > 0 && (
                  <div className="mt-2 p-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-emerald-200">
                        <strong>USD Equivalent:</strong> ${convertedAmount.toFixed(2)}
                      </span>
                      <span className="text-xs text-emerald-300">
                        Rate: 1 {formData.currency} = ${(1 / exchangeRates[formData.currency]).toFixed(4)} USD
                      </span>
                    </div>
                  </div>
                )}
                
                <p className="mt-1 text-sm text-slate-400">
                  Minimum: ${MIN_AMOUNT} USD | Maximum: ${MAX_AMOUNT} USD
                </p>
              </div>

              {/* Premium Screenshot Upload */}
              <div>
                <label htmlFor="screenshot" className="block text-sm font-medium text-slate-300 mb-2">
                  Transaction Screenshot *
                </label>
                <input
                  id="screenshot"
                  name="screenshot"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileChange}
                  className={`block w-full text-sm text-slate-200 placeholder-slate-300 placeholder-opacity-90 file:mr-4 file:py-2 file:px-4 file:rounded-full file:text-sm file:font-semibold file:bg-gradient-to-r file:from-emerald-500/20 file:to-green-500/20 file:text-emerald-200 hover:file:from-emerald-500/30 hover:file:to-green-500/30 file:border file:border-emerald-400/30 ${errors.screenshot ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.screenshot && (
                  <p className="mt-1 text-sm text-red-400">{errors.screenshot}</p>
                )}
                <p className="mt-1 text-sm text-slate-400">
                  Upload a screenshot of your Binance transaction (JPG, PNG, max 5MB)
                </p>
              </div>

              {/* Premium Submit Buttons */}
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
                  className="flex-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30"
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
                  <p className="text-sm text-slate-300">Deposits are typically processed within 24 hours after admin review.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🔒</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-white">Security</h3>
                  <p className="text-sm text-slate-300">All transactions are verified by our admin team for security.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📞</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-white">Support</h3>
                  <p className="text-sm text-slate-300">Contact support if you have any questions about your deposit.</p>
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

