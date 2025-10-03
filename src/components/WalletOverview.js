'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import Card, { CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';

// Skeleton loader component
const SkeletonLoader = () => (
  <div className="animate-pulse">
    <div className="space-y-4">
      {/* Balance skeleton */}
      <div className="text-center space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
        <div className="h-12 bg-gray-200 rounded w-48 mx-auto"></div>
        <div className="h-3 bg-gray-200 rounded w-32 mx-auto"></div>
      </div>
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 p-4 rounded-lg">
            <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
      
      {/* Action buttons skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  </div>
);

// Currency symbol helper
const getCurrencySymbol = (currency) => {
  const symbols = {
    'USD': '$',
    'PKR': '₨',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$'
  };
  return symbols[currency] || currency;
};

// Format currency helper
const formatCurrency = (amount, currency = 'PKR') => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${parseFloat(amount).toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

// Format date helper
const formatLastUpdated = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};

const WalletOverview = ({ className = '', onDeposit, onWithdraw }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [stats, setStats] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch wallet data
  const fetchWalletData = async () => {
    if (!user?.$id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch wallet overview from API
      const response = await fetch(`/api/wallet/overview?userId=${user.$id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch wallet data');
      }
      
      const data = await response.json();
      
      setWalletData(data.wallet);
      setStats(data.statistics);
      setLastUpdated(data.lastUpdated || new Date().toISOString());
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time updates
  useEffect(() => {
    if (!user?.$id) return;

    // Initial fetch
    fetchWalletData();

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchWalletData, 30000);

    return () => clearInterval(interval);
  }, [user?.$id]);

  // Handle deposit action
  const handleDeposit = () => {
    if (onDeposit) {
      onDeposit();
    } else {
      router.push('/user/deposit');
    }
  };

  // Handle withdraw action
  const handleWithdraw = () => {
    if (onWithdraw) {
      onWithdraw();
    } else {
      router.push('/user/withdraw');
    }
  };

  // Refresh data manually
  const handleRefresh = () => {
    fetchWalletData();
  };

  if (loading) {
    return (
      <div className={`space-y-4 sm:space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle>Wallet Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonLoader />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 sm:space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle>Wallet Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const balance = walletData?.balance || 0;
  const currency = walletData?.currency || 'PKR';
  const formattedBalance = formatCurrency(balance, currency);
  const lastUpdatedText = lastUpdated ? formatLastUpdated(lastUpdated) : 'Unknown';

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Main Wallet Card */}
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl md:text-2xl">Wallet Overview</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="mr-2">🔄</span>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Total Balance */}
            <div className="text-center">
              <p className="text-sm sm:text-base text-gray-600 mb-2">Total Balance</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                {formattedBalance}
              </h2>
              <p className="text-sm sm:text-base text-gray-500">
                Last updated {lastUpdatedText}
              </p>
            </div>

            {/* Quick Stats */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Total Deposits</p>
                      <p className="text-lg font-bold text-green-900">
                        {formatCurrency(stats.totalDeposits, currency)}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600">📈</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-800">Total Withdrawals</p>
                      <p className="text-lg font-bold text-red-900">
                        {formatCurrency(stats.totalWithdrawals, currency)}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600">📉</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Net Tokens</p>
                      <p className="text-lg font-bold text-blue-900">
                        {formatCurrency(stats.totalAmount, currency)}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600">🪙</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleDeposit}
                className="flex items-center justify-center p-4 h-auto bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                <span className="text-xl mr-2">💰</span>
                <span>Deposit</span>
              </Button>
              
              <Button
                onClick={handleWithdraw}
                className="flex items-center justify-center p-4 h-auto bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                <span className="text-xl mr-2">💸</span>
                <span>Withdraw</span>
              </Button>
            </div>

           
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletOverview;


