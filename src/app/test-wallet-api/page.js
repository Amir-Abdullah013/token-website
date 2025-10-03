'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';

export default function TestWalletAPI() {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testWalletAPI = async () => {
    if (!user?.$id) {
      setError('No user ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/wallet/overview?userId=${user.$id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setWalletData(data);
      console.log('Wallet API Response:', data);
    } catch (err) {
      console.error('Error testing wallet API:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.$id) {
      testWalletAPI();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Wallet API Test
          </h1>
          
          <div className="space-y-6">
            {/* User Info */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h2 className="text-xl font-semibold mb-4">User Information</h2>
              <div className="space-y-2 text-sm">
                <div><strong>User ID:</strong> {user?.$id || 'Not available'}</div>
                <div><strong>User Name:</strong> {user?.name || 'Not available'}</div>
                <div><strong>User Email:</strong> {user?.email || 'Not available'}</div>
              </div>
            </div>

            {/* Test Button */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">API Test</h2>
              <button
                onClick={testWalletAPI}
                disabled={loading || !user?.$id}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing...' : 'Test Wallet API'}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Display */}
            {walletData && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <div className="mt-2 text-sm text-green-700">
                      Wallet API is working correctly!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Data Display */}
            {walletData && (
              <div className="border rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Wallet Data</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Wallet Information:</h3>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                      {JSON.stringify(walletData.wallet, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">Statistics:</h3>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                      {JSON.stringify(walletData.statistics, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">Last Updated:</h3>
                    <p className="text-sm text-gray-600">{walletData.lastUpdated}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="border rounded-lg p-4 bg-yellow-50">
              <h2 className="text-xl font-semibold mb-4">Instructions</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Make sure you are logged in (user ID should be available)</li>
                <li>Click "Test Wallet API" to test the API endpoint</li>
                <li>Check the console for any error messages</li>
                <li>If successful, wallet data should be displayed below</li>
                <li>In development mode, mock data will be returned</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

