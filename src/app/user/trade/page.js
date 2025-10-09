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

export default function TradePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const { usdBalance, tikiBalance, tikiPrice, setUsdBalance, setTikiBalance, setTikiPrice, formatCurrency, formatTiki, buyTiki, sellTiki } = useTiki();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { toasts, removeToast } = useToast();
  
  // Enable real-time price updates every 5 seconds
  usePriceUpdates(5000);

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
      alert('Please enter a valid amount');
      return;
    }

    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      alert('Please enter a valid price for limit order');
      return;
    }

    setIsTrading(true);
    try {
      const amountValue = parseFloat(amount);
      
      if (tradeType === 'buy') {
        // BUYING TIKI TOKENS LOGIC
        // Check if user has sufficient USD balance
        if (amountValue > usdBalance) {
          alert(`Insufficient USD balance. Available: ${formatCurrency(usdBalance, 'USD')}`);
          return;
        }
        
        // Use the new API-based buy function
        const result = await buyTiki(amountValue);
        
        if (result.success) {
          alert(`Successfully bought ${formatTiki(result.tokensBought)} Tiki tokens for ${formatCurrency(amountValue, 'USD')}!`);
          if (result.newPrice !== result.oldPrice) {
            alert(`Price updated from ${formatCurrency(result.oldPrice)} to ${formatCurrency(result.newPrice)} per token!`);
          }
        } else {
          alert(`Buy failed: ${result.error}`);
        }
        
      } else {
        // SELLING TIKI TOKENS LOGIC
        // Check if user has sufficient Tiki balance
        if (amountValue > tikiBalance) {
          alert(`Insufficient Tiki balance. Available: ${formatTiki(tikiBalance)} TIKI`);
          return;
        }
        
        // Use the new API-based sell function
        const result = await sellTiki(amountValue);
        
        if (result.success) {
          alert(`Successfully sold ${formatTiki(amountValue)} Tiki tokens for ${formatCurrency(result.usdReceived, 'USD')}!`);
          if (result.newPrice !== result.oldPrice) {
            alert(`Price updated from ${formatCurrency(result.oldPrice)} to ${formatCurrency(result.newPrice)} per token!`);
          }
        } else {
          alert(`Sell failed: ${result.error}`);
        }
      }
      
      // Reset form after successful trade
      setAmount('');
      setPrice('');
    } catch (error) {
      console.error('Trade error:', error);
      alert('Trade failed. Please try again.');
    } finally {
      setIsTrading(false);
    }
  };

  // Show loading state
  if (!mounted || loading) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading trading interface...</p>
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

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Trading</h1>
                <p className="text-gray-600">Trade cryptocurrencies with advanced tools</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/user/dashboard')}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Trading</h1>
                <p className="text-xs text-gray-600">Trade Tiki Tokens</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
          {/* Real-time Balance Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">USD Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {formatCurrency(usdBalance, 'USD')}
                  </h2>
                  <p className="text-sm text-gray-500">Available for Trading</p>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Tiki Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-blue-600">
                    {formatCurrency(tikiPrice, 'USD')}
                  </h2>
                  <p className="text-sm text-gray-500">Per Token</p>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Tiki Token Information */}
          <div className="lg:hidden mb-6">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Tiki Token Trading</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    TIKI Token
                  </div>
                  <div className="text-sm text-gray-600">
                    Trade Tiki tokens with real-time price updates
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Left Column - Trading Interface */}
            <div className="lg:col-span-1 space-y-4 lg:space-y-6">
              {/* Tiki Token Information - Desktop Only */}
              <Card className="hidden lg:block">
                <CardHeader>
                  <CardTitle>Tiki Token</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      TIKI
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      Tiki Token Trading
                    </div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(tikiPrice, 'USD')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Current Price
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trading Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Tiki Trading Panel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Buy/Sell Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                          tradeType === 'buy'
                            ? 'bg-green-500 text-white'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                        onClick={() => setTradeType('buy')}
                      >
                        Buy
                      </button>
                      <button
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                          tradeType === 'sell'
                            ? 'bg-red-500 text-white'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                        onClick={() => setTradeType('sell')}
                      >
                        Sell
                      </button>
                    </div>

                    {/* Order Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Order Type
                      </label>
                      <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="market">Market Order</option>
                        <option value="limit">Limit Order</option>
                      </select>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tradeType === 'buy' ? 'USD Amount to Spend' : 'Tiki Tokens to Sell'}
                      </label>
                      <Input
                        type="number"
                        placeholder={tradeType === 'buy' ? 'Enter USD amount' : 'Enter Tiki amount'}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        step="0.0001"
                      />
                      {tradeType === 'buy' && amount && (
                        <p className="text-xs text-gray-500 mt-1">
                          You will receive: {formatTiki(parseFloat(amount) / tikiPrice)} TIKI
                        </p>
                      )}
                      {tradeType === 'sell' && amount && (
                        <p className="text-xs text-gray-500 mt-1">
                          You will receive: {formatCurrency(parseFloat(amount) * tikiPrice, 'USD')}
                        </p>
                      )}
                    </div>

                    {/* Price (for limit orders) */}
                    {orderType === 'limit' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price (USD)
                        </label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          step="0.01"
                        />
                      </div>
                    )}

                    {/* Total */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-semibold">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Trade Button */}
                    <Button
                      className={`w-full ${
                        tradeType === 'buy'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
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

              {/* Market Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        ${marketData.price?.toLocaleString() || '0'}
                      </div>
                      <div className="text-sm text-gray-600">Current Price</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`text-2xl font-bold ${
                        marketData.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {marketData.change >= 0 ? '+' : ''}{marketData.change}%
                      </div>
                      <div className="text-sm text-gray-600">24h Change</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        ${marketData.volume?.toLocaleString() || '0'}
                      </div>
                      <div className="text-sm text-gray-600">24h Volume</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        TIKI
                      </div>
                      <div className="text-sm text-gray-600">Trading Pair</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Book and Recent Trades */}
            <div className="lg:col-span-1 space-y-4 lg:space-y-6">
              {/* Order Book */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Book</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Asks (Sell Orders) */}
                    <div className="text-sm font-medium text-red-600 mb-2">Sell Orders</div>
                    {orderBook.asks.slice(0, 5).map((ask, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-red-600">{ask.price}</span>
                        <span className="text-gray-600">{ask.amount}</span>
                      </div>
                    ))}
                    
                    {/* Spread */}
                    <div className="border-t border-gray-200 my-2 pt-2">
                      <div className="text-center text-sm text-gray-600">
                        Spread: ${(parseFloat(orderBook.asks[0]?.price || 0) - parseFloat(orderBook.bids[0]?.price || 0)).toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Bids (Buy Orders) */}
                    <div className="text-sm font-medium text-green-600 mb-2">Buy Orders</div>
                    {orderBook.bids.slice(0, 5).map((bid, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-green-600">{bid.price}</span>
                        <span className="text-gray-600">{bid.amount}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Trades */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentTrades.slice(0, 10).map((trade) => (
                      <div key={trade.id} className="flex justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${
                            trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          <span className="text-gray-600">{trade.time}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${trade.price}</div>
                          <div className="text-gray-500">{trade.amount}</div>
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
    </Layout>
  );
}
