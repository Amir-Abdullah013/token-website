'use client';

import { useEffect, useState } from 'react';

export default function DebugEnv() {
  const [envVars, setEnvVars] = useState({});

  useEffect(() => {
    setEnvVars({
    DATABASE_URL: process.env.DATABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      NODE_ENV: process.env.NODE_ENV,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Environment Variables Debug</h1>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Environment Variables:</h2>
        <div className="space-y-2">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-mono text-sm">{key}:</span>
              <span className="font-mono text-sm text-blue-600">
                {value ? (value.length > 50 ? `${value.substring(0, 50)}...` : value) : 'Not set'}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Status:</h3>
          <div className="space-y-1">
            <p className={envVars.DATABASE_URL ? 'text-green-600' : 'text-red-600'}>
              Database URL: {envVars.DATABASE_URL ? '✅ Set' : '❌ Missing'}
            </p>
            <p className={envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
              Supabase Anon Key: {envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
            </p>
            <p className={envVars.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'text-green-600' : 'text-red-600'}>
              Google Client ID: {envVars.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


