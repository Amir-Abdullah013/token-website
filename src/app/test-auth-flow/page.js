'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TestAuthFlow() {
  const [authStatus, setAuthStatus] = useState('checking');
  const [user, setUser] = useState(null);
  const [oauthSession, setOAuthSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = () => {
      // Check for regular user session
      const userSession = localStorage.getItem('userSession');
      if (userSession) {
        try {
          const userData = JSON.parse(userSession);
          setUser(userData);
          setAuthStatus('authenticated');
          return;
        } catch (error) {
          console.error('Error parsing user session:', error);
        }
      }

      // Check for OAuth session
      const oauthSessionData = localStorage.getItem('oauthSession');
      if (oauthSessionData) {
        try {
          const oauthData = JSON.parse(oauthSessionData);
          setOAuthSession(oauthData);
          setAuthStatus('oauth_authenticated');
          return;
        } catch (error) {
          console.error('Error parsing OAuth session:', error);
        }
      }

      setAuthStatus('not_authenticated');
    };

    checkAuthStatus();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('userSession');
    localStorage.removeItem('oauthSession');
    setUser(null);
    setOAuthSession(null);
    setAuthStatus('not_authenticated');
  };

  const testSignUp = async () => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        }),
      });

      const data = await response.json();
      console.log('Sign up response:', data);
      
      if (data.success) {
        alert('Sign up successful! User data has been stored in the database.');
        // Refresh the page to show updated auth status
        window.location.reload();
      } else {
        alert(`Sign up failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      alert('Network error during sign up');
    }
  };

  const testSignIn = async () => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
      });

      const data = await response.json();
      console.log('Sign in response:', data);
      
      if (data.success) {
        localStorage.setItem('userSession', JSON.stringify(data.user));
        setUser(data.user);
        setAuthStatus('authenticated');
        alert('Sign in successful! User authenticated from database.');
      } else {
        alert(`Sign in failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Network error during sign in');
    }
  };

  const testGoogleOAuth = async () => {
    try {
      const response = await fetch('/api/auth/oauth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Google OAuth response:', data);
      
      if (data.url) {
        alert('Redirecting to Google OAuth...');
        window.location.href = data.url;
      } else {
        alert(`Google OAuth failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      alert('Network error during Google OAuth');
    }
  };

  const testDatabase = async () => {
    try {
      const response = await fetch('/api/test-database', {
        method: 'GET',
      });

      const data = await response.json();
      console.log('Database test response:', data);
      
      if (data.success) {
        alert('Database connection successful!');
      } else {
        alert(`Database test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Database test error:', error);
      alert('Network error during database test');
    }
  };

  const testEmailVerification = async () => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'amirabdullah2508@gmail.com'
        }),
      });

      const data = await response.json();
      console.log('Email verification response:', data);
      
      if (data.success) {
        alert('Email verification successful!');
      } else {
        alert(`Email verification failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      alert('Network error during email verification');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Authentication Flow Test</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Authentication Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Authentication Status</h2>
              
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${
                  authStatus === 'authenticated' ? 'bg-green-100 text-green-800' :
                  authStatus === 'oauth_authenticated' ? 'bg-blue-100 text-blue-800' :
                  authStatus === 'not_authenticated' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  <div className="font-semibold">Status: {authStatus}</div>
                </div>

                {user && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="font-semibold text-green-800">Regular User Session:</div>
                    <div className="text-sm text-green-700">
                      <div>Name: {user.name}</div>
                      <div>Email: {user.email}</div>
                      <div>Role: {user.role}</div>
                    </div>
                  </div>
                )}

                {oauthSession && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-semibold text-blue-800">OAuth Session:</div>
                    <div className="text-sm text-blue-700">
                      <div>Provider: {oauthSession.provider}</div>
                      <div>Session: {oauthSession.session}</div>
                      <div>Timestamp: {new Date(oauthSession.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Test Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Actions</h2>
              
              <div className="space-y-3">
                <button
                  onClick={testSignUp}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Test Sign Up
                </button>

                <button
                  onClick={testSignIn}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Test Sign In
                </button>

                <button
                  onClick={testGoogleOAuth}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Test Google OAuth
                </button>

                <button
                  onClick={testDatabase}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Test Database
                </button>

                <button
                  onClick={testEmailVerification}
                  className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Verify Email
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Navigation</h3>
            <div className="flex flex-wrap gap-2">
              <Link href="/auth/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Sign Up Page
              </Link>
              <Link href="/auth/signin" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Sign In Page
              </Link>
              <Link href="/user/dashboard" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Dashboard
              </Link>
              <Link href="/debug-env" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                Debug Environment
              </Link>
              <Link href="/setup-database" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Setup Database
              </Link>
              <Link href="/verify-email" className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                Verify Email
              </Link>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Test Instructions</h3>
            <ol className="list-decimal list-inside text-yellow-700 space-y-1">
              <li>Click "Test Database" to verify database connection</li>
              <li>Click "Test Sign Up" to create a test account (stores in database)</li>
              <li>Click "Verify Email" to verify the test account email</li>
              <li>Click "Test Sign In" to authenticate with the test account</li>
              <li>Click "Test Google OAuth" to test Google authentication</li>
              <li>Check the authentication status above to see current state</li>
              <li>Use the navigation links to test the actual pages</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}