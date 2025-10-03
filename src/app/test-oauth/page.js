'use client';

import { authHelpers } from '../../lib/supabase';

export default function TestOAuth() {
  const handleGoogleOAuth = async () => {
    try {
      console.log('Testing Google OAuth...');
      console.log('Google Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
      console.log('Database URL:', process.env.DATABASE_URL);
      console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      await authHelpers.signInWithGoogle();
    } catch (error) {
      console.error('OAuth Error:', error);
      alert('OAuth Error: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">OAuth Test</h2>
          <p className="mt-2 text-sm text-gray-600">
            Test Google OAuth configuration
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Environment Variables</h3>
              <div className="mt-2 space-y-2 text-sm">
                <p><strong>Google Client ID:</strong> {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Set' : 'Not Set'}</p>
                <p><strong>Database URL:</strong> {process.env.DATABASE_URL ? 'Set' : 'Not Set'}</p>
                <p><strong>Supabase Anon Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not Set'}</p>
              </div>
            </div>

            <button
              onClick={handleGoogleOAuth}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Test Google OAuth
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


