'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useVon } from '@/lib/Von-context';
import { usePriceUpdates } from '../../../hooks/usePriceUpdates';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import WalletOverview from '@/components/WalletOverview';
import PriceChart from '@/components/PriceChart';
import UserIdDisplay from '@/components/UserIdDisplay';
import { ToastContainer, useToast } from '@/components/Toast';
import { AlertModal } from '@/components/Modal';
import WalletFeeReferralBanner from '@/components/WalletFeeReferralBanner';
import Link from 'next/link';

export default function UserDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const { usdBalance, VonBalance, VonPrice, formatCurrency, formatVon, buyVon, sellVon } = useVon();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);
  const [showStakeConfirm, setShowStakeConfirm] = useState(false);
  const [pendingStake, setPendingStake] = useState(null);
  const { success, error, toasts, removeToast } = useToast();
  
  // Modal state for trade success/error messages
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeModalData, setTradeModalData] = useState({
    type: 'success',
    title: '',
    message: ''
  });
  
  // Enable real-time price updates every 5 seconds
  usePriceUpdates(5000);

  // Fetch dashboard stats when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchDashboardStats();
      fetchQuickStats();
    }
  }, [user?.id]);

  // Von trading state - only for Von tokens
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

  // Calculate total value using Von price
  const totalValue = parseFloat(tradeAmount) * VonPrice || 0;

  // Helper function to show trade modal
  const showTradeModalMessage = (type, title, message) => {
    setTradeModalData({ type, title, message });
    setShowTradeModal(true);
  };

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

  // Handle Von trade execution with API-based price calculation
  const handleTrade = async () => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) return;

    setIsTrading(true);
    try {
      const amountValue = parseFloat(tradeAmount);
      
      if (tradeType === 'buy') {
        // BUYING Von TOKENS LOGIC
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
        const result = await buyVon(amountValue);
        
        if (result.success) {
          let message = `Successfully bought ${formatVon(result.tokensBought)} Von tokens for ${formatCurrency(amountValue, 'USD')}!`;
          if (result.newPrice !== result.oldPrice) {
            message += `\n\nPrice updated from ${formatCurrency(result.oldPrice)} to ${formatCurrency(result.newPrice)} per token!`;
          }
          showTradeModalMessage('success', 'Buy Successful! 🎉', message);
        } else {
          showTradeModalMessage('error', 'Buy Failed', result.error || 'Unknown error occurred');
        }
        
      } else {
        // SELLING Von TOKENS LOGIC
        // Check if user has sufficient Von balance
        if (amountValue > VonBalance) {
          showTradeModalMessage(
            'error',
            'Insufficient Balance',
            `You don't have enough Von balance. Available: ${formatVon(VonBalance)} Von`
          );
          return;
        }
        
        // Use the new API-based sell function
        const result = await sellVon(amountValue);
        
        if (result.success) {
          let message = `Successfully sold ${formatVon(amountValue)} Von tokens for ${formatCurrency(result.usdReceived, 'USD')}!`;
          if (result.newPrice !== result.oldPrice) {
            message += `\n\nPrice updated from ${formatCurrency(result.oldPrice)} to ${formatCurrency(result.newPrice)} per token!`;
          }
          showTradeModalMessage('success', 'Sell Successful! 🎉', message);
        } else {
          showTradeModalMessage('error', 'Sell Failed', result.error || 'Unknown error occurred');
        }
      }
      
      // Reset form after successful trade
      setTradeAmount('');
    } catch (error) {
      console.error('Trade error:', error);
      showTradeModalMessage('error', 'Trade Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsTrading(false);
    }
  };

  // Update Von price using global state
  useEffect(() => {
    const updateVonPrice = () => {
      // Use real Von price from global state
      // Price updates are handled by the global state when trades occur
      // This effect just ensures the UI reflects the current price
    };

    updateVonPrice();
    const interval = setInterval(updateVonPrice, 5000);
    return () => clearInterval(interval);
  }, [VonPrice]);

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
      const userEmail = urlParams.get('userEmail');
      const userName = urlParams.get('userName');
      const userId = urlParams.get('userId');
      const userPicture = urlParams.get('userPicture');
      
      if (oauthSuccess === 'true' && provider && userEmail) {
        console.log('OAuth success detected:', provider, userEmail);
        setIsOAuthCallback(true);
        
        // Store OAuth user session data
        const oauthUserData = {
          id: userId || 'oauth-user-id',
          $id: userId || 'oauth-user-id',
          email: userEmail,
          name: userName || userEmail.split('@')[0],
          picture: userPicture || '',
          provider: provider,
          emailVerified: true,
          role: 'USER' // Default role for OAuth users
        };
        
        // Store in localStorage for client-side access
        localStorage.setItem('userSession', JSON.stringify(oauthUserData));
        localStorage.setItem('oauthSession', JSON.stringify({
          provider: provider,
          timestamp: Date.now()
        }));
        
        // Also store in cookies for server-side access
        document.cookie = `userSession=${JSON.stringify(oauthUserData)}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `oauthSession=${JSON.stringify({provider: provider, timestamp: Date.now()})}; path=/; max-age=86400; SameSite=Lax`;
        
        console.log('OAuth user session stored:', oauthUserData);
        
        // Show success message
        setTimeout(() => {
          success(`🎉 Successfully signed in with ${provider}! Welcome to Pryvons!`);
        }, 1000);
        
        // Clean up URL parameters
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Force page reload to ensure auth context updates
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(initializeDashboard);
  }, []);

  // Handle authentication redirect
  useEffect(() => {
    if (mounted && !loading) {
      if (!isAuthenticated && !user) {
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
    <Layout showSidebar={true}>
      {/* Professional Dashboard */}
      <div className="space-y-6">
        {/* Premium Welcome Header */}
        <div className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-slate-600/30 shadow-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 w-full lg:w-auto">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Welcome back, {user?.name || 'Trader'}! 👋
              </h1>
              <p className="text-slate-300 text-sm font-medium mt-1">
                Ready to trade? Your portfolio is looking great today.
              </p>
              {/* Premium User ID Display */}
              <div className="mt-3">
                <UserIdDisplay 
                  userId={user?.VonId || user?.id} 
                  showFull={false}
                  className="text-slate-200"
                />
              </div>
            </div>
            <div className="text-left lg:text-right w-full lg:w-auto">
              <div className="text-lg sm:text-xl font-bold text-white">
                {formatCurrency(usdBalance + (VonBalance * VonPrice), 'USD')}
              </div>
              <div className="text-emerald-400 text-xs font-medium">+2.5% today</div>
            </div>
          </div>
        </div>

        {/* Wallet Fee Referral Banner */}
        <WalletFeeReferralBanner />

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Balance */}
          <Card className="bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/20">
            <CardContent className="p-3 sm:p-4">
              <div className="text-xs text-indigo-200 mb-1">Total Balance</div>
              <div className="text-lg sm:text-xl font-bold text-white mb-1 break-words overflow-hidden">
                <span className="block truncate" title={formatCurrency(usdBalance + (VonBalance * VonPrice), 'USD')}>
                  {formatCurrency(usdBalance + (VonBalance * VonPrice), 'USD')}
                </span>
              </div>
              <div className="text-emerald-400 text-xs font-medium break-words">
                <span className="block truncate">+2.5% from yesterday</span>
              </div>
            </CardContent>
          </Card>

          {/* USD Balance */}
          <Card className="bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20">
            <CardContent className="p-3 sm:p-4">
              <div className="text-xs text-emerald-200 mb-1">USD Balance</div>
              <div className="text-lg sm:text-xl font-bold text-white mb-1 break-words overflow-hidden">
                <span className="block truncate" title={formatCurrency(usdBalance, 'USD')}>
                  {formatCurrency(usdBalance, 'USD')}
                </span>
              </div>
              <div className="text-emerald-300 text-xs break-words">
                <span className="block truncate">Available for trading</span>
              </div>
            </CardContent>
          </Card>

          {/* Von Holdings */}
          <Card className="bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20">
            <CardContent className="p-3 sm:p-4">
              <div className="text-xs text-amber-200 mb-1">Von Holdings</div>
              <div className="text-lg sm:text-xl font-bold text-white mb-1 break-words overflow-hidden">
                <span className="block truncate" title={formatVon(VonBalance)}>
                  {formatVon(VonBalance)}
                </span>
              </div>
              <div className="text-amber-300 text-xs break-words">
                <span className="block truncate" title={`Worth ${formatCurrency(VonBalance * VonPrice, 'USD')}`}>
                  Worth {formatCurrency(VonBalance * VonPrice, 'USD')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Von Price */}
          <Card className="bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-purple-500/20 border border-rose-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/20">
            <CardContent className="p-3 sm:p-4">
              <div className="text-xs text-rose-200 mb-1">Von Price</div>
              <div className="text-lg sm:text-xl font-bold text-white mb-1 break-words overflow-hidden">
                <span className="block truncate" title={formatCurrency(VonPrice, 'USD')}>
                  {formatCurrency(VonPrice, 'USD')}
                </span>
              </div>
              <div className="text-emerald-400 text-xs font-medium break-words">
                <span className="block truncate">+2.5% today</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Interface - Chart Hidden on Mobile */}
        <div className="space-y-4">
          {/* Price Chart - Hidden on Mobile, Visible on Desktop */}
          <Card className="w-full hidden md:block bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-white text-lg bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Von/USD Chart</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1 bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 rounded text-sm hover:from-slate-500/50 hover:to-slate-600/50 transition-all duration-200 border border-slate-500/30">1m</button>
                  <button className="px-3 py-1 bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 rounded text-sm hover:from-slate-500/50 hover:to-slate-600/50 transition-all duration-200 border border-slate-500/30">5m</button>
                  <button className="px-3 py-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white rounded text-sm shadow-lg shadow-cyan-500/25 border border-cyan-400/30">1h</button>
                  <button className="px-3 py-1 bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 rounded text-sm hover:from-slate-500/50 hover:to-slate-600/50 transition-all duration-200 border border-slate-500/30">1d</button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-80 lg:h-96">
                <PriceChart />
              </div>
            </CardContent>
          </Card>

          {/* Trading & Staking - Below Chart on Desktop, Always Visible on Mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Quick Trade */}
            <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Quick Trade</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* Trade Type Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                      tradeType === 'buy' 
                        ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30' 
                        : 'bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 border border-slate-500/30'
                    }`} 
                    onClick={() => setTradeType('buy')}
                  >
                    Buy
                  </button>
                  <button 
                    className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                      tradeType === 'sell' 
                        ? 'bg-gradient-to-r from-rose-500 via-red-500 to-pink-600 text-white shadow-lg shadow-rose-500/25 border border-rose-400/30' 
                        : 'bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 border border-slate-500/30'
                    }`} 
                    onClick={() => setTradeType('sell')}
                  >
                    Sell
                  </button>
                </div>

                {/* Price Input */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">Price (USD)</label>
                  <input
                    type="number"
                    value={VonPrice}
                    readOnly
                    className="w-full px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded text-white placeholder-slate-400 text-sm backdrop-blur-sm"
                  />
                </div>
                
                {/* Amount Input */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">Amount ({tradeType === 'buy' ? 'USD' : 'Von'})</label>
                  <input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    placeholder={tradeType === 'buy' ? 'Enter USD amount' : 'Enter Von amount'}
                    className="w-full px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 text-sm backdrop-blur-sm transition-all duration-200"
                  />
                </div>

                {/* Total Display */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">Total</label>
                  <input
                    type="number"
                    value={tradeType === 'buy' ? (parseFloat(tradeAmount) / VonPrice || 0) : (parseFloat(tradeAmount) * VonPrice || 0)}
                    readOnly
                    className="w-full px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded text-white placeholder-slate-400 text-sm backdrop-blur-sm"
                  />
                </div>

                {/* Fee Display */}
                {tradeAmount && parseFloat(tradeAmount) > 0 && (
                  <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-amber-300 text-xs font-medium">Trading Fee (1%)</span>
                      <span className="text-amber-400 font-semibold text-sm">
                        ${(parseFloat(tradeAmount) * 0.01).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-xs font-medium">
                        {tradeType === 'buy' ? 'Net Amount' : 'You\'ll Receive'}
                      </span>
                      <span className="text-white font-semibold text-sm">
                        ${(parseFloat(tradeAmount) * 0.99).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Trade Button */}
                <button
                  onClick={handleTrade}
                  disabled={isTrading || !tradeAmount}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-all text-sm ${
                    tradeType === 'buy'
                      ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30'
                      : 'bg-gradient-to-r from-rose-500 via-red-500 to-pink-600 hover:from-rose-600 hover:via-red-600 hover:to-pink-700 text-white shadow-lg shadow-rose-500/25 border border-rose-400/30'
                  } ${isTrading || !tradeAmount ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-xl'}`}
                >
                  {isTrading ? 'Processing...' : `${tradeType === 'buy' ? 'Buy' : 'Sell'} Von`}
                </button>
              </CardContent>
            </Card>

            {/* Staking Overview */}
            <Card className="bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-indigo-500/20 border border-violet-400/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  🏦 Staking Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="bg-gradient-to-r from-slate-700/40 to-slate-800/40 rounded-lg p-3 border border-slate-500/30 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300 text-xs font-medium">Staked Von</span>
                    <span className="text-white font-semibold text-sm">0 Von</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300 text-xs font-medium">APY</span>
                    <span className="text-emerald-400 font-semibold text-sm">12.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-xs font-medium">Rewards Earned</span>
                    <span className="text-amber-400 font-semibold text-sm">0 Von</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={() => router.push('/user/staking')}
                    variant="primary"
                    className="w-full text-sm"
                  >
                    🚀 Start Staking
                  </Button>
                  <Button 
                    onClick={() => router.push('/user/staking')}
                    variant="outline"
                    className="w-full text-sm"
                  >
                    📊 View Staking Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions - Hidden on Mobile */}
        <Card className="hidden md:block bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-400/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button 
                onClick={() => router.push('/user/deposit')}
                className="w-full text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30 hover:scale-105 transition-all duration-200"
              >
                💰 Deposit
              </Button>
              <Button 
                onClick={() => router.push('/user/withdraw')}
                className="w-full text-sm bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-500/25 border border-rose-400/30 hover:scale-105 transition-all duration-200"
              >
                💸 Withdraw
              </Button>
              <Button 
                onClick={() => router.push('/user/send')}
                className="w-full text-sm bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30 hover:scale-105 transition-all duration-200"
              >
                📤 Send
              </Button>
              <Button 
                onClick={() => router.push('/user/transactions')}
                className="w-full text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 border border-amber-400/30 hover:scale-105 transition-all duration-200"
              >
                📋 History
              </Button>
            </div>
          </CardContent>
        </Card>

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
