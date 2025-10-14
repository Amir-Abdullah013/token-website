'use client';

import { useState, useEffect } from 'react';

export default function DebugEnvVars() {
  const [envVars, setEnvVars] = useState({});
  const [serverEnvVars, setServerEnvVars] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEnvironmentVariables = async () => {
      try {
        // Get client-side environment variables
        const clientEnv = {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL_URL: process.env.VERCEL_URL,
          NEXT_PUBLIC_NEXTAUTH_URL: process.env.NEXT_PUBLIC_NEXTAUTH_URL,
          NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          NEXT_PUBLIC_GITHUB_CLIENT_ID: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
          currentUrl: window.location.origin,
          timestamp: new Date().toISOString()
        };
        setEnvVars(clientEnv);

        // Get server-side environment variables
        try {
          const response = await fetch('/api/oauth-config');
          const data = await response.json();
          if (data.success) {
            setServerEnvVars(data.config.environment);
          }
        } catch (error) {
          console.error('Failed to get server env vars:', error);
        }

      } catch (error) {
        console.error('Error loading environment variables:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEnvironmentVariables();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const refreshPage = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading environment variables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 Environment Variables Debug</h1>
          
          {/* Client-Side Environment Variables */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Client-Side Environment Variables</h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Basic Environment</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>NODE_ENV:</span>
                      <span className={envVars.NODE_ENV === 'production' ? 'text-green-600' : 'text-yellow-600'}>
                        {envVars.NODE_ENV}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>VERCEL_URL:</span>
                      <span className={envVars.VERCEL_URL ? 'text-green-600' : 'text-red-600'}>
                        {envVars.VERCEL_URL || 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current URL:</span>
                      <span className="text-gray-600">{envVars.currentUrl}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">OAuth Configuration</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>NEXT_PUBLIC_NEXTAUTH_URL:</span>
                      <span className={envVars.NEXT_PUBLIC_NEXTAUTH_URL ? 'text-green-600' : 'text-red-600'}>
                        {envVars.NEXT_PUBLIC_NEXTAUTH_URL ? 'Set' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>NEXT_PUBLIC_GOOGLE_CLIENT_ID:</span>
                      <span className={envVars.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'text-green-600' : 'text-red-600'}>
                        {envVars.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Set' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>NEXT_PUBLIC_GITHUB_CLIENT_ID:</span>
                      <span className={envVars.NEXT_PUBLIC_GITHUB_CLIENT_ID ? 'text-green-600' : 'text-gray-600'}>
                        {envVars.NEXT_PUBLIC_GITHUB_CLIENT_ID ? 'Set' : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Server-Side Environment Variables */}
          {Object.keys(serverEnvVars).length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Server-Side Environment Variables</h2>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Server Environment</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>NODE_ENV:</span>
                        <span className={serverEnvVars.NODE_ENV === 'production' ? 'text-green-600' : 'text-yellow-600'}>
                          {serverEnvVars.NODE_ENV}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>VERCEL_URL:</span>
                        <span className={serverEnvVars.VERCEL_URL ? 'text-green-600' : 'text-red-600'}>
                          {serverEnvVars.VERCEL_URL || 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Is Vercel:</span>
                        <span className={serverEnvVars.isVercel ? 'text-green-600' : 'text-red-600'}>
                          {serverEnvVars.isVercel ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Server OAuth Config</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>NEXT_PUBLIC_NEXTAUTH_URL:</span>
                        <span className={serverEnvVars.NEXT_PUBLIC_NEXTAUTH_URL ? 'text-green-600' : 'text-red-600'}>
                          {serverEnvVars.NEXT_PUBLIC_NEXTAUTH_URL ? 'Set' : 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>NEXT_PUBLIC_GOOGLE_CLIENT_ID:</span>
                        <span className={serverEnvVars.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'text-green-600' : 'text-red-600'}>
                          {serverEnvVars.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Set' : 'Missing'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Raw Environment Data */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Raw Environment Data</h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify(envVars, null, 2)}
              </pre>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">🔧 Troubleshooting</h3>
            <div className="text-sm text-yellow-700 space-y-2">
              <p><strong>If NEXT_PUBLIC_GOOGLE_CLIENT_ID shows as "Missing":</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Check that the variable is set in Vercel Dashboard</li>
                <li>Ensure it's set for the correct environment (Production)</li>
                <li>Redeploy your application after adding the variable</li>
                <li>Wait 5-10 minutes for changes to propagate</li>
                <li>Clear browser cache and try again</li>
                <li>Check that the variable name is exactly correct (case-sensitive)</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={refreshPage}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🔄 Refresh Page
            </button>
            
            <button
              onClick={() => window.location.href = '/oauth-diagnostic'}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              🔍 OAuth Diagnostic
            </button>
            
            <button
              onClick={() => window.location.href = '/test-oauth-vercel'}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              🧪 Test OAuth
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';

