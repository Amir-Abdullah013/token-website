'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import WalletOverview from '../../../components/WalletOverview';
import PriceChart from '../../../components/PriceChart';
import { ToastContainer, useToast } from '../../../components/Toast';

export default function UserDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);
  const { toasts, removeToast } = useToast();

  // ✅ Prevent hydration mismatches by only running client-side code after mount
  useEffect(() => {
    setMounted(true);
    console.log('Dashboard: Component mounted');
    
    // Use requestAnimationFrame to ensure DOM is ready
    const initializeDashboard = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const oauthSuccess = urlParams.get('oauth') === 'success';
      const provider = urlParams.get('provider');
      const session = urlParams.get('session');
      const userEmail = urlParams.get('userEmail');
      const userName = urlParams.get('userName');
      const userId = urlParams.get('userId');
      const userPicture = urlParams.get('userPicture');
      
      if (oauthSuccess && provider && session && userEmail) {
        console.log('Dashboard: Coming from OAuth callback', { 
          provider, 
          session, 
          userEmail, 
          userName 
        });
        setIsOAuthCallback(true);
        
        // Store complete OAuth user data
        const oauthData = {
          provider,
          session,
          timestamp: Date.now()
        };
        
        // Store user session data with complete user information
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
        
        localStorage.setItem('oauthSession', JSON.stringify(oauthData));
        localStorage.setItem('userSession', JSON.stringify(userSessionData));
        
        console.log('Dashboard: OAuth user data stored:', userSessionData);
        
        // Force page reload to ensure auth context updates
        setTimeout(() => {
          window.location.reload();
        }, 100);
        
        // Clean up URL
        window.history.replaceState({}, '', '/user/dashboard');
      }
    };

    if (typeof window !== 'undefined') {
      requestAnimationFrame(initializeDashboard);
    }
  }, []);

  useEffect(() => {
    console.log('Dashboard: Auth state changed', { mounted, loading, isAuthenticated, user: user?.name, isOAuthCallback });
    
    if (isOAuthCallback) {
      console.log('Dashboard: Skipping auth check - coming from OAuth callback');
      return;
    }
    
    // TEMPORARILY DISABLE ALL AUTH CHECKS TO PREVENT REDIRECTS
    console.log('Dashboard: Auth checks temporarily disabled to prevent OAuth redirect issues');
    return;

    // Only redirect if user is really not authenticated
    if (mounted && !loading && !isAuthenticated && !user) {
      const timer = setTimeout(() => {
        console.log('Dashboard: Final auth check', { isAuthenticated, user: user?.name });
        if (!isAuthenticated && !user) {
          console.log('Dashboard: User not authenticated, redirecting to signin');
          router.push('/auth/signin');
        }
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [mounted, loading, isAuthenticated, user, router, isOAuthCallback]);

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
      {/* ✅ Wrapped in a container to fix large-screen spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* Dashboard Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome , {user?.name || 'User'}!</p>
            </div>
            <div className="text-sm text-gray-500 flex-shrink-0">
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
  
  {/* Portfolio Value */}
  <Card className="flex-shrink-0  ">
    <CardContent className="p-4 lg:p-6">
      <div className="flex items-center">
        <div className="p-2 lg:p-3 bg-blue-100 rounded-lg flex-shrink-0">
          <span className="text-xl lg:text-2xl">📈</span>
        </div>
        <div className="ml-3 lg:ml-4 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
            Portfolio Value
          </p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 whitespace-nowrap">
            $12,450
          </p>
          <p className="text-xs sm:text-sm text-green-600">+5.2%</p>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Total Deposits */}
  <Card className="flex-shrink-0">
    <CardContent className="p-4 lg:p-6">
      <div className="flex items-center">
        <div className="p-2 lg:p-3 bg-green-100 rounded-lg flex-shrink-0">
          <span className="text-xl lg:text-2xl">💰</span>
        </div>
        <div className="ml-3 lg:ml-4 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
            Total Deposits
          </p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 whitespace-nowrap">
            $8,500
          </p>
          <p className="text-xs sm:text-sm text-green-600">+12.3%</p>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Total Withdraw */}
  <Card className="flex-shrink-0">
    <CardContent className="p-4 lg:p-6">
      <div className="flex items-center">
        <div className="p-2 lg:p-3 bg-red-100 rounded-lg flex-shrink-0">
          <span className="text-xl lg:text-2xl">💸</span>
        </div>
        <div className="ml-3 lg:ml-4 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
            Total Withdraw
          </p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 whitespace-nowrap">
            $2,100
          </p>
          <p className="text-xs sm:text-sm text-red-600">-3.1%</p>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Active Trades */}
  <Card className="flex-shrink-0">
    <CardContent className="p-4 lg:p-6">
      <div className="flex items-center">
        <div className="p-2 lg:p-3 bg-purple-100 rounded-lg flex-shrink-0">
          <span className="text-xl lg:text-2xl">🔄</span>
        </div>
        <div className="ml-3 lg:ml-4 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
            Active Trades
          </p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 whitespace-nowrap">
            7
          </p>
          <p className="text-xs sm:text-sm text-blue-600">+2</p>
        </div>
      </div>
    </CardContent>
  </Card>

</div>


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">
            <WalletOverview />
            <PriceChart />

            {/* Additional Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-4 h-auto hover:shadow-md transition-all duration-200"
                    onClick={() => window.location.href = '/user/trade'}
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                      <span className="text-white text-xl">🔄</span>
                    </div>
                    <span className="text-sm font-medium">Trade</span>
                  </Button>
                
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-4 h-auto hover:shadow-md transition-all duration-200"
                    onClick={() => window.location.href = '/user/transfer'}
                  >
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-2">
                      <span className="text-white text-xl">↔️</span>
                    </div>
                    <span className="text-sm font-medium">Transfer</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-4 h-auto hover:shadow-md transition-all duration-200"
                    onClick={() => window.location.href = '/user/transactions'}
                  >
                    <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center mb-2">
                      <span className="text-white text-xl">📊</span>
                    </div>
                    <span className="text-sm font-medium">History</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {/* ✅ Kept your full transaction list unchanged */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-green-600 font-bold">+</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">Bitcoin Purchase</p>
                        <p className="text-xs text-gray-600">BTC/USD</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-green-600">+$1,250.00</p>
                      <p className="text-xs text-gray-500">2h ago</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-red-600 font-bold">-</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">Ethereum Sale</p>
                        <p className="text-xs text-gray-600">ETH/USD</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-red-600">-$850.00</p>
                      <p className="text-xs text-gray-500">5h ago</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-green-600 font-bold">+</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">Deposit</p>
                        <p className="text-xs text-gray-600">Bank Transfer</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-green-600">+$2,000.00</p>
                      <p className="text-xs text-gray-500">1d ago</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-red-600 font-bold">-</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">Withdrawal</p>
                        <p className="text-xs text-gray-600">Bank Transfer</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-red-600">-$500.00</p>
                      <p className="text-xs text-gray-500">2d ago</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold">↔</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">Trading Fee</p>
                        <p className="text-xs text-gray-600">Transaction Fee</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-blue-600">-$15.00</p>
                      <p className="text-xs text-gray-500">3d ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </Layout>
  );
}
