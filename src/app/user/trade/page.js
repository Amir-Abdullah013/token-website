'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { useTiki } from '../../../lib/tiki-context';
import { usePriceUpdates } from '../../../hooks/usePriceUpdates';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import TikiPriceChart from '../../../components/TikiPriceChart';
import { ToastContainer, useToast } from '../../../components/Toast';
import { AlertModal } from '../../../components/Modal';

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
  
  // Enable real-time price updates every 5 seconds
  usePriceUpdates(5000);

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

  // Tiki market data - using real Tiki price from global state
  const [marketData, setMarketData] = useState({
    price: tikiPrice,
    change24h: 0,
    volume24h: 0,
    high24h: tikiPrice * 1.1,
    low24h: tikiPrice * 0.9
  });
  const [priceHistory, setPriceHistory] = useState([]);
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [recentTrades, setRecentTrades] = useState([]);

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

  // Update Tiki market data using global state
  useEffect(() => {
    const updateTikiMarketData = () => {
      // Use real Tiki price from global state
      const tikiMarketData = {
        price: tikiPrice,
        change24h: 0,
        volume24h: 0,
        high24h: tikiPrice * 1.1,
        low24h: tikiPrice * 0.9
      };
      setMarketData(tikiMarketData);
      setPrice(tikiPrice.toString());
    };

    updateTikiMarketData();
    // Update every 5 seconds to reflect price changes
    const interval = setInterval(updateTikiMarketData, 5000);
    return () => clearInterval(interval);
  }, [tikiPrice]);

  // Calculate total
  useEffect(() => {
    if (amount && price) {
      setTotal(parseFloat(amount) * parseFloat(price));
    } else {
      setTotal(0);
    }
  }, [amount, price]);

  // Mock data for order book and trades
  useEffect(() => {
    const generateOrderBook = () => {
      const bids = [];
      const asks = [];
      const basePrice = marketData.price || 0;

      for (let i = 0; i < 10; i++) {
        bids.push({
          price: (basePrice - (i + 1) * (basePrice * 0.001)).toFixed(2),
          amount: (Math.random() * 10).toFixed(4),
          total: ((basePrice - (i + 1) * (basePrice * 0.001)) * Math.random() * 10).toFixed(2)
        });
        asks.push({
          price: (basePrice + (i + 1) * (basePrice * 0.001)).toFixed(2),
          amount: (Math.random() * 10).toFixed(4),
          total: ((basePrice + (i + 1) * (basePrice * 0.001)) * Math.random() * 10).toFixed(2)
        });
      }

      setOrderBook({ bids, asks });
    };

    const generateRecentTrades = () => {
      const trades = [];
      const basePrice = marketData.price || 0;

      for (let i = 0; i < 20; i++) {
        trades.push({
          id: i + 1,
          price: (basePrice + (Math.random() - 0.5) * basePrice * 0.02).toFixed(2),
          amount: (Math.random() * 5).toFixed(4),
          time: new Date(Date.now() - i * 60000).toLocaleTimeString(),
          type: Math.random() > 0.5 ? 'buy' : 'sell'
        });
      }

      setRecentTrades(trades);
    };

    if (marketData.price) {
      generateOrderBook();
      generateRecentTrades();
    }
  }, [marketData]);

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
      
      // Reset form after successful trade
      setAmount('');
      setPrice('');
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
            </div>

            {/* Center Column - Charts and Market Data */}
            <div className="lg:col-span-2 space-y-4 lg:space-y-6">
              {/* Tiki Price Chart */}
              <TikiPriceChart />

              {/* Premium Market Overview */}
              <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Market Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-400/30">
                      <div className="text-2xl font-bold text-white">
                        ${marketData.price?.toLocaleString() || '0'}
                      </div>
                      <div className="text-sm text-cyan-300">Current Price</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg border border-emerald-400/30">
                      <div className={`text-2xl font-bold ${
                        marketData.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {marketData.change >= 0 ? '+' : ''}{marketData.change}%
                      </div>
                      <div className="text-sm text-emerald-300">24h Change</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-lg border border-violet-400/30">
                      <div className="text-2xl font-bold text-white">
                        ${marketData.volume?.toLocaleString() || '0'}
                      </div>
                      <div className="text-sm text-violet-300">24h Volume</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg border border-amber-400/30">
                      <div className="text-2xl font-bold text-white">
                        TIKI
                      </div>
                      <div className="text-sm text-amber-300">Trading Pair</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Book and Recent Trades */}
            <div className="lg:col-span-1 space-y-4 lg:space-y-6">
              {/* Premium Order Book */}
              <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">Order Book</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Asks (Sell Orders) */}
                    <div className="text-sm font-medium text-red-300 mb-2">Sell Orders</div>
                    {orderBook.asks.slice(0, 5).map((ask, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-red-400">{ask.price}</span>
                        <span className="text-slate-300">{ask.amount}</span>
                      </div>
                    ))}
                    
                    {/* Spread */}
                    <div className="border-t border-slate-600/30 my-2 pt-2">
                      <div className="text-center text-sm text-slate-400">
                        Spread: ${(parseFloat(orderBook.asks[0]?.price || 0) - parseFloat(orderBook.bids[0]?.price || 0)).toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Bids (Buy Orders) */}
                    <div className="text-sm font-medium text-emerald-300 mb-2">Buy Orders</div>
                    {orderBook.bids.slice(0, 5).map((bid, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-emerald-400">{bid.price}</span>
                        <span className="text-slate-300">{bid.amount}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Premium Recent Trades */}
              <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Recent Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentTrades.slice(0, 10).map((trade) => (
                      <div key={trade.id} className="flex justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${
                            trade.type === 'buy' ? 'bg-emerald-500' : 'bg-red-500'
                          }`}></span>
                          <span className="text-slate-300">{trade.time}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-white">${trade.price}</div>
                          <div className="text-slate-400">{trade.amount}</div>
                        </div>
                      </div>
                    ))}
                  </div>
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

