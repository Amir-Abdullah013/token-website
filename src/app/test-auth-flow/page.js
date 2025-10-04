'use client';

import { useAuth } from '../../lib/auth-context';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestAuthFlow() {
  const { user, loading, isAuthenticated, signIn, signOut } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSignIn = async () => {
    setMessage('Signing in...');
    const result = await signIn(email, password);
    if (result.success) {
      setMessage('Sign in successful! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/user/dashboard');
      }, 1000);
    } else {
      setMessage('Sign in failed: ' + result.error);
    }
  };

  const handleSignOut = async () => {
    setMessage('Signing out...');
    await signOut();
    setMessage('Signed out successfully');
  };

  const handleGoToDashboard = () => {
    router.push('/user/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Auth Flow Test</h2>
          <p className="mt-2 text-sm text-gray-600">
            Test the authentication flow
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Current Status</h3>
              <div className="mt-2 space-y-2">
                <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
                <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'None'}</p>
              </div>
            </div>

            {!isAuthenticated ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleSignIn}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleGoToDashboard}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sign Out
                </button>
              </div>
            )}

            {message && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">{message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}







