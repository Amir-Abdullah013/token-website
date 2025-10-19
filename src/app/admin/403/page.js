'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/admin-auth';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';

export default function AccessDeniedPage() {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      // If user is not authenticated, redirect to admin login
      if (!isAuthenticated) {
        router.push('/admin');
      }
      // If user is authenticated but not admin, redirect to user dashboard
      else if (isAuthenticated && user?.role !== 'admin') {
        router.push('/user/dashboard');
      }
    }
  }, [mounted, isLoading, isAuthenticated, user, router]);

  const handleGoToUserDashboard = () => {
    router.push('/user/dashboard');
  };

  const handleGoToAdminLogin = () => {
    router.push('/admin');
  };

  if (!mounted || isLoading) {
    return (
      <Layout showSidebar={false}>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={false}>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-5xl">🚫</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-lg text-gray-600">
              You do not have permission to view this page
            </p>
          </div>

          {/* Error Card */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-center text-red-700">403 - Forbidden</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-red-500">⚠️</span>
                    <span className="text-red-800 font-medium">Admin Access Required</span>
                  </div>
                  <p className="text-sm text-red-700 mt-2">
                    This area is restricted to authorized administrators only.
                  </p>
                </div>

                <div className="text-sm text-gray-600">
                  <p>If you believe you should have access to this area, please:</p>
                  <ul className="mt-2 space-y-1 text-left">
                    <li>• Contact your system administrator</li>
                    <li>• Verify you have the correct permissions</li>
                    <li>• Try logging in with an admin account</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <Button
                  onClick={handleGoToUserDashboard}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Go to User Dashboard
                </Button>
                
                <Button
                  onClick={handleGoToAdminLogin}
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50"
                >
                  Try Admin Login
                </Button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Need help? Contact support at{' '}
                  <a href="mailto:support@tiki.com" className="text-blue-600 hover:text-blue-500">
                    support@tiki.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';







