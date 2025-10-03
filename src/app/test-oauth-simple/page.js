'use client';

import { useState } from 'react';
import { authHelpers } from '../../lib/supabase';

export default function TestOAuthSimple() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const testGoogleOAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('Testing Google OAuth...');
      await authHelpers.signInWithGoogle();
      setSuccess('Google OAuth initiated successfully! Check the console for redirect.');
    } catch (error) {
      console.error('Google OAuth test failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const testGithubOAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('Testing GitHub OAuth...');
      await authHelpers.signInWithGithub();
      setSuccess('GitHub OAuth initiated successfully! Check the console for redirect.');
    } catch (error) {
      console.error('GitHub OAuth test failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Simple OAuth Test
          </h1>
          
          <div className="space-y-6">
            {/* Status Messages */}
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

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <div className="mt-2 text-sm text-green-700">{success}</div>
                  </div>
                </div>
              </div>
            )}

            {/* OAuth Test Buttons */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Google OAuth Test</h2>
                <button
                  onClick={testGoogleOAuth}
                  disabled={loading}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Test Google OAuth</span>
                    </>
                  )}
                </button>
              </div>

              <div className="border rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">GitHub OAuth Test</h2>
                <button
                  onClick={testGithubOAuth}
                  disabled={loading}
                  className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      <span>Test GitHub OAuth</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Environment Check */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Google Client ID:</span>
                  <span className={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'text-green-600' : 'text-red-600'}>
                    {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GitHub Client ID:</span>
                  <span className={process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ? 'text-green-600' : 'text-red-600'}>
                    {process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ? '✅ Set' : '❌ Missing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Database URL:</span>
                  <span className={process.env.DATABASE_URL ? 'text-green-600' : 'text-red-600'}>
                    {process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h2 className="text-xl font-semibold mb-4">Instructions</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Make sure your environment variables are set in <code>.env.local</code></li>
                <li>Click the OAuth buttons to test the authentication flow</li>
                <li>Check the browser console for any error messages</li>
                <li>If successful, you should be redirected to the OAuth provider</li>
                <li>After authorization, you'll be redirected back to the callback URL</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

