'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestOAuthFlow() {
  const [authStatus, setAuthStatus] = useState('Checking...');
  const [userData, setUserData] = useState(null);
  const [oauthData, setOauthData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        // Check localStorage for user session
        const userSession = localStorage.getItem('userSession');
        const oauthSession = localStorage.getItem('oauthSession');
        
        if (userSession) {
          const user = JSON.parse(userSession);
          setUserData(user);
          setAuthStatus('✅ User authenticated');
        } else {
          setAuthStatus('❌ No user session found');
        }
        
        if (oauthSession) {
          const oauth = JSON.parse(oauthSession);
          setOauthData(oauth);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setAuthStatus('❌ Error checking authentication');
      }
    };

    checkAuthStatus();
  }, []);

  const clearSessions = () => {
    localStorage.removeItem('userSession');
    localStorage.removeItem('oauthSession');
    setUserData(null);
    setOauthData(null);
    setAuthStatus('Sessions cleared');
  };

  const testGoogleOAuth = () => {
    window.location.href = '/api/auth/oauth/google';
  };

  const goToDashboard = () => {
    router.push('/user/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">OAuth Flow Test</h1>
          
          {/* Auth Status */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Authentication Status</h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-lg font-medium">{authStatus}</p>
            </div>
          </div>

          {/* User Data */}
          {userData && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">User Data</h2>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* OAuth Data */}
          {oauthData && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">OAuth Data</h2>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(oauthData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={testGoogleOAuth}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🔐 Test Google OAuth
            </button>
            
            <button
              onClick={goToDashboard}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              📊 Go to Dashboard
            </button>
            
            <button
              onClick={clearSessions}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              🗑️ Clear Sessions
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Debug Info */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Debug Information</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</li>
              <li>• User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</li>
              <li>• Timestamp: {new Date().toISOString()}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';
