'use client';

import { useAuth } from '../../lib/auth-context';
import { authHelpers } from '@/lib/supabase';;
import { useEffect, useState } from 'react';

export default function TestOAuthFlow() {
  const { user, loading, isAuthenticated } = useAuth();
  const [directUser, setDirectUser] = useState(null);
  const [testing, setTesting] = useState(false);

  const testDirectAuth = async () => {
    setTesting(true);
    try {
      console.log('Testing direct Appwrite auth...');
      const currentUser = await authHelpers.getCurrentUser();
      console.log('Direct auth result:', currentUser);
      setDirectUser(currentUser);
    } catch (error) {
      console.error('Direct auth error:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">OAuth Flow Test</h1>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Auth Status:</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Auth Context:</h3>
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
            {user && (
              <>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>User Name:</strong> {user.name}</p>
                <p><strong>User Email:</strong> {user.email}</p>
                <p><strong>User Role:</strong> {user.role}</p>
              </>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Direct Appwrite Check:</h3>
            <button
              onClick={testDirectAuth}
              disabled={testing}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 mb-4"
            >
              {testing ? 'Testing...' : 'Test Direct Auth'}
            </button>
            {directUser && (
              <>
                <p><strong>Direct User ID:</strong> {directUser.$id}</p>
                <p><strong>Direct User Name:</strong> {directUser.name}</p>
                <p><strong>Direct User Email:</strong> {directUser.email}</p>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <button
            onClick={() => window.location.href = '/auth/signin'}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
          >
            Go to Sign In
          </button>
          
          <button
            onClick={() => window.location.href = '/user/dashboard'}
            className="w-full bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}



