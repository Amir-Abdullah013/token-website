'use client';

import { useState, useEffect } from 'react';

export default function TestVercelOAuth() {
  const [environment, setEnvironment] = useState({});
  const [oauthConfig, setOAuthConfig] = useState({});
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    // Get environment information
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_NEXTAUTH_URL: process.env.NEXT_PUBLIC_NEXTAUTH_URL,
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      currentUrl: typeof window !== 'undefined' ? window.location.origin : 'N/A'
    };
    setEnvironment(env);

    // Calculate OAuth configuration
    const baseUrl = env.VERCEL_URL ? `https://${env.VERCEL_URL}` : 
                   env.NEXT_PUBLIC_NEXTAUTH_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    const config = {
      baseUrl,
      oauthCallback: `${baseUrl}/api/auth/oauth-callback`,
      googleOAuthUrl: `${baseUrl}/api/auth/oauth/google`,
      signinUrl: `${baseUrl}/auth/signin`,
      dashboardUrl: `${baseUrl}/user/dashboard`,
      hasClientId: !!env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    };
    setOAuthConfig(config);
  }, []);

  const testGoogleOAuth = async () => {
    try {
      setTestResults(prev => ({ ...prev, oauth: 'Testing...' }));
      
      // Test the OAuth URL
      const response = await fetch(oauthConfig.googleOAuthUrl, {
        method: 'GET',
        redirect: 'manual'
      });
      
      if (response.ok || response.status === 0) {
        setTestResults(prev => ({ ...prev, oauth: '✅ OAuth URL accessible' }));
      } else {
        setTestResults(prev => ({ ...prev, oauth: `❌ OAuth URL error: ${response.status}` }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, oauth: `❌ OAuth test failed: ${error.message}` }));
    }
  };

  const testCallbackUrl = async () => {
    try {
      setTestResults(prev => ({ ...prev, callback: 'Testing...' }));
      
      // Test the callback URL
      const response = await fetch(oauthConfig.oauthCallback, {
        method: 'GET',
        redirect: 'manual'
      });
      
      if (response.ok || response.status === 0) {
        setTestResults(prev => ({ ...prev, callback: '✅ Callback URL accessible' }));
      } else {
        setTestResults(prev => ({ ...prev, callback: `❌ Callback URL error: ${response.status}` }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, callback: `❌ Callback test failed: ${error.message}` }));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Vercel OAuth Test</h1>
          
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
                  <span>Vercel URL:</span>
                  <span className={environment.VERCEL_URL ? 'text-green-600' : 'text-red-600'}>
                    {environment.VERCEL_URL ? '✅ Set' : '❌ Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Google Client ID:</span>
                  <span className={oauthConfig.hasClientId ? 'text-green-600' : 'text-red-600'}>
                    {oauthConfig.hasClientId ? '✅ Set' : '❌ Missing'}
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
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1">{oauthConfig.baseUrl}</code>
                    <button 
                      onClick={() => copyToClipboard(oauthConfig.baseUrl)}
                      className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs hover:bg-green-300"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div>
                  <span className="font-medium">OAuth Callback:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1">{oauthConfig.oauthCallback}</code>
                    <button 
                      onClick={() => copyToClipboard(oauthConfig.oauthCallback)}
                      className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs hover:bg-green-300"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">OAuth URL Test</h3>
                <p className="text-sm text-gray-600 mb-3">{testResults.oauth || 'Not tested yet'}</p>
                <button
                  onClick={testGoogleOAuth}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Test OAuth URL
                </button>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Callback URL Test</h3>
                <p className="text-sm text-gray-600 mb-3">{testResults.callback || 'Not tested yet'}</p>
                <button
                  onClick={testCallbackUrl}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Test Callback URL
                </button>
              </div>
            </div>
          </div>

          {/* Google Cloud Console Instructions */}
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-3">🔧 Google Cloud Console Setup</h3>
            <div className="text-sm text-red-700 space-y-2">
              <p><strong>1. Go to:</strong> <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></p>
              <p><strong>2. Navigate to:</strong> APIs & Services → Credentials</p>
              <p><strong>3. Edit your OAuth 2.0 Client ID</strong></p>
              <p><strong>4. Add to Authorized JavaScript origins:</strong></p>
              <div className="ml-4 space-y-1">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs block">{oauthConfig.baseUrl}</code>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs block">http://localhost:3000</code>
              </div>
              <p><strong>5. Add to Authorized redirect URIs:</strong></p>
              <div className="ml-4 space-y-1">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs block">{oauthConfig.oauthCallback}</code>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs block">http://localhost:3000/api/auth/oauth-callback</code>
              </div>
              <p><strong>6. Save and wait 5-10 minutes</strong></p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => window.location.href = oauthConfig.googleOAuthUrl}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Test Google OAuth Flow
            </button>
            
            <button
              onClick={() => window.location.href = '/auth/signin'}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Go to Sign In Page
            </button>
            
            <button
              onClick={() => window.location.href = '/debug-oauth-vercel'}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Open Debug Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';

