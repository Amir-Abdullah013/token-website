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
      // Check if we have OAuth session data in localStorage
      const oauthSession = localStorage.getItem('oauthSession');
      const userSession = localStorage.getItem('userSession');
      
      if (oauthSession && userSession) {
        console.log('Dashboard: Found OAuth session data in localStorage');
        setIsOAuthCallback(true);
        
        // OAuth data should already be stored by oauth-success page
        console.log('Dashboard: OAuth session data available', JSON.parse(userSession));
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(initializeDashboard);
  }, []);

  // ✅ Redirect to signin if not authenticated (only after component mounts)
  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      console.log('Dashboard: Not authenticated, redirecting to signin');
      router.push('/auth/signin?redirect=/user/dashboard');
    }
  }, [mounted, loading, isAuthenticated, router]);

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

  // ✅ Show signin redirect if not authenticated
  if (!isAuthenticated) {
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
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name || user?.email || 'User'}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => router.push('/user/profile')}
                  variant="outline"
                >
                  Profile
                </Button>
                <Button
                  onClick={() => router.push('/user/notifications')}
                  variant="outline"
                >
                  Notifications
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Wallet Overview */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Wallet Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <WalletOverview />
                </CardContent>
              </Card>
            </div>

            {/* Price Chart */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Price Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <PriceChart />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => router.push('/user/notifications')}
                    className="w-full"
                  >
                    View Notifications
                  </Button>
                  <Button
                    onClick={() => router.push('/user/security')}
                    variant="outline"
                    className="w-full"
                  >
                    Security Settings
                  </Button>
                  <Button
                    onClick={() => router.push('/user/support')}
                    variant="outline"
                    className="w-full"
                  >
                    Get Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}
