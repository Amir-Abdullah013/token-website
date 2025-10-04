'use client';

import { useState, useEffect } from 'react';

export default function TestEnvSimple() {
  const [envData, setEnvData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEnvData = async () => {
      try {
        // Get server-side environment data
        const response = await fetch('/api/debug-env');
        const data = await response.json();
        
        if (data.success) {
          setEnvData(data);
        } else {
          setEnvData({ error: data.error });
        }
      } catch (error) {
        setEnvData({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    loadEnvData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading environment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 Simple Environment Test</h1>
          
          {envData.error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Error</h3>
              <p className="text-red-700">{envData.error}</p>
            </div>
          ) : (
            <>
              {/* Environment Status */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Environment Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-3">Basic Environment</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>NODE_ENV:</span>
                        <span className={envData.environment?.NODE_ENV === 'production' ? 'text-green-600' : 'text-yellow-600'}>
                          {envData.environment?.NODE_ENV}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>VERCEL_URL:</span>
                        <span className={envData.environment?.VERCEL_URL ? 'text-green-600' : 'text-red-600'}>
                          {envData.environment?.VERCEL_URL || 'Not set'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-3">OAuth Configuration</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>NEXT_PUBLIC_NEXTAUTH_URL:</span>
                        <span className={envData.environment?.NEXT_PUBLIC_NEXTAUTH_URL ? 'text-green-600' : 'text-red-600'}>
                          {envData.environment?.NEXT_PUBLIC_NEXTAUTH_URL ? 'Set' : 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>NEXT_PUBLIC_GOOGLE_CLIENT_ID:</span>
                        <span className={envData.environment?.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'text-green-600' : 'text-red-600'}>
                          {envData.environment?.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Set' : 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>GOOGLE_CLIENT_SECRET:</span>
                        <span className={envData.environment?.GOOGLE_CLIENT_SECRET === 'Set (hidden)' ? 'text-green-600' : 'text-red-600'}>
                          {envData.environment?.GOOGLE_CLIENT_SECRET}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Missing Variables */}
              {envData.missing && envData.missing.length > 0 && (
                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">❌ Missing Environment Variables</h3>
                  <ul className="list-disc list-inside text-red-700 space-y-1">
                    {envData.missing.map((variable, index) => (
                      <li key={index}>{variable}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">💡 Recommendations</h3>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  {envData.recommendations?.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* Raw Data */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Raw Environment Data</h2>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <pre className="text-sm text-gray-700 overflow-x-auto">
                    {JSON.stringify(envData.environment, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
            
            <button
              onClick={() => window.location.href = '/oauth-diagnostic'}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              🔍 OAuth Diagnostic
            </button>
            
            <button
              onClick={() => window.location.href = '/debug-env-vars'}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              🔧 Debug Env Vars
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
