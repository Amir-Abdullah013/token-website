'use client';

import { useState, useEffect } from 'react';

export default function DebugOAuthRedirect() {
  const [oauthUrl, setOauthUrl] = useState('');
  const [parsedUrl, setParsedUrl] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const testOAuth = async () => {
      try {
        const response = await fetch('/api/auth/oauth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get OAuth URL');
        }

        const data = await response.json();
        setOauthUrl(data.url);
        
        // Parse the URL to extract parameters
        const url = new URL(data.url);
        const params = new URLSearchParams(url.search);
        
        setParsedUrl({
          clientId: params.get('client_id'),
          redirectUri: decodeURIComponent(params.get('redirect_uri')),
          scope: params.get('scope'),
          responseType: params.get('response_type'),
          state: params.get('state'),
          accessType: params.get('access_type'),
          prompt: params.get('prompt')
        });

      } catch (err) {
        console.error('Error testing OAuth:', err);
        setError(err.message);
      }
    };

    testOAuth();
  }, []);

  const testOAuthUrl = () => {
    if (oauthUrl) {
      window.open(oauthUrl, '_blank');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            OAuth Redirect URI Debug Tool
          </h1>
          
          <div className="space-y-6">
            {/* Current Configuration */}
            {parsedUrl && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h2 className="text-xl font-semibold mb-4 text-blue-900">Current OAuth Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Client ID:</label>
                    <div className="bg-white p-2 rounded border text-sm break-all">
                      {parsedUrl.clientId}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Redirect URI:</label>
                    <div className="bg-white p-2 rounded border text-sm break-all">
                      {parsedUrl.redirectUri}
                    </div>
                    <button
                      onClick={() => copyToClipboard(parsedUrl.redirectUri)}
                      className="mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      Copy
                    </button>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Scope:</label>
                    <div className="bg-white p-2 rounded border text-sm">
                      {parsedUrl.scope}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Response Type:</label>
                    <div className="bg-white p-2 rounded border text-sm">
                      {parsedUrl.responseType}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Full OAuth URL */}
            {oauthUrl && (
              <div className="border rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Complete OAuth URL</h2>
                <div className="space-y-4">
                  <div className="bg-gray-100 p-3 rounded text-sm break-all">
                    {oauthUrl}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={testOAuthUrl}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Test OAuth URL
                    </button>
                    <button
                      onClick={() => copyToClipboard(oauthUrl)}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>
              </div>
            )}

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

            {/* Google OAuth App Configuration */}
            <div className="border rounded-lg p-4 bg-yellow-50">
              <h2 className="text-xl font-semibold mb-4 text-yellow-900">Google OAuth App Configuration</h2>
              <div className="space-y-4">
                <div className="bg-yellow-100 p-4 rounded">
                  <h3 className="font-medium text-yellow-900 mb-2">CRITICAL: Add this exact redirect URI to your Google OAuth app:</h3>
                  <div className="bg-white p-3 rounded border-2 border-yellow-300">
                    <code className="text-sm font-mono">{parsedUrl?.redirectUri || 'Loading...'}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(parsedUrl?.redirectUri || '')}
                    className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                  >
                    Copy Redirect URI
                  </button>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Step-by-Step Instructions:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                    <li>Select your project</li>
                    <li>Go to "APIs & Services" → "Credentials"</li>
                    <li>Click on your OAuth 2.0 Client ID</li>
                    <li>In "Authorized redirect URIs" section, click "ADD URI"</li>
                    <li>Paste the redirect URI shown above: <code className="bg-gray-200 px-1 rounded">{parsedUrl?.redirectUri}</code></li>
                    <li>In "Authorized JavaScript origins" section, add: <code className="bg-gray-200 px-1 rounded">http://localhost:3000</code></li>
                    <li>Click "SAVE"</li>
                    <li>Wait 2-3 minutes for changes to propagate</li>
                    <li>Test the OAuth URL again</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Common Issues */}
            <div className="border rounded-lg p-4 bg-red-50">
              <h2 className="text-xl font-semibold mb-4 text-red-900">Common Issues & Solutions</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-red-900">Issue: redirect_uri_mismatch</h4>
                  <p className="text-gray-700">The redirect URI in your Google OAuth app doesn't match what we're sending.</p>
                  <p className="text-gray-700"><strong>Solution:</strong> Add the exact redirect URI shown above to your Google OAuth app.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-red-900">Issue: Using wrong protocol</h4>
                  <p className="text-gray-700">Make sure you're using <code className="bg-gray-200 px-1 rounded">http://</code> not <code className="bg-gray-200 px-1 rounded">https://</code> for localhost.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-red-900">Issue: Extra or missing slashes</h4>
                  <p className="text-gray-700">Make sure the redirect URI is exactly: <code className="bg-gray-200 px-1 rounded">http://localhost:3000/api/auth/oauth-callback</code></p>
                </div>
                
                <div>
                  <h4 className="font-medium text-red-900">Issue: Changes not taking effect</h4>
                  <p className="text-gray-700">Google OAuth changes can take 2-3 minutes to propagate. Wait and try again.</p>
                </div>
              </div>
            </div>

            {/* Test Results */}
            <div className="border rounded-lg p-4 bg-green-50">
              <h2 className="text-xl font-semibold mb-4 text-green-900">Test Results</h2>
              <div className="space-y-2 text-sm">
                <p>After updating your Google OAuth app configuration:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click "Test OAuth URL" button above</li>
                  <li>You should see the Google OAuth page (not an error)</li>
                  <li>You should be able to select your Google account</li>
                  <li>After authentication, you should be redirected back to your app</li>
                </ol>
                <p className="text-green-700 font-medium mt-3">
                  If you still get redirect_uri_mismatch, double-check that the redirect URI in your Google OAuth app matches exactly what's shown above.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';
export const ssr = false;

