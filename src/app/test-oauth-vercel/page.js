'use client';

import { useState, useEffect } from 'react';

export default function TestOAuthVercel() {
  const [testResults, setTestResults] = useState({});
  const [environment, setEnvironment] = useState({});
  const [sessionData, setSessionData] = useState({});

  useEffect(() => {
    // Get environment information
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_NEXTAUTH_URL: process.env.NEXT_PUBLIC_NEXTAUTH_URL,
      currentUrl: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search
    };
    setEnvironment(env);

    // Get session data
    const sessions = {
      userSession: localStorage.getItem('userSession'),
      oauthSession: localStorage.getItem('oauthSession'),
      signupEmail: localStorage.getItem('signupEmail')
    };
    setSessionData(sessions);

    // Run OAuth flow tests
    runOAuthTests();
  }, []);

  const runOAuthTests = async () => {
    const results = {};

    // Test 1: Environment Variables
    results.environment = {
      hasNextAuthUrl: !!process.env.NEXT_PUBLIC_NEXTAUTH_URL,
      hasVercelUrl: !!process.env.VERCEL_URL,
      isProduction: process.env.NODE_ENV === 'production',
      currentUrl: window.location.origin
    };

    // Test 2: OAuth URLs
    const baseUrl = process.env.NEXT_PUBLIC_NEXTAUTH_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : window.location.origin);
    
    results.urls = {
      baseUrl,
      oauthCallback: `${baseUrl}/api/auth/oauth-callback`,
      oauthSuccess: `${baseUrl}/auth/oauth-success`,
      dashboard: `${baseUrl}/user/dashboard`,
      signin: `${baseUrl}/auth/signin`
    };

    // Test 3: Session Status
    results.sessions = {
      hasUserSession: !!sessionData.userSession,
      hasOAuthSession: !!sessionData.oauthSession,
      userSessionValid: false,
      oauthSessionValid: false
    };

    try {
      if (sessionData.userSession) {
        const userData = JSON.parse(sessionData.userSession);
        results.sessions.userSessionValid = !!(userData.email && userData.name);
        results.sessions.userData = userData;
      }
    } catch (error) {
      console.error('Error parsing user session:', error);
    }

    try {
      if (sessionData.oauthSession) {
        const oauthData = JSON.parse(sessionData.oauthSession);
        results.sessions.oauthSessionValid = !!(oauthData.provider && oauthData.session);
        results.sessions.oauthData = oauthData;
      }
    } catch (error) {
      console.error('Error parsing OAuth session:', error);
    }

    // Test 4: OAuth Flow Simulation
    results.oauthFlow = {
      step1: 'OAuth initiation',
      step2: 'Google authentication',
      step3: 'OAuth callback',
      step4: 'Session storage',
      step5: 'Dashboard redirect',
      currentStep: 'Ready to test'
    };

    setTestResults(results);
  };

  const testOAuthFlow = () => {
    window.location.href = '/api/auth/oauth/google';
  };

  const simulateOAuthSuccess = () => {
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
    localStorage.removeItem('signupEmail');
    window.location.reload();
  };

  const goToDashboard = () => {
    window.location.href = '/user/dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🧪 OAuth Vercel Test</h1>
          
          {/* Environment Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-3">Environment Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span className={environment.NODE_ENV === 'production' ? 'text-green-600' : 'text-yellow-600'}>
                    {environment.NODE_ENV}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>NextAuth URL:</span>
                  <span className={testResults.environment?.hasNextAuthUrl ? 'text-green-600' : 'text-red-600'}>
                    {testResults.environment?.hasNextAuthUrl ? '✅ Set' : '❌ Missing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Vercel URL:</span>
                  <span className={testResults.environment?.hasVercelUrl ? 'text-green-600' : 'text-gray-600'}>
                    {testResults.environment?.hasVercelUrl ? '✅ Set' : '❌ Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current URL:</span>
                  <span className="text-gray-600">{environment.currentUrl}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-3">OAuth URLs</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Base URL:</span>
                  <div className="text-xs text-gray-600 break-all">{testResults.urls?.baseUrl}</div>
                </div>
                <div>
                  <span className="font-medium">OAuth Callback:</span>
                  <div className="text-xs text-gray-600 break-all">{testResults.urls?.oauthCallback}</div>
                </div>
                <div>
                  <span className="font-medium">OAuth Success:</span>
                  <div className="text-xs text-gray-600 break-all">{testResults.urls?.oauthSuccess}</div>
                </div>
                <div>
                  <span className="font-medium">Dashboard:</span>
                  <div className="text-xs text-gray-600 break-all">{testResults.urls?.dashboard}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Session Status */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Session Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border ${
                testResults.sessions?.hasUserSession && testResults.sessions?.userSessionValid ? 
                'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <h3 className="font-medium text-gray-700 mb-2">User Session</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Exists:</span>
                    <span className={testResults.sessions?.hasUserSession ? 'text-green-600' : 'text-red-600'}>
                      {testResults.sessions?.hasUserSession ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valid:</span>
                    <span className={testResults.sessions?.userSessionValid ? 'text-green-600' : 'text-red-600'}>
                      {testResults.sessions?.userSessionValid ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  {testResults.sessions?.userData && (
                    <div className="text-xs text-gray-600">
                      <div>Email: {testResults.sessions.userData.email}</div>
                      <div>Name: {testResults.sessions.userData.name}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${
                testResults.sessions?.hasOAuthSession && testResults.sessions?.oauthSessionValid ? 
                'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <h3 className="font-medium text-gray-700 mb-2">OAuth Session</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Exists:</span>
                    <span className={testResults.sessions?.hasOAuthSession ? 'text-green-600' : 'text-gray-600'}>
                      {testResults.sessions?.hasOAuthSession ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valid:</span>
                    <span className={testResults.sessions?.oauthSessionValid ? 'text-green-600' : 'text-gray-600'}>
                      {testResults.sessions?.oauthSessionValid ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  {testResults.sessions?.oauthData && (
                    <div className="text-xs text-gray-600">
                      <div>Provider: {testResults.sessions.oauthData.provider}</div>
                      <div>Session: {testResults.sessions.oauthData.session?.substring(0, 10)}...</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={testOAuthFlow}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🧪 Test OAuth Flow
            </button>
            
            <button
              onClick={simulateOAuthSuccess}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              🔄 Simulate OAuth Success
            </button>
            
            <button
              onClick={goToDashboard}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              📊 Go to Dashboard
            </button>
            
            <button
              onClick={clearSessions}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              🗑️ Clear Sessions
            </button>
          </div>

          {/* OAuth Flow Steps */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">OAuth Flow Steps</h2>
            <div className="space-y-2">
              {Object.entries(testResults.oauthFlow || {}).map(([key, value]) => (
                <div key={key} className="flex items-center p-2 bg-gray-50 rounded">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">🔧 Troubleshooting</h3>
            <div className="text-sm text-yellow-700 space-y-2">
              <p><strong>If OAuth redirects to signin instead of dashboard:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Check that NEXT_PUBLIC_NEXTAUTH_URL is set in Vercel</li>
                <li>Verify Google Cloud Console has correct redirect URIs</li>
                <li>Clear browser cache and cookies</li>
                <li>Test in incognito mode</li>
                <li>Use the "Simulate OAuth Success" button to test</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
