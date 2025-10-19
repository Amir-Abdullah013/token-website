'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTiki } from '@/lib/tiki-context';
import { usePriceUpdates } from '../../../hooks/usePriceUpdates';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import WalletOverview from '@/components/WalletOverview';
import PriceChart from '@/components/PriceChart';
import { ToastContainer, useToast } from '@/components/Toast';
import Link from 'next/link';

export default function UserDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const { usdBalance, tikiBalance, tikiPrice, formatCurrency, formatTiki, buyTiki, sellTiki } = useTiki();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);
  const [showStakeConfirm, setShowStakeConfirm] = useState(false);
  const [pendingStake, setPendingStake] = useState(null);
  const { success, error, toasts, removeToast } = useToast();
  
  // Enable real-time price updates every 5 seconds
  usePriceUpdates(5000);

  // Fetch dashboard stats when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchDashboardStats();
      fetchQuickStats();
    }
  }, [user?.id]);

  // Tiki trading state - only for Tiki tokens
  const [tradeType, setTradeType] = useState('buy');
  const [tradeAmount, setTradeAmount] = useState('');
  const [isTrading, setIsTrading] = useState(false);

  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    transactionCount: 0
  });

  // Quick stats state
  const [quickStats, setQuickStats] = useState({
    totalTrades: 0,
    totalProfit: 0,
    activeOrders: 0,
    successRate: 0
  });

  // Calculate total value using Tiki price
  const totalValue = parseFloat(tradeAmount) * tikiPrice || 0;

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/wallet/overview?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setDashboardStats({
          totalDeposits: data.statistics?.totalDeposits || 0,
          totalWithdrawals: data.statistics?.totalWithdrawals || 0,
          transactionCount: data.statistics?.transactionCount || 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // Fetch quick stats
  const fetchQuickStats = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/user/quick-stats?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setQuickStats({
          totalTrades: data.totalTrades || 0,
          totalProfit: data.totalProfit || 0,
          activeOrders: data.activeOrders || 0,
          successRate: data.successRate || 0
        });
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    }
  };

  // Handle Tiki trade execution with API-based price calculation
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
      
      if (oauthSuccess === 'true' && provider) {
        console.log('OAuth success detected:', provider);
        setIsOAuthCallback(true);
        
        // Show success message
        setTimeout(() => {
          success(`🎉 Successfully signed in with ${provider}! Welcome to TokenApp!`);
        }, 1000);
        
        // Clean up URL parameters
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(initializeDashboard);
  }, []);

  // Handle authentication redirect
  useEffect(() => {
    if (mounted && !loading) {
      if (!isAuthenticated) {
        console.log('Dashboard: User not authenticated, redirecting to sign in');
        setTimeout(() => {
          router.push('/auth/signin?redirect=/user/dashboard');
        }, 100);
      }
    }
  }, [mounted, loading, isAuthenticated, user, router]);

  // ✅ Show loading state while checking authentication
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ✅ Show loading state if not authenticated (NO REDIRECT)
  if (!isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // ✅ Show dashboard content if authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Navigation Header */}
      <nav className="bg-black/30 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm sm:text-lg">T</span>
                  </div>
                  <span className="text-lg sm:text-2xl font-bold text-white">TokenApp</span>
                </div>
              </Link>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-300">Welcome back</p>
                <p className="text-white font-semibold">{user?.name || user?.email || 'User'}</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 mb-6">
            <span className="text-yellow-400 mr-2">🚀</span>
            <span className="text-blue-300 text-sm font-semibold">Trading Dashboard</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Welcome to <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">TokenApp</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Manage your <span className="text-blue-400 font-semibold">crypto portfolio</span> with professional-grade tools and real-time market data.
          </p>
        </div>

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Total Balance Card */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Total Balance</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(usdBalance, 'USD')}</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">Available for trading</p>
          </div>

          {/* TIKI Balance Card */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-8 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🪙</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">TIKI Tokens</p>
                <p className="text-2xl font-bold text-white">{formatTiki(tikiBalance)}</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">Current holdings</p>
          </div>

          {/* Portfolio Value Card */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-2xl p-8 border border-green-500/20 hover:border-green-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Portfolio Value</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(usdBalance + (tikiBalance * tikiPrice), 'USD')}</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">Total portfolio worth</p>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link href="/user/deposit" className="group">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 group-hover:scale-105">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Deposit</h3>
                  <p className="text-gray-300 text-sm">Add funds to your account</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/user/withdraw" className="group">
            <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-6 border border-red-500/20 hover:border-red-500/40 transition-all duration-300 group-hover:scale-105">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💸</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Withdraw</h3>
                  <p className="text-gray-300 text-sm">Cash out your earnings</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/user/trade" className="group">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group-hover:scale-105">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🔄</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Trade</h3>
                  <p className="text-gray-300 text-sm">Buy & sell TIKI tokens</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/user/staking" className="group">
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group-hover:scale-105">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏦</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Staking</h3>
                  <p className="text-gray-300 text-sm">Earn rewards on your tokens</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Trading Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Quick Trade Card */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Quick Trade</h3>
                <p className="text-gray-300">Execute trades instantly</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Trade Type Toggle */}
              <div className="flex bg-gray-800/50 rounded-lg p-1">
                <button
                  onClick={() => setTradeType('buy')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    tradeType === 'buy'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Buy TIKI
                </button>
                <button
                  onClick={() => setTradeType('sell')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    tradeType === 'sell'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Sell TIKI
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount ({tradeType === 'buy' ? 'USD' : 'TIKI'})
                </label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  placeholder={tradeType === 'buy' ? 'Enter USD amount' : 'Enter TIKI amount'}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Trade Button */}
              <button
                onClick={handleTrade}
                disabled={isTrading || !tradeAmount}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  tradeType === 'buy'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } ${isTrading || !tradeAmount ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isTrading ? 'Processing...' : `${tradeType === 'buy' ? 'Buy' : 'Sell'} TIKI`}
              </button>
            </div>
          </div>

          {/* Market Data Card */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-2xl p-8 border border-green-500/20">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Market Data</h3>
                <p className="text-gray-300">Real-time TIKI price</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Current Price</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(tikiPrice, 'USD')}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">24h Change</span>
                <span className="text-green-400 font-semibold">+2.5%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">24h Volume</span>
                <span className="text-white font-semibold">$1.2M</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Market Cap</span>
                <span className="text-white font-semibold">$350K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">{dashboardStats.totalDeposits}</div>
            <div className="text-gray-300 text-sm">Total Deposits</div>
          </div>
          
          <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-6 border border-red-500/20 text-center">
            <div className="text-3xl font-bold text-red-400 mb-2">{dashboardStats.totalWithdrawals}</div>
            <div className="text-gray-300 text-sm">Total Withdrawals</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">{quickStats.totalTrades}</div>
            <div className="text-gray-300 text-sm">Total Trades</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">{quickStats.successRate}%</div>
            <div className="text-gray-300 text-sm">Success Rate</div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-black/40 border-t border-gray-700 rounded-2xl p-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <span className="text-xl font-bold text-white">TokenApp</span>
          </div>
          <p className="text-gray-400 mb-6">
            Professional crypto trading platform for serious traders.
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <Link href="/user/profile" className="hover:text-white transition-colors">Profile</Link>
            <Link href="/user/transactions" className="hover:text-white transition-colors">Transactions</Link>
            <Link href="/user/settings" className="hover:text-white transition-colors">Settings</Link>
          </div>
        </footer>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
