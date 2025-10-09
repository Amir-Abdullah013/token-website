'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OAuthSuccess() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing OAuth callback...');

  useEffect(() => {
    const handleOAuthSuccess = () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const provider = urlParams.get('provider');
        const session = urlParams.get('session');
        const userEmail = urlParams.get('userEmail');
        const userName = urlParams.get('userName');
        const userId = urlParams.get('userId');
        const userPicture = urlParams.get('userPicture');

        console.log('OAuth Success Page: Processing callback', {
          provider,
          session,
          userEmail,
          userName,
          userId
        });

        // Store OAuth session data
        const oauthData = {
          provider: provider || 'google',
          session: session || 'default',
          timestamp: Date.now()
        };

        // Store user session data (role will be determined by server-side session handling)
        const userSessionData = {
          $id: userId || 'default-id',
          id: userId || 'default-id',
          email: userEmail || 'user@example.com',
          name: userName || 'User',
          picture: userPicture || '',
          provider: provider || 'google',
          emailVerified: true
        };

        // Store in localStorage (for client-side access)
        localStorage.setItem('oauthSession', JSON.stringify(oauthData));
        localStorage.setItem('userSession', JSON.stringify(userSessionData));
        
        // Also store in cookies for server-side access
        document.cookie = `userSession=${JSON.stringify(userSessionData)}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `oauthSession=${JSON.stringify(oauthData)}; path=/; max-age=86400; SameSite=Lax`;

        console.log('OAuth Success: Session data stored', userSessionData);

        setStatus('OAuth successful! Redirecting to dashboard...');

        // Use window.location.href for more reliable redirect on Vercel
        setTimeout(() => {
          window.location.href = '/user/dashboard';
        }, 500);

      } catch (error) {
        console.error('OAuth Success Page Error:', error);
        // Even on error, redirect to dashboard to avoid loops
        setTimeout(() => {
          window.location.href = '/user/dashboard';
        }, 1000);
      }
    };

    // Run the OAuth success handler immediately
    handleOAuthSuccess();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          {/* Loading Spinner */}
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          
          {/* Status Message */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {status}
          </h2>
          
          {/* Progress Steps */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>OAuth authentication successful</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <span>Storing session data</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
              <span>Redirecting to dashboard</span>
            </div>
          </div>
          
          {/* Error Message (if any) */}
          {status.includes('Error') && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                If this page doesn't redirect automatically, 
                <a href="/user/dashboard" className="text-blue-600 underline ml-1">
                  click here to go to dashboard
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
