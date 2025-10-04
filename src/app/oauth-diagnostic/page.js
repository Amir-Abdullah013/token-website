'use client';

import { useState, useEffect } from 'react';

export default function OAuthDiagnostic() {
  const [diagnostics, setDiagnostics] = useState({});
  const [environment, setEnvironment] = useState({});
  const [oauthUrls, setOauthUrls] = useState({});
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const loadOAuthConfig = async () => {
      try {
        // Get server-side OAuth configuration
        const response = await fetch('/api/oauth-config');
        const data = await response.json();
        
        if (data.success) {
          setOauthUrls(data.config);
          setEnvironment(data.config.environment);
          
          // Generate recommendations based on server config
          const recs = [];
          const env = data.config.environment;
          
          // Update environment with server data for consistency
          setEnvironment(prev => ({
            ...prev,
            ...env,
            // Use server-side data for accurate detection
            NEXT_PUBLIC_GOOGLE_CLIENT_ID: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            NEXT_PUBLIC_NEXTAUTH_URL: env.NEXT_PUBLIC_NEXTAUTH_URL,
            VERCEL_URL: env.VERCEL_URL
          }));
          
          if (env.isVercel) {
            recs.push({
              type: 'success',
              title: 'Vercel Environment Detected',
              message: `Your app is running on Vercel with URL: ${data.config.baseUrl}`,
              action: 'Use this URL in Google Cloud Console'
            });
          } else {
            recs.push({
              type: 'warning',
              title: 'Local Development',
              message: 'Running in development mode',
              action: 'Use localhost URLs for testing'
            });
          }

          if (!env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
            recs.push({
              type: 'error',
              title: 'Missing Google Client ID',
              message: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set',
              action: 'Add your Google Client ID to environment variables'
            });
          } else {
            recs.push({
              type: 'success',
              title: 'Google Client ID Found',
              message: 'OAuth client configuration is present',
              action: 'Verify redirect URI matches exactly'
            });
          }

          setRecommendations(recs);
        } else {
          throw new Error(data.error || 'Failed to load OAuth config');
        }
      } catch (error) {
        console.error('Failed to load OAuth config:', error);
        
        // Fallback to client-side detection
        const env = {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL_URL: process.env.VERCEL_URL,
          NEXT_PUBLIC_NEXTAUTH_URL: process.env.NEXT_PUBLIC_NEXTAUTH_URL,
          NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          currentUrl: typeof window !== 'undefined' ? window.location.origin : 'N/A',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
          timestamp: new Date().toISOString()
        };
        setEnvironment(env);

        // Calculate all possible OAuth URLs with better fallback logic
        let baseUrl;
        
        // Priority 1: NEXT_PUBLIC_NEXTAUTH_URL (most reliable for client-side)
        if (env.NEXT_PUBLIC_NEXTAUTH_URL) {
          baseUrl = env.NEXT_PUBLIC_NEXTAUTH_URL;
        }
        // Priority 2: VERCEL_URL (server-side only)
        else if (env.VERCEL_URL) {
          baseUrl = `https://${env.VERCEL_URL}`;
        }
        // Priority 3: Current window location (client-side fallback)
        else if (typeof window !== 'undefined') {
          baseUrl = window.location.origin;
        }
        // Priority 4: Development fallback
        else {
          baseUrl = 'http://localhost:3000';
        }

        const urls = {
          baseUrl,
          oauthCallback: `${baseUrl}/api/auth/oauth-callback`,
          googleOAuth: `${baseUrl}/api/auth/oauth/google`,
          signinUrl: `${baseUrl}/auth/signin`,
          dashboardUrl: `${baseUrl}/user/dashboard`,
          // Alternative possible URLs
          alternativeCallback1: `${baseUrl}/api/auth/callback/google`,
          alternativeCallback2: `${baseUrl}/api/auth/oauth-callback`,
          alternativeCallback3: `${baseUrl}/auth/callback`
        };
        setOauthUrls(urls);
        
        // Generate recommendations for fallback
        const recs = [];
        
        if (env.VERCEL_URL) {
          recs.push({
            type: 'success',
            title: 'Vercel Environment Detected',
            message: `Your app is running on Vercel with URL: ${baseUrl}`,
            action: 'Use this URL in Google Cloud Console'
          });
        } else {
          recs.push({
            type: 'warning',
            title: 'Local Development',
            message: 'Running in development mode',
            action: 'Use localhost URLs for testing'
          });
        }

        if (!env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
          recs.push({
            type: 'error',
            title: 'Missing Google Client ID',
            message: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set',
            action: 'Add your Google Client ID to environment variables'
          });
        } else {
          recs.push({
            type: 'success',
            title: 'Google Client ID Found',
            message: 'OAuth client configuration is present',
            action: 'Verify redirect URI matches exactly'
          });
        }

        setRecommendations(recs);
      }
    };

    loadOAuthConfig();

  }, []);

  const testOAuthFlow = async () => {
    try {
      // Test the OAuth initiation
      const response = await fetch(oauthUrls.googleOAuth, {
        method: 'GET',
        redirect: 'manual'
      });
      
      if (response.status === 0 || response.ok) {
        alert('✅ OAuth URL is accessible! Redirecting to Google...');
        window.location.href = oauthUrls.googleOAuth;
      } else {
        alert(`❌ OAuth URL returned status: ${response.status}`);
      }
    } catch (error) {
      alert(`❌ OAuth test failed: ${error.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const generateGoogleConsoleInstructions = () => {
    const instructions = `
GOOGLE CLOUD CONSOLE SETUP INSTRUCTIONS:

1. Go to: https://console.cloud.google.com/
2. Navigate to: APIs & Services → Credentials
3. Find your OAuth 2.0 Client ID and click Edit (pencil icon)
4. Update the following fields:

AUTHORIZED JAVASCRIPT ORIGINS:
${oauthUrls.baseUrl}
http://localhost:3000

AUTHORIZED REDIRECT URIS:
${oauthUrls.oauthCallback}
http://localhost:3000/api/auth/oauth-callback

5. Click SAVE
6. Wait 5-10 minutes for changes to propagate
7. Test the OAuth flow again

IMPORTANT NOTES:
- Make sure there are NO trailing slashes in URLs
- URLs must match EXACTLY (case-sensitive)
- Wait for Google's cache to update (5-10 minutes)
- Test in incognito/private browsing mode
    `;
    
    navigator.clipboard.writeText(instructions);
    alert('Google Console instructions copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 OAuth Diagnostic Tool</h1>
          
          {/* Environment Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-3">Environment Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span className={environment.NODE_ENV === 'production' ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                    {environment.NODE_ENV}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Vercel URL:</span>
                  <span className={environment.VERCEL_URL ? 'text-green-600 font-medium' : 'text-red-600'}>
                    {environment.VERCEL_URL || 'Not detected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current URL:</span>
                  <span className="text-gray-600">{environment.currentUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span>Google Client ID:</span>
                  <span className={diagnostics.hasClientId ? 'text-green-600 font-medium' : 'text-red-600'}>
                    {diagnostics.hasClientId ? '✅ Set' : '❌ Missing'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-3">OAuth URLs</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Base URL:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1 break-all">{oauthUrls.baseUrl}</code>
                    <button 
                      onClick={() => copyToClipboard(oauthUrls.baseUrl)}
                      className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs hover:bg-green-300"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Redirect URI:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1 break-all">{oauthUrls.oauthCallback}</code>
                    <button 
                      onClick={() => copyToClipboard(oauthUrls.oauthCallback)}
                      className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs hover:bg-green-300"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Recommendations</h2>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  rec.type === 'success' ? 'bg-green-50 border-green-200' :
                  rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 mr-3 ${
                      rec.type === 'success' ? 'text-green-600' :
                      rec.type === 'warning' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {rec.type === 'success' ? '✅' : rec.type === 'warning' ? '⚠️' : '❌'}
                    </div>
                    <div>
                      <h4 className={`font-medium ${
                        rec.type === 'success' ? 'text-green-800' :
                        rec.type === 'warning' ? 'text-yellow-800' :
                        'text-red-800'
                      }`}>{rec.title}</h4>
                      <p className={`text-sm mt-1 ${
                        rec.type === 'success' ? 'text-green-700' :
                        rec.type === 'warning' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>{rec.message}</p>
                      <p className={`text-xs mt-2 font-medium ${
                        rec.type === 'success' ? 'text-green-600' :
                        rec.type === 'warning' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>Action: {rec.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Google Cloud Console Instructions */}
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-3">🔧 Google Cloud Console Fix</h3>
            <div className="text-sm text-red-700 space-y-3">
              <p><strong>Step 1:</strong> Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></p>
              <p><strong>Step 2:</strong> Navigate to APIs & Services → Credentials</p>
              <p><strong>Step 3:</strong> Find your OAuth 2.0 Client ID and click Edit</p>
              <p><strong>Step 4:</strong> Add these EXACT URLs:</p>
              
              <div className="ml-4 space-y-2">
                <div>
                  <p className="font-medium">Authorized JavaScript origins:</p>
                  <div className="bg-gray-100 p-2 rounded text-xs font-mono">
                    {oauthUrls.baseUrl}<br/>
                    http://localhost:3000
                  </div>
                </div>
                <div>
                  <p className="font-medium">Authorized redirect URIs:</p>
                  <div className="bg-gray-100 p-2 rounded text-xs font-mono">
                    {oauthUrls.oauthCallback}<br/>
                    http://localhost:3000/api/auth/oauth-callback
                  </div>
                </div>
              </div>
              
              <p><strong>Step 5:</strong> Save and wait 5-10 minutes</p>
              <p><strong>Step 6:</strong> Test in incognito mode</p>
            </div>
            
            <button
              onClick={generateGoogleConsoleInstructions}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
            >
              📋 Copy Instructions to Clipboard
            </button>
          </div>

          {/* Test Actions */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={testOAuthFlow}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🧪 Test OAuth Flow
            </button>
            
            <button
              onClick={() => window.location.href = '/auth/signin'}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              🔐 Go to Sign In
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Debug Information */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">🐛 Debug Information</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Timestamp:</strong> {environment.timestamp}</p>
              <p><strong>User Agent:</strong> {environment.userAgent}</p>
              <p><strong>Current URL:</strong> {environment.currentUrl}</p>
              <p><strong>Redirect URI:</strong> {oauthUrls.oauthCallback}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
