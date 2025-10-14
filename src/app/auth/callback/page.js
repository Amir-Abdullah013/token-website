'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';

export default function AuthCallback() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          setError(`OAuth Error: ${error}`);
          setLoading(false);
          return;
        }

        if (!code) {
          setError('No authorization code received');
          setLoading(false);
          return;
        }

        if (!state) {
          setError('No state parameter received');
          setLoading(false);
          return;
        }

        // Process the OAuth callback
        const response = await fetch('/api/auth/oauth-callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state,
            provider: state.startsWith('google_') ? 'google' : 'github'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process OAuth callback');
        }

        const data = await response.json();
        
        if (data.user) {
          setUser(data.user);
        }

        // Redirect to dashboard
        router.push('/user/dashboard');

      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    handleCallback();
  }, [router, setUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
          <button
            onClick={() => router.push('/auth/signin')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';
