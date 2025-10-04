'use client';

import { useState, useEffect } from 'react';

export default function DebugEnv() {
  const [envVars, setEnvVars] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkEnvVars = () => {
      const vars = {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
        PUBLIC_DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
        NEXT_PUBLIC_NEXTAUTH_URL: process.env.NEXT_PUBLIC_NEXTAUTH_URL ? 'Set' : 'Not set',
        VERCEL_URL: process.env.VERCEL_URL ? 'Set' : 'Not set',
      };
      
      setEnvVars(vars);
      setIsLoading(false);
    };

    checkEnvVars();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Environment Variables Debug</h1>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Environment Variables Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(envVars).map(([key, value]) => (
                <div
                  key={key}
                  className={`p-4 rounded-lg border ${
                    value === 'Set' 
                      ? 'bg-green-100 border-green-200 text-green-800' 
                      : 'bg-red-100 border-red-200 text-red-800'
                  }`}
                >
                  <div className="font-semibold">{key}</div>
                  <div className="text-sm">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Troubleshooting</h3>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Make sure your <code>.env.local</code> file exists in the project root</li>
              <li>Check that <code>DATABASE_URL</code> is set in your environment variables</li>
              <li>For Vercel deployment, set environment variables in the Vercel dashboard</li>
              <li>Restart your development server after changing environment variables</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Note</h3>
            <p className="text-yellow-700">
              This page shows the status of environment variables. If DATABASE_URL is not set, 
              the app will use fallback configuration and may not have full database functionality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}