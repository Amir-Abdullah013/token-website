'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { useTiki } from '../../../lib/tiki-context';
import { usePriceUpdates } from '../../../hooks/usePriceUpdates';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import WalletOverview from '../../../components/WalletOverview';
import PriceChart from '../../../components/PriceChart';
import UserIdDisplay from '../../../components/UserIdDisplay';
import { ToastContainer, useToast } from '../../../components/Toast';
import { AlertModal } from '../../../components/Modal';
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
      setTradeAmount('');
    } catch (error) {
      console.error('Trade error:', error);
      showTradeModalMessage('error', 'Trade Failed', 'An unexpected error occurred. Please try again.');
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
          success(`🎉 Successfully signed in with ${provider}! Welcome to TokenApp!`);
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
        {/* Welcome Header */}
        <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {user?.name || 'Trader'}! 👋
              </h1>
              <p className="text-gray-300 text-sm">
                Ready to trade? Your portfolio is looking great today.
              </p>
              {/* User ID Display */}
              <div className="mt-3">
                <UserIdDisplay 
                  userId={user?.tikiId || user?.id} 
                  showFull={false}
                  className="text-white"
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-white">
                {formatCurrency(usdBalance + (tikiBalance * tikiPrice), 'USD')}
              </div>
              <div className="text-green-400 text-xs">+2.5% today</div>
            </div>
          </div>
        </div>

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Balance */}
          <Card variant="primary" className="hover:scale-105 transition-transform">
            <CardContent className="p-4">
              <div className="text-xs text-gray-300 mb-1">Total Balance</div>
              <div className="text-xl font-bold text-white mb-1">
                {formatCurrency(usdBalance + (tikiBalance * tikiPrice), 'USD')}
              </div>
              <div className="text-green-400 text-xs">+2.5% from yesterday</div>
            </CardContent>
          </Card>

          {/* USD Balance */}
          <Card variant="success" className="hover:scale-105 transition-transform">
            <CardContent className="p-4">
              <div className="text-xs text-gray-300 mb-1">USD Balance</div>
              <div className="text-xl font-bold text-white mb-1">
                {formatCurrency(usdBalance, 'USD')}
              </div>
              <div className="text-gray-300 text-xs">Available for trading</div>
            </CardContent>
          </Card>

          {/* TIKI Holdings */}
          <Card variant="warning" className="hover:scale-105 transition-transform">
            <CardContent className="p-4">
              <div className="text-xs text-gray-300 mb-1">TIKI Holdings</div>
              <div className="text-xl font-bold text-white mb-1">
                {formatTiki(tikiBalance)}
              </div>
              <div className="text-gray-300 text-xs">Worth {formatCurrency(tikiBalance * tikiPrice, 'USD')}</div>
            </CardContent>
          </Card>

          {/* TIKI Price */}
          <Card variant="error" className="hover:scale-105 transition-transform">
            <CardContent className="p-4">
              <div className="text-xs text-gray-300 mb-1">TIKI Price</div>
              <div className="text-xl font-bold text-white mb-1">
                {formatCurrency(tikiPrice, 'USD')}
              </div>
              <div className="text-green-400 text-xs">+2.5% today</div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Interface - Chart Hidden on Mobile */}
        <div className="space-y-4">
          {/* Price Chart - Hidden on Mobile, Visible on Desktop */}
          <Card className="w-full hidden md:block">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-white text-lg">TIKI/USD Chart</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1 bg-white/10 text-gray-300 rounded text-sm hover:bg-white/20 transition-colors">1m</button>
                  <button className="px-3 py-1 bg-white/10 text-gray-300 rounded text-sm hover:bg-white/20 transition-colors">5m</button>
                  <button className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded text-sm">1h</button>
                  <button className="px-3 py-1 bg-white/10 text-gray-300 rounded text-sm hover:bg-white/20 transition-colors">1d</button>
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Quick Trade</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* Trade Type Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                      tradeType === 'buy' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`} 
                    onClick={() => setTradeType('buy')}
                  >
                    Buy
                  </button>
                  <button 
                    className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                      tradeType === 'sell' 
                        ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`} 
                    onClick={() => setTradeType('sell')}
                  >
                    Sell
                  </button>
                </div>

                {/* Price Input */}
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Price (USD)</label>
                  <input
                    type="number"
                    value={tikiPrice}
                    readOnly
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-400 text-sm"
                  />
                </div>
                
                {/* Amount Input */}
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Amount ({tradeType === 'buy' ? 'USD' : 'TIKI'})</label>
                  <input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    placeholder={tradeType === 'buy' ? 'Enter USD amount' : 'Enter TIKI amount'}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Total Display */}
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Total</label>
                  <input
                    type="number"
                    value={tradeType === 'buy' ? (parseFloat(tradeAmount) / tikiPrice || 0) : (parseFloat(tradeAmount) * tikiPrice || 0)}
                    readOnly
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-400 text-sm"
                  />
                </div>

                {/* Trade Button */}
                <button
                  onClick={handleTrade}
                  disabled={isTrading || !tradeAmount}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-all text-sm ${
                    tradeType === 'buy'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg'
                      : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg'
                  } ${isTrading || !tradeAmount ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                >
                  {isTrading ? 'Processing...' : `${tradeType === 'buy' ? 'Buy' : 'Sell'} TIKI`}
                </button>
              </CardContent>
            </Card>

            {/* Staking Overview */}
            <Card variant="primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center">
                  🏦 Staking Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 text-xs">Staked TIKI</span>
                    <span className="text-white font-semibold text-sm">0 TIKI</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 text-xs">APY</span>
                    <span className="text-green-400 font-semibold text-sm">12.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-xs">Rewards Earned</span>
                    <span className="text-yellow-400 font-semibold text-sm">0 TIKI</span>
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
        <Card variant="success" className="hidden md:block">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button 
                onClick={() => router.push('/user/deposit')}
                variant="success"
                className="w-full text-sm"
              >
                💰 Deposit
              </Button>
              <Button 
                onClick={() => router.push('/user/withdraw')}
                variant="danger"
                className="w-full text-sm"
              >
                💸 Withdraw
              </Button>
              <Button 
                onClick={() => router.push('/user/send')}
                variant="outline"
                className="w-full text-sm"
              >
                📤 Send
              </Button>
              <Button 
                onClick={() => router.push('/user/transactions')}
                variant="ghost"
                className="w-full text-sm"
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
