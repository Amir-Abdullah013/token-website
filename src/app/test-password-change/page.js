'use client';

import { useState } from 'react';

export default function TestPasswordChange() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '116615266603089085637',
    currentPassword: '',
    newPassword: ''
  });

  const testPasswordChange = async () => {
    setLoading(true);
    setResult('Testing password change...');
    
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Password change successful! ${data.message}`);
      } else {
        setResult(`❌ Password change failed: ${data.error}`);
        if (data.fieldErrors) {
          setResult(prev => prev + `\nField Errors: ${JSON.stringify(data.fieldErrors, null, 2)}`);
        }
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSigninWithNewPassword = async () => {
    setLoading(true);
    setResult('Testing signin with new password...');
    
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'amirabdullah2508@gmail.com',
          password: formData.newPassword
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Signin with new password successful! Welcome ${data.user.name}`);
      } else {
        setResult(`❌ Signin with new password failed: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Password Change</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Password Change Form</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={formData.userId}
                onChange={(e) => setFormData({...formData, userId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter user ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter current password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password (min 8 chars, uppercase, lowercase, number)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must contain: uppercase, lowercase, number, min 8 characters
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={testPasswordChange}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Password Change'}
              </button>
              
              <button
                onClick={testSigninWithNewPassword}
                disabled={loading}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Signin with New Password'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-gray-100 p-4 rounded min-h-[200px]">
            <pre className="whitespace-pre-wrap text-sm">{result || 'No results yet...'}</pre>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Test Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-700">
            <li>Enter your current password (the one you used to sign up)</li>
            <li>Enter a new password that meets the requirements</li>
            <li>Click "Test Password Change" to change your password</li>
            <li>Click "Test Signin with New Password" to verify the new password works</li>
            <li>Check the results to see if the password change was successful</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';



