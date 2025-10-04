'use client';

import { useState, useEffect } from 'react';

export default function DebugOAuthFlow() {
  const [debugInfo, setDebugInfo] = useState({});
  const [urlParams, setUrlParams] = useState({});
  const [localStorageData, setLocalStorageData] = useState({});
  const [environment, setEnvironment] = useState({});

  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const urlParamsObj = {};
    for (const [key, value] of params.entries()) {
      urlParamsObj[key] = value;
    }
    setUrlParams(urlParamsObj);

    // Get localStorage data
    const localStorageObj = {};
    try {
      const userSession = localStorage.getItem('userSession');
      const oauthSession = localStorage.getItem('oauthSession');
      const signupEmail = localStorage.getItem('signupEmail');
      
      localStorageObj.userSession = userSession ? JSON.parse(userSession) : null;
      localStorageObj.oauthSession = oauthSession ? JSON.parse(oauthSession) : null;
      localStorageObj.signupEmail = signupEmail;
    } catch (error) {
      console.error('Error reading localStorage:', error);
    }
    setLocalStorageData(localStorageObj);

    // Get environment info
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_NEXTAUTH_URL: process.env.NEXT_PUBLIC_NEXTAUTH_URL,
      currentUrl: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      timestamp: new Date().toISOString()
    };
    setEnvironment(env);

    // Analyze the OAuth flow
    const analysis = {
      isOAuthCallback: urlParamsObj.oauth === 'success',
      hasProvider: !!urlParamsObj.provider,
      hasSession: !!urlParamsObj.session,
      hasUserEmail: !!urlParamsObj.userEmail,
      hasUserName: !!urlParamsObj.userName,
      hasUserId: !!urlParamsObj.userId,
      hasUserPicture: !!urlParamsObj.userPicture,
      hasUserSession: !!localStorageObj.userSession,
      hasOAuthSession: !!localStorageObj.oauthSession,
      isCompleteOAuthFlow: urlParamsObj.oauth === 'success' && 
                          urlParamsObj.provider && 
                          urlParamsObj.session && 
                          urlParamsObj.userEmail
    };
    setDebugInfo(analysis);

  }, []);

  const testOAuthFlow = () => {
    window.location.href = '/api/auth/oauth/google';
  };

  const clearSessions = () => {
    localStorage.removeItem('userSession');
    localStorage.removeItem('oauthSession');
    localStorage.removeItem('signupEmail');
    window.location.reload();
  };

  const simulateOAuthCallback = () => {
    const testUrl = new URL(window.location.origin + '/user/dashboard');
    testUrl.searchParams.set('oauth', 'success');
    testUrl.searchParams.set('provider', 'google');
    testUrl.searchParams.set('session', 'test-session-' + Date.now());
    testUrl.searchParams.set('userEmail', 'test@example.com');
    testUrl.searchParams.set('userName', 'Test User');
    testUrl.searchParams.set('userId', 'test-user-id');
    testUrl.searchParams.set('userPicture', 'https://via.placeholder.com/150');
    
    window.location.href = testUrl.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 OAuth Flow Debug Tool</h1>
          
          {/* OAuth Flow Analysis */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">OAuth Flow Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border ${
                debugInfo.isOAuthCallback ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <h3 className="font-medium text-gray-700 mb-2">OAuth Callback Status</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Is OAuth Callback:</span>
                    <span className={debugInfo.isOAuthCallback ? 'text-green-600' : 'text-gray-600'}>
                      {debugInfo.isOAuthCallback ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Has Provider:</span>
                    <span className={debugInfo.hasProvider ? 'text-green-600' : 'text-red-600'}>
                      {debugInfo.hasProvider ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Has Session:</span>
                    <span className={debugInfo.hasSession ? 'text-green-600' : 'text-red-600'}>
                      {debugInfo.hasSession ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Has User Email:</span>
                    <span className={debugInfo.hasUserEmail ? 'text-green-600' : 'text-red-600'}>
                      {debugInfo.hasUserEmail ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Complete OAuth Flow:</span>
                    <span className={debugInfo.isCompleteOAuthFlow ? 'text-green-600' : 'text-red-600'}>
                      {debugInfo.isCompleteOAuthFlow ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${
                debugInfo.hasUserSession ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <h3 className="font-medium text-gray-700 mb-2">Session Storage</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>User Session:</span>
                    <span className={debugInfo.hasUserSession ? 'text-green-600' : 'text-red-600'}>
                      {debugInfo.hasUserSession ? '✅ Stored' : '❌ Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>OAuth Session:</span>
                    <span className={debugInfo.hasOAuthSession ? 'text-green-600' : 'text-gray-600'}>
                      {debugInfo.hasOAuthSession ? '✅ Stored' : '❌ Missing'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* URL Parameters */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">URL Parameters</h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify(urlParams, null, 2)}
              </pre>
            </div>
          </div>

          {/* LocalStorage Data */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">LocalStorage Data</h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify(localStorageData, null, 2)}
              </pre>
            </div>
          </div>

          {/* Environment Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Environment Info</h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify(environment, null, 2)}
              </pre>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={testOAuthFlow}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🧪 Test OAuth Flow
            </button>
            
            <button
              onClick={simulateOAuthCallback}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              🔄 Simulate OAuth Callback
            </button>
            
            <button
              onClick={clearSessions}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              🗑️ Clear Sessions
            </button>
            
            <button
              onClick={() => window.location.href = '/user/dashboard'}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              📊 Go to Dashboard
            </button>
          </div>

          {/* Recommendations */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">🔧 Troubleshooting Tips</h3>
            <div className="text-sm text-yellow-700 space-y-2">
              <p><strong>If OAuth is not working:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Check that all URL parameters are present</li>
                <li>Verify localStorage is storing user data</li>
                <li>Check browser console for errors</li>
                <li>Test in incognito mode</li>
                <li>Clear browser cache and cookies</li>
              </ul>
              <p><strong>If redirecting to signin instead of dashboard:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Check that userSession is stored in localStorage</li>
                <li>Verify the auth context is reading the session</li>
                <li>Check for JavaScript errors in console</li>
                <li>Try the "Simulate OAuth Callback" button</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
