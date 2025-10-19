'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function TestOAuthDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [localStorageData, setLocalStorageData] = useState({});

  useEffect(() => {
    // Get localStorage data
    const userSession = localStorage.getItem('userSession');
    const oauthSession = localStorage.getItem('oauthSession');
    
    setLocalStorageData({
      userSession: userSession ? JSON.parse(userSession) : null,
      oauthSession: oauthSession ? JSON.parse(oauthSession) : null
    });
  }, []);

  const clearSessions = () => {
    localStorage.removeItem('userSession');
    localStorage.removeItem('oauthSession');
    window.location.reload();
  };

  const testGoogleOAuth = () => {
    window.location.href = '/api/auth/oauth/google';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">OAuth Dashboard Test</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current User Info */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Current User Info</h2>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Auth Context:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                  <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
                  <p><strong>User:</strong> {user ? 'Present' : 'None'}</p>
                </div>
              </div>

              {user && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">User Details:</h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>ID:</strong> {user.$id || user.id}</p>
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> {user.role}</p>
                    <p><strong>Provider:</strong> {user.provider || 'Manual'}</p>
                    <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
                    {user.picture && <p><strong>Picture:</strong> {user.picture}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* LocalStorage Data */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">LocalStorage Data</h2>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-2">User Session:</h3>
                <pre className="text-xs text-yellow-700 overflow-auto">
                  {localStorageData.userSession ? 
                    JSON.stringify(localStorageData.userSession, null, 2) : 
                    'No user session found'
                  }
                </pre>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-medium text-purple-800 mb-2">OAuth Session:</h3>
                <pre className="text-xs text-purple-700 overflow-auto">
                  {localStorageData.oauthSession ? 
                    JSON.stringify(localStorageData.oauthSession, null, 2) : 
                    'No OAuth session found'
                  }
                </pre>
              </div>
            </div>
          </div>

          {/* Test Actions */}
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Actions</h2>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={testGoogleOAuth}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Test Google OAuth
              </button>
              
              <button
                onClick={clearSessions}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Clear All Sessions
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Refresh Page
              </button>
            </div>
          </div>

          {/* Test Instructions */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Test Instructions:</h3>
            <ol className="list-decimal list-inside text-gray-700 space-y-1 text-sm">
              <li><strong>Manual Sign-in:</strong> Go to /auth/signin and sign in with test@example.com / password123</li>
              <li><strong>Google OAuth:</strong> Click "Test Google OAuth" button above</li>
              <li><strong>Check Results:</strong> Verify that both methods show the correct user email and name</li>
              <li><strong>Dashboard Test:</strong> Go to /user/dashboard and verify user info is displayed correctly</li>
            </ol>
          </div>

          {/* Expected Results */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Expected Results:</h3>
            <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
              <li><strong>Manual Sign-in:</strong> Should show test@example.com and "Test User"</li>
              <li><strong>Google OAuth:</strong> Should show your actual Gmail address and name</li>
              <li><strong>Both methods:</strong> Should display the same user info on the dashboard</li>
              <li><strong>LocalStorage:</strong> Should contain complete user session data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';

