'use client';

import { useState } from 'react';

export default function TestGoogleConfig() {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alternativeResults, setAlternativeResults] = useState([]);

  const testGoogleOAuth = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      // Test the OAuth URL generation
      const response = await fetch('/api/auth/oauth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate OAuth URL');
      }

      const data = await response.json();
      const url = new URL(data.url);
      const params = new URLSearchParams(url.search);
      
      const redirectUri = decodeURIComponent(params.get('redirect_uri'));
      const clientId = params.get('client_id');
      
      setTestResult({
        success: true,
        redirectUri,
        clientId,
        fullUrl: data.url
      });

      // Test alternative redirect URIs
      const alternatives = [
        { name: 'Standard', url: '/api/auth/oauth/google' },
        { name: 'Auth Callback', url: '/api/auth/oauth/google?alternative=callback' },
        { name: 'Google Callback', url: '/api/auth/oauth/google?alternative=google' }
      ];

      const altResults = [];
      for (const alt of alternatives) {
        try {
          const altResponse = await fetch(alt.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (altResponse.ok) {
            const altData = await altResponse.json();
            const altUrl = new URL(altData.url);
            const altParams = new URLSearchParams(altUrl.search);
            const altRedirectUri = decodeURIComponent(altParams.get('redirect_uri'));
            
            altResults.push({
              name: alt.name,
              redirectUri: altRedirectUri,
              fullUrl: altData.url,
              success: true
            });
          }
        } catch (err) {
          altResults.push({
            name: alt.name,
            success: false,
            error: err.message
          });
        }
      }
      
      setAlternativeResults(altResults);

    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const openOAuthTest = () => {
    if (testResult?.fullUrl) {
      window.open(testResult.fullUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Google OAuth Configuration Test
          </h1>
          
          <div className="space-y-6">
            {/* Test Button */}
            <div className="text-center">
              <button
                onClick={testGoogleOAuth}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing...' : 'Test Google OAuth Configuration'}
              </button>
            </div>

            {/* Test Results */}
            {testResult && (
              <div className="border rounded-lg p-6">
                {testResult.success ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <h2 className="text-xl font-semibold text-green-900">
                        OAuth URL Generated Successfully
                      </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Client ID:</label>
                        <div className="bg-gray-100 p-2 rounded text-sm break-all">
                          {testResult.clientId}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Redirect URI:</label>
                        <div className="bg-gray-100 p-2 rounded text-sm break-all">
                          {testResult.redirectUri}
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <h3 className="font-medium text-yellow-900 mb-2">
                        ⚠️ IMPORTANT: Add this redirect URI to your Google OAuth app
                      </h3>
                      <div className="bg-white p-3 rounded border-2 border-yellow-300">
                        <code className="text-sm font-mono">{testResult.redirectUri}</code>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(testResult.redirectUri)}
                        className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                      >
                        Copy Redirect URI
                      </button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <h3 className="font-medium text-blue-900 mb-2">Test OAuth Flow</h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Click the button below to test if your Google OAuth app is configured correctly:
                      </p>
                      <button
                        onClick={openOAuthTest}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Test OAuth URL
                      </button>
                      <p className="text-xs text-blue-600 mt-2">
                        If you see the Google OAuth page (not an error), your configuration is correct!
                      </p>
                    </div>

                    {/* Alternative Redirect URIs */}
                    {alternativeResults.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Alternative Redirect URIs</h3>
                        <div className="space-y-2">
                          {alternativeResults.map((alt, index) => (
                            <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                              <div>
                                <span className="font-medium text-sm">{alt.name}:</span>
                                <code className="text-xs ml-2">{alt.redirectUri}</code>
                              </div>
                              {alt.success && (
                                <button
                                  onClick={() => window.open(alt.fullUrl, '_blank')}
                                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                                >
                                  Test
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          Try adding any of these redirect URIs to your Google OAuth app if the standard one doesn't work.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <h2 className="text-xl font-semibold text-red-900">
                        OAuth Configuration Error
                      </h2>
                    </div>
                    <p className="text-red-700 mt-2">{testResult.error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h2 className="text-xl font-semibold mb-4">Step-by-Step Instructions</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click "Test Google OAuth Configuration" above</li>
                <li>Copy the redirect URI shown in the results</li>
                <li>Go to <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                <li>Navigate to "APIs & Services" → "Credentials"</li>
                <li>Click on your OAuth 2.0 Client ID</li>
                <li>Add the redirect URI to "Authorized redirect URIs"</li>
                <li>Add <code>http://localhost:3000</code> to "Authorized JavaScript origins"</li>
                <li>Save the changes</li>
                <li>Wait 2-3 minutes for changes to propagate</li>
                <li>Click "Test OAuth URL" to verify the fix</li>
              </ol>
            </div>

            {/* Common Issues */}
            <div className="border rounded-lg p-4 bg-red-50">
              <h2 className="text-xl font-semibold mb-4 text-red-900">Common Issues & Solutions</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-red-900">Still getting redirect_uri_mismatch?</h4>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    <li>Make sure the redirect URI is exactly: <code className="bg-gray-200 px-1 rounded">http://localhost:3000/api/auth/oauth-callback</code></li>
                    <li>Check for extra spaces or characters</li>
                    <li>Ensure you're using <code className="bg-gray-200 px-1 rounded">http://</code> not <code className="bg-gray-200 px-1 rounded">https://</code></li>
                    <li>Wait 2-3 minutes after saving changes</li>
                    <li>Try clearing your browser cache</li>
                  </ul>
                </div>
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