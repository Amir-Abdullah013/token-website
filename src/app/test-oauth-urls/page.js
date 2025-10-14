'use client';

import { useState } from 'react';

export default function TestOAuthUrls() {
  const [googleUrl, setGoogleUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testGoogleOAuth = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/oauth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get Google OAuth URL');
      }

      const data = await response.json();
      setGoogleUrl(data.url);
      console.log('Google OAuth URL:', data.url);
    } catch (err) {
      console.error('Error testing Google OAuth:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testGithubOAuth = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/oauth/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get GitHub OAuth URL');
      }

      const data = await response.json();
      setGithubUrl(data.url);
      console.log('GitHub OAuth URL:', data.url);
    } catch (err) {
      console.error('Error testing GitHub OAuth:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testGoogleUrl = () => {
    if (googleUrl) {
      window.open(googleUrl, '_blank');
    }
  };

  const testGithubUrl = () => {
    if (githubUrl) {
      window.open(githubUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            OAuth URL Test
          </h1>
          
          <div className="space-y-6">
            {/* Google OAuth Test */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Google OAuth Test</h2>
              <div className="space-y-4">
                <button
                  onClick={testGoogleOAuth}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test Google OAuth URL'}
                </button>
                
                {googleUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Generated URL:</p>
                    <div className="bg-gray-100 p-3 rounded text-sm break-all">
                      {googleUrl}
                    </div>
                    <button
                      onClick={testGoogleUrl}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Test URL in New Tab
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* GitHub OAuth Test */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">GitHub OAuth Test</h2>
              <div className="space-y-4">
                <button
                  onClick={testGithubOAuth}
                  disabled={loading}
                  className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test GitHub OAuth URL'}
                </button>
                
                {githubUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Generated URL:</p>
                    <div className="bg-gray-100 p-3 rounded text-sm break-all">
                      {githubUrl}
                    </div>
                    <button
                      onClick={testGithubUrl}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Test URL in New Tab
                    </button>
                  </div>
                )}
              </div>
            </div>

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

            {/* Instructions */}
            <div className="border rounded-lg p-4 bg-yellow-50">
              <h2 className="text-xl font-semibold mb-4">Instructions</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click "Test Google OAuth URL" to generate the Google OAuth URL</li>
                <li>Click "Test URL in New Tab" to test if the URL works</li>
                <li>If the URL works, you should see the Google OAuth page</li>
                <li>If you get a 404 error, check your Google OAuth app configuration</li>
                <li>Make sure your redirect URI is set to: <code>http://localhost:3000/api/auth/callback/google</code></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';


