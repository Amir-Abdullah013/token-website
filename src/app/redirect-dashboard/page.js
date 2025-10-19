'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function RedirectDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [status, setStatus] = useState('Checking authentication...');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleRedirect = () => {
      // Check if user is authenticated
      if (isAuthenticated && user) {
        setStatus('User authenticated, redirecting to dashboard...');
        // Use window.location for more reliable redirect on Vercel
        setTimeout(() => {
          window.location.href = '/user/dashboard';
        }, 500);
      } else if (!loading) {
        setStatus('User not authenticated, redirecting to signin...');
        // Redirect to signin if not authenticated
        setTimeout(() => {
          window.location.href = '/auth/signin?redirect=/user/dashboard';
        }, 500);
      }
    };

    handleRedirect();
  }, [mounted, user, loading, isAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          {/* Loading Spinner */}
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          
          {/* Status Message */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {status}
          </h2>
          
          {/* Progress Steps */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <span>Checking authentication status</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
              <span>Redirecting to appropriate page</span>
            </div>
          </div>
          
          {/* Manual redirect buttons */}
          <div className="mt-6 space-y-2">
            <button
              onClick={() => window.location.href = '/user/dashboard'}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => window.location.href = '/auth/signin'}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';
