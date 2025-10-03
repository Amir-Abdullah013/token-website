'use client';

import { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { authHelpers } from '../../lib/supabase';

export default function TestOAuthFix() {
  const { signInWithGoogle, signInWithGithub } = useAuth();
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testSupabaseClient = async () => {
    setLoading(true);
    try {
      // Test if Supabase client is properly initialized
      const { supabase } = await import('../../lib/supabase');
      
      const results = {
        hasClient: !!supabase,
        hasAuth: !!supabase.auth,
        hasSignInWithOAuth: typeof supabase.auth.signInWithOAuth === 'function',
        hasGetUser: typeof supabase.auth.getUser === 'function',
        hasSignIn: typeof supabase.auth.signInWithPassword === 'function',
        hasSignUp: typeof supabase.auth.signUp === 'function',
        hasSignOut: typeof supabase.auth.signOut === 'function'
      };

      setTestResults(results);
      console.log('Supabase Client Test Results:', results);
    } catch (error) {
      console.error('Error testing Supabase client:', error);
      setTestResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testGoogleOAuth = async () => {
    setLoading(true);
    try {
      console.log('Testing Google OAuth...');
      await signInWithGoogle();
      console.log('Google OAuth test completed');
    } catch (error) {
      console.error('Google OAuth test failed:', error);
      setTestResults(prev => ({ ...prev, googleOAuthError: error.message }));
    } finally {
      setLoading(false);
    }
  };

  const testGithubOAuth = async () => {
    setLoading(true);
    try {
      console.log('Testing GitHub OAuth...');
      await signInWithGithub();
      console.log('GitHub OAuth test completed');
    } catch (error) {
      console.error('GitHub OAuth test failed:', error);
      setTestResults(prev => ({ ...prev, githubOAuthError: error.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            OAuth Fix Test Page
          </h1>
          
          <div className="space-y-6">
            {/* Test Supabase Client */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Supabase Client Test</h2>
              <button
                onClick={testSupabaseClient}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Supabase Client'}
              </button>
              
              {Object.keys(testResults).length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Test Results:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Test Google OAuth */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Google OAuth Test</h2>
              <button
                onClick={testGoogleOAuth}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Google OAuth'}
              </button>
            </div>

            {/* Test GitHub OAuth */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">GitHub OAuth Test</h2>
              <button
                onClick={testGithubOAuth}
                disabled={loading}
                className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test GitHub OAuth'}
              </button>
            </div>

            {/* Environment Variables Check */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>DATABASE_URL:</strong> {process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}
                </div>
                <div>
                  <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
                </div>
                <div>
                  <strong>NEXT_PUBLIC_GOOGLE_CLIENT_ID:</strong> {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

