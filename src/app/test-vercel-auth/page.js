'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';

export default function TestVercelAuth() {
  const { user, loading, isAuthenticated } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addTestResult = (test, result, details = '') => {
    setTestResults(prev => [...prev, {
      test,
      result,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    // Test 1: Check authentication state
    if (isAuthenticated && user) {
      addTestResult('Authentication State', 'PASS', `User authenticated: ${user.email}`);
    } else if (loading) {
      addTestResult('Authentication State', 'PENDING', 'Still loading authentication...');
    } else {
      addTestResult('Authentication State', 'FAIL', 'User not authenticated');
    }

    // Test 2: Check localStorage session data
    const userSession = localStorage.getItem('userSession');
    const oauthSession = localStorage.getItem('oauthSession');
    
    if (userSession) {
      try {
        const userData = JSON.parse(userSession);
        addTestResult('LocalStorage Session', 'PASS', `Session found: ${userData.email}`);
      } catch (error) {
        addTestResult('LocalStorage Session', 'FAIL', 'Invalid session data');
      }
    } else {
      addTestResult('LocalStorage Session', 'INFO', 'No session data found');
    }

    if (oauthSession) {
      try {
        const oauthData = JSON.parse(oauthSession);
        addTestResult('OAuth Session', 'PASS', `OAuth session found: ${oauthData.provider}`);
      } catch (error) {
        addTestResult('OAuth Session', 'FAIL', 'Invalid OAuth session data');
      }
    } else {
      addTestResult('OAuth Session', 'INFO', 'No OAuth session found');
    }

    // Test 3: Check environment
    addTestResult('Environment', 'INFO', `NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);

    // Test 4: Check if we're on Vercel
    const isVercel = process.env.VERCEL === '1';
    addTestResult('Vercel Environment', isVercel ? 'PASS' : 'INFO', 
      isVercel ? 'Running on Vercel' : 'Not running on Vercel');

    // Test 5: Check middleware behavior
    addTestResult('Middleware Behavior', 'INFO', 'Middleware should allow client-side auth handling');

    // Test 6: Check redirect behavior
    if (isAuthenticated && user) {
      addTestResult('Redirect Behavior', 'PASS', 'User should be able to access dashboard');
    } else {
      addTestResult('Redirect Behavior', 'INFO', 'User should be redirected to signin');
    }

    setIsRunning(false);
  };

  const simulateOAuthCallback = () => {
    const testUrl = new URL(window.location.origin + '/auth/oauth-success');
    testUrl.searchParams.set('provider', 'google');
    testUrl.searchParams.set('session', 'test-session-' + Date.now());
    testUrl.searchParams.set('userEmail', 'test@example.com');
    testUrl.searchParams.set('userName', 'Test User');
    testUrl.searchParams.set('userId', 'test-user-id');
    testUrl.searchParams.set('userPicture', 'https://via.placeholder.com/150');
    
    window.location.href = testUrl.toString();
  };

  const clearSessions = () => {
    localStorage.removeItem('userSession');
    localStorage.removeItem('oauthSession');
    addTestResult('Clear Sessions', 'PASS', 'All sessions cleared');
  };

  const testDashboardAccess = () => {
    window.location.href = '/user/dashboard';
  };

  const testSigninAccess = () => {
    window.location.href = '/auth/signin';
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Vercel Authentication Fix Test
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900">Loading</h3>
                <p className="text-blue-700">{loading ? 'Yes' : 'No'}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900">Authenticated</h3>
                <p className="text-green-700">{isAuthenticated ? 'Yes' : 'No'}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-medium text-purple-900">User</h3>
                <p className="text-purple-700">{user ? user.email || 'None' : 'No'}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Controls</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={runTests}
                disabled={isRunning}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isRunning ? 'Running Tests...' : 'Run Tests'}
              </button>
              
              <button
                onClick={simulateOAuthCallback}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Simulate OAuth Callback
              </button>
              
              <button
                onClick={clearSessions}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Clear Sessions
              </button>
              
              <button
                onClick={testDashboardAccess}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Test Dashboard Access
              </button>
              
              <button
                onClick={testSigninAccess}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Test Signin Access
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Results</h2>
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests run yet. Click "Run Tests" to start.</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className={`w-3 h-3 rounded-full ${
                        result.result === 'PASS' ? 'bg-green-500' : 
                        result.result === 'FAIL' ? 'bg-red-500' : 
                        result.result === 'PENDING' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></span>
                      <span className="font-medium">{result.test}</span>
                      <span className="text-sm text-gray-500">{result.details}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {result.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">Vercel Authentication Fix Summary</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Unified middleware that doesn't interfere with OAuth sessions</li>
              <li>• Client-side authentication handling for Vercel production</li>
              <li>• Improved OAuth success page with reliable redirects</li>
              <li>• Better error handling and fallback mechanisms</li>
              <li>• Production-ready redirect logic for dashboard access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';

