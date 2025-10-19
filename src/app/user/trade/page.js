'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTiki } from '@/lib/tiki-context';
import { usePriceUpdates } from '../../../hooks/usePriceUpdates';
import { useFeeCalculator } from '@/lib/hooks/useFeeCalculator';
import { useMarketData } from '../../../hooks/useMarketData';
import { useOrderBook } from '../../../hooks/useOrderBook';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import TikiPriceChart from '@/components/TikiPriceChart';
import { ToastContainer, useToast } from '@/components/Toast';
import { AlertModal } from '@/components/Modal';

export default function TradePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const { usdBalance, tikiBalance, tikiPrice, setUsdBalance, setTikiBalance, setTikiPrice, formatCurrency, formatTiki, buyTiki, sellTiki } = useTiki();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { toasts, removeToast } = useToast();
  
  // Modal state for trade success/error messages
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeModalData, setTradeModalData] = useState({
    type: 'success',
    title: '',
    message: ''
  });
  
  // Enable real-time price updates every 30 seconds (minimal frequency for static chart)
  usePriceUpdates(30000);

  // Helper function to show trade modal
  const showTradeModalMessage = (type, title, message) => {
    setTradeModalData({ type, title, message });
    setShowTradeModal(true);
  };

  // Tiki trading state - only for Tiki tokens
  const [tradeType, setTradeType] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [total, setTotal] = useState(0);
  const [isTrading, setIsTrading] = useState(false);
  
  // Orders state
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Calculate fee for trading (1% for buy/sell)
  const amountValue = parseFloat(amount) || 0;
  const feeCalculation = useFeeCalculator(tradeType, amountValue);

  // Live market data from API
  const { 
    marketData, 
    loading: marketLoading, 
    error: marketError, 
    refresh: refreshMarketData,
    formatCurrency: formatMarketCurrency,
    formatNumber,
    formatPercentage,
    getPriceChangeColor,
    getPriceChangeIcon,
    getMarketStatus
  } = useMarketData(30000); // Refresh every 30 seconds

  // Live order book and trades data
  const {
    orderBook,
    recentTrades,
    loading: orderBookLoading,
    error: orderBookError,
    refresh: refreshOrderBook,
    formatPrice,
    formatAmount,
    formatTotal,
    formatPakistaniTime,
    formatPakistaniDateTime,
    getTradeTypeColor,
    getTradeTypeIcon,
    calculateSpread,
    getMarketDepth,
    getTopBids,
    getTopAsks,
    getRecentTradesList,
    getTradeStats
  } = useOrderBook(15000); // Refresh every 15 seconds
  
  const [priceHistory, setPriceHistory] = useState([]);

  // Initialize component
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      router.push('/auth/signin?redirect=/user/trade');
    }
  }, [mounted, loading, isAuthenticated, router]);

  // Update price input when market data changes
  useEffect(() => {
    if (marketData.price > 0) {
      setPrice(marketData.price.toString());
    }
  }, [marketData.price]);

  // Calculate total
  useEffect(() => {
    if (amount && price) {
      setTotal(parseFloat(amount) * parseFloat(price));
    } else {
      setTotal(0);
    }
  }, [amount, price]);

  // Mobile detection for responsive design
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch user orders
  const fetchUserOrders = async () => {
    if (!user?.id) return;
    
    setOrdersLoading(true);
    try {
      const response = await fetch(`/api/orders/user/${user.id}?status=PENDING`);
      const data = await response.json();
      
      if (data.success) {
        setUserOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch orders on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchUserOrders();
    }
  }, [user?.id]);

  // Cancel order handler
  const handleCancelOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showTradeModalMessage('success', 'Order Canceled', 'Your order has been canceled successfully');
        fetchUserOrders(); // Refresh orders list
      } else {
        showTradeModalMessage('error', 'Cancellation Failed', data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error canceling order:', error);
      showTradeModalMessage('error', 'Error', 'An error occurred while canceling the order');
    }
  };

  // Handle trade execution with API-based price calculation
  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showTradeModalMessage('error', 'Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      showTradeModalMessage('error', 'Invalid Price', 'Please enter a valid price for limit order');
      return;
    }

    setIsTrading(true);
    try {
      const amountValue = parseFloat(amount);
      const priceValue = parseFloat(price);
      
      // LIMIT ORDER LOGIC
      if (orderType === 'limit') {
        // Create a limit order
        const response = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderType: tradeType.toUpperCase(),
            priceType: 'LIMIT',
            amount: amountValue,
            limitPrice: priceValue
          }),
        });

        const result = await response.json();

        if (result.success) {
          showTradeModalMessage(
            'success',
            'Limit Order Created! 📋',
            `Your ${tradeType} limit order has been created. It will execute when the price reaches ${formatCurrency(priceValue, 'USD')}`
          );
          // Refresh orders list if it exists
          if (typeof fetchUserOrders === 'function') {
            fetchUserOrders();
          }
        } else {
          showTradeModalMessage('error', 'Order Failed', result.error || 'Failed to create limit order');
        }
        
      } else {
        // MARKET ORDER LOGIC
        if (tradeType === 'buy') {
          // BUYING TIKI TOKENS LOGIC
          // Check if user has sufficient USD balance
          if (amountValue > usdBalance) {
            showTradeModalMessage(
              'error',
              'Insufficient Balance',
              `You don't have enough USD balance. Available: ${formatCurrency(usdBalance, 'USD')}`
            );
            return;
          }
          
          // Use the new API-based buy function
          const result = await buyTiki(amountValue);
          
          if (result.success) {
            let message = `Successfully bought ${formatTiki(result.tokensBought)} Tiki tokens for ${formatCurrency(amountValue, 'USD')}!`;
            if (result.newPrice !== result.oldPrice) {
              message += `\n\nPrice updated from ${formatCurrency(result.oldPrice)} to ${formatCurrency(result.newPrice)} per token!`;
            }
            showTradeModalMessage('success', 'Buy Successful! 🎉', message);
          } else {
            showTradeModalMessage('error', 'Buy Failed', result.error || 'Unknown error occurred');
          }
          
        } else {
          // SELLING TIKI TOKENS LOGIC
          // Check if user has sufficient Tiki balance
          if (amountValue > tikiBalance) {
            showTradeModalMessage(
              'error',
              'Insufficient Balance',
              `You don't have enough Tiki balance. Available: ${formatTiki(tikiBalance)} TIKI`
            );
            return;
          }
          
          // Use the new API-based sell function
          const result = await sellTiki(amountValue);
          
          if (result.success) {
            let message = `Successfully sold ${formatTiki(amountValue)} Tiki tokens for ${formatCurrency(result.usdReceived, 'USD')}!`;
            if (result.newPrice !== result.oldPrice) {
              message += `\n\nPrice updated from ${formatCurrency(result.oldPrice)} to ${formatCurrency(result.newPrice)} per token!`;
            }
            showTradeModalMessage('success', 'Sell Successful! 🎉', message);
          } else {
            showTradeModalMessage('error', 'Sell Failed', result.error || 'Unknown error occurred');
          }
        }
      }
      
      // Reset form after successful trade/order
      setAmount('');
      if (orderType === 'limit') {
        setPrice('');
      }
    } catch (error) {
      console.error('Trade error:', error);
      showTradeModalMessage('error', 'Trade Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsTrading(false);
    }
  };

  // Show loading state
  if (!mounted || loading) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading trading interface...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading state if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Redirecting to sign in...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-slate-800/40 via-slate-700/30 to-slate-800/40 shadow-xl border-b border-slate-600/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Trading</h1>
                <p className="text-slate-300">Trade cryptocurrencies with advanced tools</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/user/dashboard')}
                  className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-slate-800/40 via-slate-700/30 to-slate-800/40 border-b border-slate-600/30 backdrop-blur-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Trading</h1>
                <p className="text-xs text-slate-300">Trade Tiki Tokens</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center border border-cyan-400/30">
                  <span className="text-sm font-medium text-cyan-300">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
          {/* Premium Real-time Balance Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 border border-emerald-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-emerald-200">USD Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">
                    {formatCurrency(usdBalance, 'USD')}
                  </h2>
                  <p className="text-sm text-emerald-300">Available for Trading</p>
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

            <Card className="bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-cyan-200">Current Tiki Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">
                    {formatCurrency(tikiPrice, 'USD')}
                  </h2>
                  <p className="text-sm text-cyan-300">Per Token</p>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Premium Tiki Token Information */}
          <div className="lg:hidden mb-6">
            <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
              <CardHeader className="p-4">
                <CardTitle className="text-lg bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Tiki Token Trading</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                    TIKI Token
                  </div>
                  <div className="text-sm text-slate-300">
                    Trade Tiki tokens with real-time price updates
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Left Column - Trading Interface */}
            <div className="lg:col-span-1 space-y-4 lg:space-y-6">
              {/* Premium Tiki Token Information - Desktop Only */}
              <Card className="hidden lg:block bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Tiki Token</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                      TIKI
                    </div>
                    <div className="text-sm text-slate-300 mb-4">
                      Tiki Token Trading
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatCurrency(tikiPrice, 'USD')}
                    </div>
                    <div className="text-xs text-slate-400">
                      Current Price
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Premium Trading Form */}
              <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Tiki Trading Panel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Premium Buy/Sell Toggle */}
                    <div className="flex bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded-lg p-1 border border-slate-600/30">
                      <button
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                          tradeType === 'buy'
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25'
                            : 'text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-slate-600/30 hover:to-slate-700/30'
                        }`}
                        onClick={() => setTradeType('buy')}
                      >
                        Buy
                      </button>
                      <button
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                          tradeType === 'sell'
                            ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25'
                            : 'text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-slate-600/30 hover:to-slate-700/30'
                        }`}
                        onClick={() => setTradeType('sell')}
                      >
                        Sell
                      </button>
                    </div>

                    {/* Order Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Order Type
                      </label>
                      <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value)}
                        className="w-full px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400"
                      >
                        <option value="market" className="bg-slate-800 text-white">Market Order</option>
                        <option value="limit" className="bg-slate-800 text-white">Limit Order</option>
                      </select>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {tradeType === 'buy' ? 'USD Amount to Spend' : 'Tiki Tokens to Sell'}
                      </label>
                      <Input
                        type="number"
                        placeholder={tradeType === 'buy' ? 'Enter USD amount' : 'Enter Tiki amount'}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        step="0.0001"
                        className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30"
                      />
                      {tradeType === 'buy' && amount && (
                        <p className="text-xs text-slate-400 mt-1">
                          You will receive: {formatTiki(parseFloat(amount) / tikiPrice)} TIKI
                        </p>
                      )}
                      {tradeType === 'sell' && amount && (
                        <p className="text-xs text-slate-400 mt-1">
                          You will receive: {formatCurrency(parseFloat(amount) * tikiPrice, 'USD')}
                        </p>
                      )}
                      
                      {/* Fee Information Display */}
                      {amountValue > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
                          <div className="text-sm text-gray-600">
                            <div className="flex justify-between items-center mb-1">
                              <span>{tradeType === 'buy' ? 'USD Amount:' : 'TIKI Amount:'}</span>
                              <span className="font-medium">${amountValue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-1">
                              <span>Fee ({feeCalculation.feePercentage}%):</span>
                              <span className="font-medium text-orange-600">${feeCalculation.fee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center border-t pt-1">
                              <span className="font-medium">Total Required:</span>
                              <span className="font-bold text-blue-600">${(amountValue + feeCalculation.fee).toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {tradeType === 'buy' 
                                ? `You will receive: ${formatTiki((amountValue - feeCalculation.fee) / tikiPrice)} TIKI`
                                : `You will receive: $${(amountValue - feeCalculation.fee).toFixed(2)}`
                              }
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Price (for limit orders) */}
                    {orderType === 'limit' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Price (USD)
                        </label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          step="0.01"
                          className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30"
                        />
                      </div>
                    )}

                    {/* Total */}
                    <div className="p-3 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded-lg border border-slate-600/30">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">Total:</span>
                        <span className="font-semibold text-white">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Premium Trade Button */}
                    <Button
                      className={`w-full ${
                        tradeType === 'buy'
                          ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30'
                          : 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 hover:from-red-600 hover:via-rose-600 hover:to-pink-700 text-white shadow-lg shadow-red-500/25 border border-red-400/30'
                      }`}
                      onClick={handleTrade}
                      disabled={!amount || parseFloat(amount) <= 0 || isTrading}
                    >
                      {isTrading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        `${tradeType === 'buy' ? 'Buy Tiki Tokens' : 'Sell Tiki Tokens'}`
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Open Orders Section */}
              {userOrders.length > 0 && (
                <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Open Orders</CardTitle>
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/cron/match-orders', { method: 'POST' });
                          const data = await response.json();
                          if (data.success) {
                            showTradeModalMessage('success', 'Orders Refreshed', 'Order matching completed. Check if any orders were executed.');
                            fetchUserOrders(); // Refresh the orders list
                          } else {
                            showTradeModalMessage('error', 'Refresh Failed', data.error || 'Failed to refresh orders');
                          }
                        } catch (error) {
                          showTradeModalMessage('error', 'Error', 'Failed to refresh orders');
                        }
                      }}
                      className="text-xs px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded border border-blue-400/30 transition-colors"
                      title="Check if any orders should execute now"
                    >
                      🔄 Check Orders
                    </button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {userOrders.map((order) => (
                        <div key={order.id} className="p-3 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded-lg border border-slate-600/30">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${order.orderType === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {order.orderType}
                                </span>
                                <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
                                  {order.priceType}
                                </span>
                              </div>
                              <div className="text-sm text-slate-300 mt-1">
                                {order.orderType === 'BUY' ? 'USD' : 'TIKI'}: {order.amount.toFixed(2)}
                              </div>
                              {order.limitPrice && (
                                <div className="text-xs text-slate-400">
                                  Limit Price: ${order.limitPrice.toFixed(6)}
                                </div>
                              )}
                              <div className="text-xs text-slate-500 mt-1">
                                {new Date(order.createdAt).toLocaleString()}
                              </div>
                            </div>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-xs px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded border border-red-400/30 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Center Column - Charts and Market Data */}
            <div className="lg:col-span-2 space-y-4 lg:space-y-6">
              {/* Tiki Price Chart */}
              <TikiPriceChart />

              {/* Premium Market Overview - Live Data */}
              <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    Market Overview
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {marketLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-400"></div>
                    )}
                    <button
                      onClick={refreshMarketData}
                      className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
                      title="Refresh market data"
                    >
                      🔄 Refresh
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {marketError ? (
                    <div className="text-center py-8">
                      <div className="text-red-400 text-4xl mb-2">⚠️</div>
                      <h3 className="text-lg font-medium text-white mb-2">Market Data Unavailable</h3>
                      <p className="text-slate-300 mb-4">Unable to fetch live market data</p>
                      <Button
                        onClick={refreshMarketData}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : (
                  <div className="grid grid-cols-2 gap-4">
                      {/* Current Price */}
                      <div className="text-center p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-400/30">
                        <div className="text-2xl font-bold text-white">
                          {formatMarketCurrency(marketData.price)}
                        </div>
                        <div className="text-sm text-cyan-300">Current Price</div>
                        {marketData.lastUpdate && (
                          <div className="text-xs text-slate-400 mt-1">
                            Updated: {new Date(marketData.lastUpdate).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                      
                      {/* 24h Change */}
                      <div className="text-center p-4 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg border border-emerald-400/30">
                        <div className={`text-2xl font-bold flex items-center justify-center ${
                          getPriceChangeColor(marketData.change24h)
                        }`}>
                          <span className="mr-1">{getPriceChangeIcon(marketData.change24h)}</span>
                          {formatPercentage(marketData.change24h)}
                        </div>
                        <div className="text-sm text-emerald-300">24h Change</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {formatMarketCurrency(marketData.priceChange24h)}
                    </div>
                      </div>
                      
                    
                      
                      {/* Market Cap */}
                      
                    </div>
                  )}
                  
                  {/* Additional Market Stats */}
                  {!marketError && marketData.price > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-lg border border-slate-600/20">
                        <div className="text-lg font-bold text-white">
                          {formatMarketCurrency(marketData.high24h)}
                        </div>
                        <div className="text-xs text-slate-300">24h High</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-lg border border-slate-600/20">
                        <div className="text-lg font-bold text-white">
                          {formatMarketCurrency(marketData.low24h)}
                    </div>
                        <div className="text-xs text-slate-300">24h Low</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Book and Recent Trades */}
            <div className="lg:col-span-1 space-y-4 lg:space-y-6">
              {/* Mobile Order Book and Trades - Stacked Layout */}
              <div className="lg:hidden space-y-4">
                {/* Mobile Order Book */}
                <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                        Order Book
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        {orderBookLoading && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-rose-400"></div>
                        )}
                        <button
                          onClick={refreshOrderBook}
                          className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
                          title="Refresh order book"
                        >
                          🔄
                        </button>
                      </div>
                    </div>
                </CardHeader>
                  <CardContent className="p-4">
                    {orderBookError ? (
                      <div className="text-center py-4">
                        <div className="text-red-400 text-2xl mb-2">⚠️</div>
                        <p className="text-sm text-slate-300">Order book unavailable</p>
                        <Button
                          onClick={refreshOrderBook}
                          className="mt-2 text-xs bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Mobile Market Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          
                          <div className="bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded-lg p-2 text-center">
                            <div className="text-slate-300">Depth</div>
                            <div className="font-semibold text-white text-sm">
                              ${getMarketDepth().totalVolume}
                            </div>
                          </div>
                        </div>

                        {/* Mobile Order Book Display */}
                        <div className="space-y-2">
                          {/* Asks */}
                          <div>
                            <div className="text-sm font-medium text-red-300 mb-1">Sell Orders</div>
                            <div className="space-y-1">
                              {getTopAsks(3).map((ask, index) => (
                                <div key={index} className="flex justify-between items-center text-sm bg-red-500/5 rounded px-2 py-1">
                                  <span className="text-red-400 font-mono text-xs">{formatPrice(ask.price)}</span>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-slate-300 text-xs">{formatAmount(ask.amount)}</span>
                                    <span className="text-slate-400 text-xs">{formatTotal(ask.total)}</span>
                                  </div>
                      </div>
                    ))}
                            </div>
                          </div>
                    
                    {/* Spread */}
                          <div className="text-center py-2 border-t border-slate-600/30">
                            <div className="text-xs text-slate-400">Spread: ${calculateSpread().absolute}</div>
                          </div>
                          
                          {/* Bids */}
                          <div>
                            <div className="text-sm font-medium text-emerald-300 mb-1">Buy Orders</div>
                            <div className="space-y-1">
                              {getTopBids(3).map((bid, index) => (
                                <div key={index} className="flex justify-between items-center text-sm bg-emerald-500/5 rounded px-2 py-1">
                                  <span className="text-emerald-400 font-mono text-xs">{formatPrice(bid.price)}</span>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-slate-300 text-xs">{formatAmount(bid.amount)}</span>
                                    <span className="text-slate-400 text-xs">{formatTotal(bid.total)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Mobile Recent Trades */}
                <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                        Recent Trades
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        {orderBookLoading && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-400"></div>
                        )}
                        <button
                          onClick={refreshOrderBook}
                          className="text-xs text-slate-400 hover:text-violet-400 transition-colors"
                          title="Refresh trades"
                        >
                          🔄
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {orderBookError ? (
                      <div className="text-center py-4">
                        <div className="text-red-400 text-2xl mb-2">⚠️</div>
                        <p className="text-sm text-slate-300">Trade data unavailable</p>
                        <Button
                          onClick={refreshOrderBook}
                          className="mt-2 text-xs bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Mobile Trade Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-lg p-2 text-center border border-emerald-400/30">
                            <div className="text-emerald-300">Buy</div>
                            <div className="font-semibold text-white text-sm">{getTradeStats().buyCount}</div>
                          </div>
                          <div className="bg-gradient-to-r from-red-500/20 to-rose-500/20 rounded-lg p-2 text-center border border-red-400/30">
                            <div className="text-red-300">Sell</div>
                            <div className="font-semibold text-white text-sm">{getTradeStats().sellCount}</div>
                          </div>
                        </div>

                        {/* Mobile Trades List */}
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {getRecentTradesList(8).map((trade) => (
                            <div key={trade.id} className="flex justify-between items-center text-sm hover:bg-slate-700/30 rounded px-2 py-1 transition-colors">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full flex items-center justify-center text-xs ${
                                  trade.type === 'buy' ? 'bg-emerald-500' : 'bg-red-500'
                                }`}>
                                  {getTradeTypeIcon(trade.type)}
                                </div>
                                <span className="text-slate-300 text-xs" title={formatPakistaniDateTime(trade.timestamp)}>
                                  {trade.time}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className={`font-medium text-xs ${getTradeTypeColor(trade.type).split(' ')[1]}`}>
                                  ${formatPrice(trade.price)}
                                </div>
                                <div className="text-slate-400 text-xs">
                                  {formatAmount(trade.amount)}
                                </div>
                              </div>
                      </div>
                    ))}
                  </div>

                        {/* Mobile Trade Summary */}
                        <div className="border-t border-slate-600/30 pt-2">
                          <div className="text-center">
                            <div className="text-xs text-slate-400">Volume: ${getTradeStats().totalVolume}</div>
                            <div className="text-xs text-slate-400">Avg: ${getTradeStats().avgPrice}</div>
                          </div>
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
              </div>
              

              {/* Enhanced Premium Recent Trades */}
              <Card className="hidden lg:block bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                    Recent Trades
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {orderBookLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-400"></div>
                    )}
                    <button
                      onClick={refreshOrderBook}
                      className="text-xs text-slate-400 hover:text-violet-400 transition-colors"
                      title="Refresh trades"
                    >
                      🔄
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {orderBookError ? (
                    <div className="text-center py-4">
                      <div className="text-red-400 text-2xl mb-2">⚠️</div>
                      <p className="text-sm text-slate-300">Trade data unavailable</p>
                      <Button
                        onClick={refreshOrderBook}
                        className="mt-2 text-xs bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Trade Stats */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-lg p-2 text-center border border-emerald-400/30">
                          <div className="text-emerald-300">Buy Orders</div>
                          <div className="font-semibold text-white">{getTradeStats().buyCount}</div>
                        </div>
                        <div className="bg-gradient-to-r from-red-500/20 to-rose-500/20 rounded-lg p-2 text-center border border-red-400/30">
                          <div className="text-red-300">Sell Orders</div>
                          <div className="font-semibold text-white">{getTradeStats().sellCount}</div>
                        </div>
                      </div>

                      {/* Trades List */}
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {getRecentTradesList(10).map((trade) => (
                          <div key={trade.id} className="flex justify-between items-center text-sm hover:bg-slate-700/30 rounded px-2 py-1 transition-colors">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full flex items-center justify-center text-xs ${
                                trade.type === 'buy' ? 'bg-emerald-500' : 'bg-red-500'
                              }`}>
                                {getTradeTypeIcon(trade.type)}
                              </div>
                              <span className="text-slate-300 text-xs" title={formatPakistaniDateTime(trade.timestamp)}>
                                {trade.time}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className={`font-medium ${getTradeTypeColor(trade.type).split(' ')[1]}`}>
                                ${formatPrice(trade.price)}
                              </div>
                              <div className="text-slate-400 text-xs">
                                {formatAmount(trade.amount)} TIKI
                              </div>
                        </div>
                      </div>
                    ))}
                  </div>

                      {/* Trade Summary */}
                      <div className="border-t border-slate-600/30 pt-2">
                        <div className="text-center">
                          <div className="text-xs text-slate-400 mb-1">Total Volume (24h)</div>
                          <div className="text-sm font-semibold text-white">
                            ${getTradeStats().totalVolume}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Avg Price: ${getTradeStats().avgPrice}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Trade Success/Error Modal */}
      <AlertModal
        isOpen={showTradeModal}
        onClose={() => setShowTradeModal(false)}
        title={tradeModalData.title}
        message={tradeModalData.message}
        type={tradeModalData.type}
        buttonText="OK"
      />
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';

