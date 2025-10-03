'use client';

import { useState, useEffect } from 'react';

export default function TestOAuthConfig() {
  const [config, setConfig] = useState(null);
  const [googleUrl, setGoogleUrl] = useState('');
  const [alternativeUrl, setAlternativeUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const checkConfig = async () => {
      try {
        // Test Google OAuth configuration
        const response = await fetch('/api/auth/oauth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get Google OAuth configuration');
        }

        const data = await response.json();
        setGoogleUrl(data.url);
        
        // Parse the URL to show configuration details
        const url = new URL(data.url);
        const params = new URLSearchParams(url.search);
        
        setConfig({
          clientId: params.get('client_id'),
          redirectUri: params.get('redirect_uri'),
          scope: params.get('scope'),
          responseType: params.get('response_type'),
          state: params.get('state'),
          accessType: params.get('access_type'),
          prompt: params.get('prompt')
        });

        // Test alternative redirect URI
        try {
          const altResponse = await fetch('/api/auth/oauth/google?alternative=true', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (altResponse.ok) {
            const altData = await altResponse.json();
            setAlternativeUrl(altData.url);
          }
        } catch (altErr) {
          console.log('Alternative URL test failed:', altErr);
        }
        
      } catch (err) {
        console.error('Error checking OAuth config:', err);
        setError(err.message);
      }
    };

    checkConfig();
  }, []);

  const testGoogleUrl = () => {
    if (googleUrl) {
      window.open(googleUrl, '_blank');
    }
  };

  const testAlternativeUrl = () => {
    if (alternativeUrl) {
      window.open(alternativeUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            OAuth Configuration Test
          </h1>
          
          <div className="space-y-6">
            {/* Configuration Details */}
            {config && (
              <div className="border rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Current OAuth Configuration</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Client ID:</label>
                    <div className="bg-gray-100 p-2 rounded text-sm break-all">
                      {config.clientId}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Redirect URI:</label>
                    <div className="bg-gray-100 p-2 rounded text-sm break-all">
                      {config.redirectUri}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Scope:</label>
                    <div className="bg-gray-100 p-2 rounded text-sm">
                      {config.scope}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Response Type:</label>
                    <div className="bg-gray-100 p-2 rounded text-sm">
                      {config.responseType}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Access Type:</label>
                    <div className="bg-gray-100 p-2 rounded text-sm">
                      {config.accessType}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Prompt:</label>
                    <div className="bg-gray-100 p-2 rounded text-sm">
                      {config.prompt}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generated URL */}
            {googleUrl && (
              <div className="border rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Generated OAuth URL (Standard)</h2>
                <div className="space-y-4">
                  <div className="bg-gray-100 p-3 rounded text-sm break-all">
                    {googleUrl}
                  </div>
                  <button
                    onClick={testGoogleUrl}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Test Standard OAuth URL
                  </button>
                </div>
              </div>
            )}

            {/* Alternative URL */}
            {alternativeUrl && (
              <div className="border rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Alternative OAuth URL</h2>
                <div className="space-y-4">
                  <div className="bg-gray-100 p-3 rounded text-sm break-all">
                    {alternativeUrl}
                  </div>
                  <button
                    onClick={testAlternativeUrl}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Test Alternative OAuth URL
                  </button>
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

            {/* Google OAuth App Configuration Instructions */}
            <div className="border rounded-lg p-4 bg-yellow-50">
              <h2 className="text-xl font-semibold mb-4">Google OAuth App Configuration</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Required Redirect URIs (add both):</h3>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li><code>http://localhost:3000/api/auth/oauth-callback</code> (primary)</li>
                    <li><code>http://localhost:3000/auth/callback</code> (alternative)</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Note:</strong> Add both redirect URIs to your Google OAuth app to ensure compatibility.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900">Authorized JavaScript Origins:</h3>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li><code>http://localhost:3000</code></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900">Steps to Fix:</h3>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li>Go to <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                    <li>Select your project</li>
                    <li>Go to "APIs & Services" → "Credentials"</li>
                    <li>Click on your OAuth 2.0 Client ID</li>
                    <li>Add the redirect URI: <code>http://localhost:3000/api/auth/oauth-callback</code></li>
                    <li>Add authorized JavaScript origin: <code>http://localhost:3000</code></li>
                    <li>Save the changes</li>
                    <li>Wait a few minutes for changes to propagate</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Error 400: redirect_uri_mismatch</strong></p>
                <p>This means the redirect URI in your Google OAuth app doesn't match what we're sending.</p>
                <p>Make sure your Google OAuth app has the exact redirect URI shown above.</p>
                
                <p className="mt-4"><strong>Common Issues:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Missing <code>/api/auth/oauth-callback</code> in redirect URIs</li>
                  <li>Using <code>https://</code> instead of <code>http://</code> for localhost</li>
                  <li>Extra trailing slash or missing slash</li>
                  <li>Case sensitivity in the path</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}