'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { useTiki } from '../../../lib/tiki-context';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import WalletOverview from '../../../components/WalletOverview';
import PriceChart from '../../../components/PriceChart';
import { ToastContainer, useToast } from '../../../components/Toast';

export default function UserDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const { usdBalance, tikiBalance, tikiPrice, formatCurrency, formatTiki } = useTiki();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);
  const { toasts, removeToast } = useToast();

  // Tiki trading state - only for Tiki tokens
  const [tradeType, setTradeType] = useState('buy');
  const [tradeAmount, setTradeAmount] = useState('');
  const [isTrading, setIsTrading] = useState(false);

  // Calculate total value using Tiki price
  const totalValue = parseFloat(tradeAmount) * tikiPrice || 0;

  // Handle Tiki trade execution with global state integration
  const handleTrade = async () => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) return;

    setIsTrading(true);
    try {
      const amountValue = parseFloat(tradeAmount);
      
      if (tradeType === 'buy') {
        // BUYING TIKI TOKENS LOGIC
        // Check if user has sufficient USD balance
        if (amountValue > usdBalance) {
          alert(`Insufficient USD balance. Available: ${formatCurrency(usdBalance, 'USD')}`);
          return;
        }
        
        // Calculate tokens to buy: tokens = amountUSD / tikiPrice
        const tokens = amountValue / tikiPrice;
        
        // Update balances using global state setters
        setUsdBalance(prev => prev - amountValue);
        setTikiBalance(prev => prev + tokens);
        
        // Update price: tikiPrice = tikiPrice + (amountUSD / 1000000)
        const priceIncrease = amountValue / 1000000;
        setTikiPrice(prev => {
          const newPrice = prev + priceIncrease;
          return newPrice > 1 ? 1 : newPrice;
        });
        
        alert(`Successfully bought ${formatTiki(tokens)} Tiki tokens for ${formatCurrency(amountValue, 'USD')}!`);
        
      } else {
        // SELLING TIKI TOKENS LOGIC
        // Check if user has sufficient Tiki balance
        if (amountValue > tikiBalance) {
          alert(`Insufficient Tiki balance. Available: ${formatTiki(tikiBalance)} TIKI`);
          return;
        }
        
        // Calculate USD to receive: usdReceived = tokens * tikiPrice
        const usdReceived = amountValue * tikiPrice;
        
        // Update balances using global state setters
        setUsdBalance(prev => prev + usdReceived);
        setTikiBalance(prev => prev - amountValue);
        
        // Update price: tikiPrice = tikiPrice - (usdReceived / 1000000)
        const priceDecrease = usdReceived / 1000000;
        setTikiPrice(prev => {
          const newPrice = prev - priceDecrease;
          return newPrice < 0.0001 ? 0.0001 : newPrice;
        });
        
        alert(`Successfully sold ${formatTiki(amountValue)} Tiki tokens for ${formatCurrency(usdReceived, 'USD')}!`);
      }
      
      // Reset form after successful trade
      setTradeAmount('');
    } catch (error) {
      console.error('Trade error:', error);
      alert('Trade failed. Please try again.');
    } finally {
      setIsTrading(false);
    }
  };

  // Update Tiki price using global state
  useEffect(() => {
    const updateTikiPrice = () => {
      // Use real Tiki price from global state
      // Price updates are handled by the global state when trades occur
      // This effect just ensures the UI reflects the current price
    };

    updateTikiPrice();
    const interval = setInterval(updateTikiPrice, 5000);
    return () => clearInterval(interval);
  }, [tikiPrice]);

  // ✅ Prevent hydration mismatches by only running client-side code after mount
  useEffect(() => {
    setMounted(true);
    console.log('Dashboard: Component mounted');
    
    // Use requestAnimationFrame to ensure DOM is ready
    const initializeDashboard = () => {
      // Check for OAuth success parameters in URL
      const urlParams = new URLSearchParams(window.location.search);
      const oauthSuccess = urlParams.get('oauth_success');
      const provider = urlParams.get('provider');
      const session = urlParams.get('session');
      const userEmail = urlParams.get('userEmail');
      const userName = urlParams.get('userName');
      const userId = urlParams.get('userId');
      const userPicture = urlParams.get('userPicture');

      if (oauthSuccess === 'true' && provider && userEmail) {
        console.log('Dashboard: OAuth success detected, storing session data');
        
        // Store OAuth session data
        const oauthData = {
          provider,
          session,
          timestamp: Date.now()
        };

        // Store user session data
        const userSessionData = {
          $id: userId,
          id: userId,
          email: userEmail,
          name: userName,
          picture: userPicture,
          provider: provider,
          role: 'USER',
          emailVerified: true
        };

        // Store in localStorage
        localStorage.setItem('oauthSession', JSON.stringify(oauthData));
        localStorage.setItem('userSession', JSON.stringify(userSessionData));

        console.log('Dashboard: OAuth session data stored', userSessionData);
        setIsOAuthCallback(true);

        // Clean up URL parameters
        window.history.replaceState({}, '', '/user/dashboard');
      } else {
        // Check if we have existing OAuth session data in localStorage
        const oauthSession = localStorage.getItem('oauthSession');
        const userSession = localStorage.getItem('userSession');
        
        if (oauthSession && userSession) {
          console.log('Dashboard: Found existing OAuth session data in localStorage');
          setIsOAuthCallback(true);
        }
      }

      // REMOVED: The problematic reload logic that was causing infinite loops
      // The auth context will handle user session loading properly
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(initializeDashboard);
  }, []);

  // ✅ Redirect to signin if not authenticated (only after component mounts)
  useEffect(() => {
    if (mounted && !loading && !isAuthenticated && !user) {
      console.log('Dashboard: User not authenticated, redirecting to signin');
      // Add a small delay to prevent race conditions on Vercel
      setTimeout(() => {
        router.push('/auth/signin?redirect=/user/dashboard');
      }, 100);
    }
  }, [mounted, loading, isAuthenticated, user, router]);

  // ✅ Show loading state while checking authentication
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ✅ Show loading state if not authenticated (NO REDIRECT)
  if (!isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // ✅ Show dashboard content if authenticated
  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white shadow-sm border-b lg:hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
                <p className="text-xs text-gray-600">Welcome back, {user?.name || user?.email || 'User'}!</p>
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

        {/* Desktop Header */}
        <div className="bg-white shadow-sm border-b hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name || user?.email || 'User'}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                 
                 
                </div>
                
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Main Content - No Scroll Layout */}
        <div className="lg:hidden min-h-screen bg-gray-50 flex flex-col">
          {/* Mobile Quick Actions */}
          <div className="bg-white border-b">
            <div className="px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
                  onClick={() => router.push('/user/deposit')}
                >
                  <span className="text-xl">💰</span>
                  <span>Deposit</span>
                </Button>
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
                  onClick={() => router.push('/user/withdraw')}
                >
                  <span className="text-xl">💸</span>
                  <span>Withdraw</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Stats Overview */}
          <div className="bg-white border-b">
            <div className="px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Total Balance</p>
                  <p className="text-sm font-bold text-gray-900">$12,345.67</p>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Total Coins</p>
                  <p className="text-sm font-bold text-gray-900">1,234.56</p>
                </div>

                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Deposit Amount</p>
                  <p className="text-sm font-bold text-gray-900">$5,678.90</p>
                </div>

                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Withdraw Amount</p>
                  <p className="text-sm font-bold text-gray-900">$1,234.56</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Quick Trade */}
          <div className="bg-white border-b flex-1">
            <div className="px-4 py-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiki Quick Trade</h3>
              <div className="space-y-4">
                {/* Buy/Sell Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button 
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                      tradeType === 'buy' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setTradeType('buy')}
                  >
                    Buy
                  </button>
                  <button 
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                      tradeType === 'sell' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setTradeType('sell')}
                  >
                    Sell
                  </button>
                </div>

                {/* Tiki Token Display */}
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">TIKI</div>
                  <div className="text-sm text-gray-600">Tiki Token</div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tradeType === 'buy' ? 'USD Amount to Spend' : 'Tiki Tokens to Sell'}
                  </label>
                  <input
                    type="number"
                    placeholder={tradeType === 'buy' ? 'Enter USD amount' : 'Enter Tiki amount'}
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    step="0.0001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {tradeType === 'buy' && tradeAmount && (
                    <p className="text-xs text-gray-500 mt-1">
                      You will receive: {formatTiki(parseFloat(tradeAmount) / tikiPrice)} TIKI
                    </p>
                  )}
                  {tradeType === 'sell' && tradeAmount && (
                    <p className="text-xs text-gray-500 mt-1">
                      You will receive: {formatCurrency(parseFloat(tradeAmount) * tikiPrice, 'USD')}
                    </p>
                  )}
                </div>

                {/* Trade Button */}
                <Button 
                  className={`w-full ${
                    tradeType === 'buy' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  onClick={handleTrade}
                  disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || isTrading}
                >
                  {isTrading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `${tradeType === 'buy' ? 'Buy' : 'Sell'} Tiki Tokens`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          {/* Desktop Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 lg:gap-6 mb-6 lg:mb-8">
            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 lg:space-x-4">
                      <div className="w-8 h-8 lg:w-12 lg:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                        <p className="text-xs lg:text-sm font-medium text-gray-500 mb-1">Total Balance</p>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900">$12,345.67</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 lg:space-x-4">
                      <div className="w-8 h-8 lg:w-12 lg:h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 lg:w-6 lg:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                        <p className="text-xs lg:text-sm font-medium text-gray-500 mb-1">Total Coins</p>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900">1,234.56</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 lg:space-x-4">
                      <div className="w-8 h-8 lg:w-12 lg:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 lg:w-6 lg:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                        <p className="text-xs lg:text-sm font-medium text-gray-500 mb-1">Deposit Amount</p>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900">$5,678.90</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 lg:space-x-4">
                      <div className="w-8 h-8 lg:w-12 lg:h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 lg:w-6 lg:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </div>
                    <div>
                        <p className="text-xs lg:text-sm font-medium text-gray-500 mb-1">Withdraw Amount</p>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900">$1,234.56</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
            {/* Wallet Overview - Left Column */}
            <div className="lg:col-span-2 space-y-4 lg:space-y-8">
              {/* Wallet Overview */}
              <Card className="cursor-pointer">
                <CardHeader className="p-4 lg:p-6">
                  <CardTitle className="text-lg lg:text-xl">Wallet Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                  <WalletOverview />
                </CardContent>
              </Card>

              {/* Price Chart */}
              <Card className="cursor-pointer">
                <CardHeader className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg lg:text-xl">Price Chart</CardTitle>
                   
                  </div>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                  <PriceChart />
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="cursor-pointer">
                <CardHeader className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg lg:text-xl">Recent Tiki Transactions</CardTitle>
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                  <div className="space-y-3 lg:space-y-4">
                    {[
                      { type: 'buy', asset: 'TIKI', amount: '1000', price: formatCurrency(tikiPrice, 'USD'), time: '2 min ago', status: 'completed' },
                      { type: 'sell', asset: 'TIKI', amount: '500', price: formatCurrency(tikiPrice, 'USD'), time: '1 hour ago', status: 'completed' },
                      { type: 'buy', asset: 'TIKI', amount: '2000', price: formatCurrency(tikiPrice, 'USD'), time: '3 hours ago', status: 'pending' },
                      { type: 'sell', asset: 'TIKI', amount: '750', price: formatCurrency(tikiPrice, 'USD'), time: '1 day ago', status: 'completed' },
                    ].map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-2 lg:space-x-3">
                          <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${
                            transaction.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            <span className={`text-xs lg:text-sm font-bold ${
                              transaction.type === 'buy' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'buy' ? '+' : '-'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm lg:text-base font-medium text-gray-900">{transaction.asset}</p>
                            <p className="text-xs lg:text-sm text-gray-500">{transaction.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm lg:text-base font-medium text-gray-900">{formatTiki(parseFloat(transaction.amount))} {transaction.asset}</p>
                          <p className="text-xs lg:text-sm text-gray-500">{transaction.price}</p>
                        </div>
                        <div className="ml-2 lg:ml-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4 lg:space-y-8">
                     {/* Buy/Sell Panel */}
                     <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
                       <CardHeader className="p-4 sm:p-6">
                         <div className="flex items-center justify-between">
                           <CardTitle className="text-lg sm:text-xl">Tiki Quick Trade</CardTitle>
                           <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                             <span className="mr-2">⚡</span>
                             Live Tiki Price
                           </Button>
                         </div>
                       </CardHeader>
                       <CardContent className="p-4 sm:p-6">
                         <div className="space-y-4 sm:space-y-6">
                           {/* Buy/Sell Toggle */}
                           <div className="flex bg-gray-100 rounded-lg p-1">
                             <button 
                               className={`flex-1 py-2 cursor-pointer px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                                 tradeType === 'buy' 
                                   ? 'bg-white text-gray-900 shadow-sm cursor-pointer' 
                                   : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                               }`}
                               onClick={() => setTradeType('buy')}
                             >
                               Buy Tiki
                             </button>
                             <button 
                               className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                                 tradeType === 'sell' 
                                   ? 'bg-white text-gray-900 shadow-sm cursor-pointer' 
                                   : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                               }`}
                               onClick={() => setTradeType('sell')}
                             >
                               Sell Tiki
                             </button>
                           </div>

                           {/* Tiki Token Display */}
                           <div className="text-center p-4 bg-blue-50 rounded-lg">
                             <div className="text-2xl font-bold text-blue-600 mb-2">TIKI</div>
                             <div className="text-sm text-gray-600">Tiki Token</div>
                           </div>

                           {/* Amount Input */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">
                               {tradeType === 'buy' ? 'USD Amount to Spend' : 'Tiki Tokens to Sell'}
                             </label>
                             <input
                               type="number"
                               placeholder={tradeType === 'buy' ? 'Enter USD amount' : 'Enter Tiki amount'}
                               value={tradeAmount}
                               onChange={(e) => setTradeAmount(e.target.value)}
                               step="0.0001"
                               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                             />
                             {tradeType === 'buy' && tradeAmount && (
                               <p className="text-xs text-gray-500 mt-1">
                                 You will receive: {formatTiki(parseFloat(tradeAmount) / tikiPrice)} TIKI
                               </p>
                             )}
                             {tradeType === 'sell' && tradeAmount && (
                               <p className="text-xs text-gray-500 mt-1">
                                 You will receive: {formatCurrency(parseFloat(tradeAmount) * tikiPrice, 'USD')}
                               </p>
                             )}
                           </div>

                           {/* Price Display */}
                           <div className="p-4 bg-gray-50 rounded-lg">
                             <div className="flex justify-between text-sm mb-2">
                               <span className="text-gray-500">Current Tiki Price:</span>
                               <span className="font-medium">{formatCurrency(tikiPrice, 'USD')}</span>
                             </div>
                             <div className="flex justify-between text-sm mb-2">
                               <span className="text-gray-500">Amount:</span>
                               <span className="font-medium">{tradeAmount || '0'} {tradeType === 'buy' ? 'USD' : 'TIKI'}</span>
                             </div>
                             <div className="flex justify-between text-sm font-semibold">
                               <span className="text-gray-700">Total:</span>
                               <span className={`${tradeType === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                                 {formatCurrency(totalValue, 'USD')}
                               </span>
                             </div>
                           </div>

                           {/* Balance Check */}
                           {tradeType === 'sell' && parseFloat(tradeAmount) > 0 && (
                             <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                               <div className="flex items-center">
                                 <span className="text-yellow-600 mr-2">⚠️</span>
                                 <span className="text-sm text-yellow-800">
                                   Available: {formatTiki(tikiBalance)} TIKI
                                 </span>
                               </div>
                             </div>
                           )}

                           {/* Trade Button */}
                           <Button 
                             className={`w-full ${
                               tradeType === 'buy' 
                                 ? 'bg-green-600 hover:bg-green-700' 
                                 : 'bg-red-600 hover:bg-red-700'
                             }`}
                             onClick={handleTrade}
                             disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || isTrading}
                           >
                             {isTrading ? (
                               <div className="flex items-center">
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                 Processing...
                               </div>
                             ) : (
                               `${tradeType === 'buy' ? 'Buy' : 'Sell'} Tiki Tokens`
                             )}
                           </Button>

                           {/* Quick Amount Buttons */}
                           <div className="grid grid-cols-3 gap-2">
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => setTradeAmount('0.1')}
                               className="text-xs"
                             >
                               0.1
                             </Button>
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => setTradeAmount('0.5')}
                               className="text-xs"
                             >
                               0.5
                             </Button>
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => setTradeAmount('1.0')}
                               className="text-xs"
                             >
                               1.0
                             </Button>
                           </div>
                         </div>
                       </CardContent>
                     </Card>

              {/* Tiki Market Overview */}
              <Card className="cursor-pointer">
                <CardHeader>
                  <CardTitle>Tiki Market Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'Tiki Token', symbol: 'TIKI', price: formatCurrency(tikiPrice, 'USD'), change: '+2.34%', changeType: 'positive' },
                    ].map((asset, index) => (
                      <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">{asset.symbol[0]}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{asset.name}</p>
                            <p className="text-sm text-gray-500">{asset.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{asset.price}</p>
                          <p className={`text-sm ${
                            asset.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {asset.change}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

             
            </div>
          </div>

          {/* Additional Sections */}
          <div className="mt-12 space-y-8">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              
            </div>

            

            {/* Quick Stats */}
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg lg:text-xl">Quick Stats</CardTitle>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 hidden sm:flex">
                    <span className="mr-2">📈</span>
                    View Analytics
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                  <div className="text-center p-3 lg:p-4 bg-blue-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-xl lg:text-2xl xl:text-3xl font-bold text-blue-600 mb-1 lg:mb-2">156</div>
                    <div className="text-xs lg:text-sm text-gray-600">Total Trades</div>
                  </div>
                  <div className="text-center p-3 lg:p-4 bg-green-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-xl lg:text-2xl xl:text-3xl font-bold text-green-600 mb-1 lg:mb-2">$45.2K</div>
                    <div className="text-xs lg:text-sm text-gray-600">Total Profit</div>
                  </div>
                  <div className="text-center p-3 lg:p-4 bg-purple-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-xl lg:text-2xl xl:text-3xl font-bold text-purple-600 mb-1 lg:mb-2">8</div>
                    <div className="text-xs lg:text-sm text-gray-600">Active Orders</div>
                  </div>
                  <div className="text-center p-3 lg:p-4 bg-orange-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-xl lg:text-2xl xl:text-3xl font-bold text-orange-600 mb-1 lg:mb-2">92%</div>
                    <div className="text-xs lg:text-sm text-gray-600">Success Rate</div>
                  </div>
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
