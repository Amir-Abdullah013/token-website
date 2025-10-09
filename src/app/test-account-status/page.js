'use client';

import { useState } from 'react';
import { useAuth } from '../../lib/auth-context';

export default function TestAccountStatus() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('password123');
  const [signinResult, setSigninResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  const testSignin = async () => {
    try {
      setTestLoading(true);
      setSigninResult(null);

      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });

      const data = await response.json();
      
      setSigninResult({
        success: response.ok,
        status: response.status,
        data: data
      });

    } catch (error) {
      setSigninResult({
        success: false,
        status: 500,
        data: { error: error.message }
      });
    } finally {
      setTestLoading(false);
    }
  };

  const testDeactivatedSignin = async () => {
    try {
      setTestLoading(true);
      setSigninResult(null);

      // Try to sign in with a deactivated account
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'deactivated@example.com',
          password: 'password123'
        })
      });

      const data = await response.json();
      
      setSigninResult({
        success: response.ok,
        status: response.status,
        data: data
      });

    } catch (error) {
      setSigninResult({
        success: false,
        status: 500,
        data: { error: error.message }
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (authLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Account Status Functionality</h1>
      
      <div className="space-y-6">
        {/* Current User Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Current User Status</h2>
          {isAuthenticated ? (
            <div className="space-y-2">
              <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
              <p><strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                  user?.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user?.status || 'unknown'}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Not signed in</p>
          )}
        </div>

        {/* Test Signin */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Test Signin</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={testSignin}
                disabled={testLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {testLoading ? 'Testing...' : 'Test Signin'}
              </button>
              <button
                onClick={testDeactivatedSignin}
                disabled={testLoading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {testLoading ? 'Testing...' : 'Test Deactivated Signin'}
              </button>
            </div>
          </div>
        </div>

        {/* Signin Result */}
        {signinResult && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Signin Result</h2>
            <div className={`p-4 rounded-lg ${
              signinResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="space-y-2">
                <p><strong>Status Code:</strong> {signinResult.status}</p>
                <p><strong>Success:</strong> {signinResult.success ? 'Yes' : 'No'}</p>
                <p><strong>Message:</strong> {signinResult.data?.message || signinResult.data?.error || 'No message'}</p>
                {signinResult.data?.errorCode && (
                  <p><strong>Error Code:</strong> {signinResult.data.errorCode}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-900">How to Test</h2>
          <div className="space-y-2 text-blue-800">
            <p>1. <strong>Normal Signin:</strong> Use valid credentials to test normal signin</p>
            <p>2. <strong>Deactivated Signin:</strong> Click "Test Deactivated Signin" to test blocked access</p>
            <p>3. <strong>Admin Panel:</strong> Go to <code>/admin/users</code> to deactivate users</p>
            <p>4. <strong>Status Check:</strong> Deactivated users should see "Your account is currently on hold"</p>
          </div>
        </div>
      </div>
    </div>
  );
}

