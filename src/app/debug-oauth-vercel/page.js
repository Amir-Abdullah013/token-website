'use client';

import { useState, useEffect } from 'react';

export default function DebugOAuthVercel() {
  const [config, setConfig] = useState({});
  const [urls, setUrls] = useState({});
  const [environment, setEnvironment] = useState({});

  useEffect(() => {
    // Get current environment info
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_NEXTAUTH_URL: process.env.NEXT_PUBLIC_NEXTAUTH_URL,
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      currentUrl: typeof window !== 'undefined' ? window.location.origin : 'N/A'
    };
    setEnvironment(env);

    // Calculate URLs
    const baseUrl = env.VERCEL_URL ? `https://${env.VERCEL_URL}` : 
                   env.NEXT_PUBLIC_NEXTAUTH_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    const urlConfig = {
      baseUrl,
      oauthCallback: `${baseUrl}/api/auth/oauth-callback`,
      signinUrl: `${baseUrl}/auth/signin`,
      dashboardUrl: `${baseUrl}/user/dashboard`
    };
    setUrls(urlConfig);

    // Get OAuth config
    const oauthConfig = {
      clientId: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      hasClientId: !!env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirectUri: urlConfig.oauthCallback
    };
    setConfig(oauthConfig);
  }, []);

  const testGoogleOAuth = () => {
    window.location.href = '/api/auth/oauth/google';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Vercel OAuth Debug</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Environment Info */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Environment Info</h2>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Current Environment:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>NODE_ENV:</strong> {environment.NODE_ENV}</p>
                  <p><strong>VERCEL_URL:</strong> {environment.VERCEL_URL || 'Not set'}</p>
                  <p><strong>NEXT_PUBLIC_NEXTAUTH_URL:</strong> {environment.NEXT_PUBLIC_NEXTAUTH_URL || 'Not set'}</p>
                  <p><strong>Current URL:</strong> {environment.currentUrl}</p>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">OAuth Configuration:</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Client ID:</strong> {config.hasClientId ? '✅ Set' : '❌ Missing'}</p>
                  <p><strong>Client ID Value:</strong> {config.clientId || 'Not set'}</p>
                </div>
              </div>
            </div>

            {/* URL Configuration */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">URL Configuration</h2>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-2">Generated URLs:</h3>
                <div className="text-sm text-yellow-700 space-y-2">
                  <div>
                    <strong>Base URL:</strong>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1">{urls.baseUrl}</code>
                      <button 
                        onClick={() => copyToClipboard(urls.baseUrl)}
                        className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs hover:bg-yellow-300"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <strong>OAuth Callback:</strong>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1">{urls.oauthCallback}</code>
                      <button 
                        onClick={() => copyToClipboard(urls.oauthCallback)}
                        className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs hover:bg-yellow-300"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Google Cloud Console Instructions */}
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">🔧 Google Cloud Console Setup Required:</h3>
            <div className="text-sm text-red-700 space-y-2">
              <p><strong>1. Go to Google Cloud Console:</strong> <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">https://console.cloud.google.com/</a></p>
              <p><strong>2. Navigate to:</strong> APIs & Services → Credentials</p>
              <p><strong>3. Edit your OAuth 2.0 Client ID</p>
              <p><strong>4. Add these URLs to Authorized JavaScript origins:</strong></p>
              <div className="ml-4">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs block">{urls.baseUrl}</code>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs block">http://localhost:3000</code>
              </div>
              <p><strong>5. Add these URLs to Authorized redirect URIs:</strong></p>
              <div className="ml-4">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs block">{urls.oauthCallback}</code>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs block">http://localhost:3000/api/auth/oauth-callback</code>
              </div>
              <p><strong>6. Save and wait 5-10 minutes for changes to propagate</strong></p>
            </div>
          </div>

          {/* Test Actions */}
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Actions</h2>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={testGoogleOAuth}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Test Google OAuth
              </button>
              
              <button
                onClick={() => window.location.href = '/auth/signin'}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Go to Sign In Page
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Refresh Page
              </button>
            </div>
          </div>

          {/* Status Check */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">✅ Status Check:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
              <li><strong>Environment:</strong> {environment.NODE_ENV === 'production' ? '✅ Production' : '⚠️ Development'}</li>
              <li><strong>Vercel URL:</strong> {environment.VERCEL_URL ? '✅ Detected' : '❌ Not detected'}</li>
              <li><strong>Google Client ID:</strong> {config.hasClientId ? '✅ Set' : '❌ Missing'}</li>
              <li><strong>Base URL:</strong> {urls.baseUrl ? '✅ Generated' : '❌ Error'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
