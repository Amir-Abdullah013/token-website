'use client';

import { useState } from 'react';

export default function TestAuthComplete() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  const testSignup = async () => {
    setLoading(true);
    setResult('Testing signup...');
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Amir Abdullah',
          email: 'amirabdullah2508@gmail.com',
          password: 'password123'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Signup successful! User ID: ${data.user.id}`);
      } else {
        setResult(`❌ Signup failed: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignin = async () => {
    setLoading(true);
    setResult('Testing signin...');
    
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'amirabdullah2508@gmail.com',
          password: 'password123'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Signin successful! Welcome ${data.user.name}`);
      } else {
        setResult(`❌ Signin failed: ${data.error}`);
        if (data.debug) {
          setResult(prev => prev + `\nDebug: ${JSON.stringify(data.debug, null, 2)}`);
        }
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const listUsers = async () => {
    setLoading(true);
    setResult('Fetching users...');
    
    try {
      const response = await fetch('/api/debug/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        setResult(`✅ Found ${data.count} users in database`);
      } else {
        setResult(`❌ Failed to fetch users: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      setResult('✅ Browser cache cleared');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Authentication Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
            <div className="space-y-3">
              <button
                onClick={testSignup}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Signup (amirabdullah2508@gmail.com)'}
              </button>
              
              <button
                onClick={testSignin}
                disabled={loading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Signin (amirabdullah2508@gmail.com)'}
              </button>
              
              <button
                onClick={listUsers}
                disabled={loading}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'List All Users'}
              </button>
              
              <button
                onClick={clearCache}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Clear Browser Cache
              </button>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="bg-gray-100 p-4 rounded min-h-[200px]">
              <pre className="whitespace-pre-wrap text-sm">{result || 'No results yet...'}</pre>
            </div>
          </div>
        </div>

        {users.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Users in Database ({users.length})</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{user.id.substring(0, 8)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs rounded-full ${user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.emailVerified ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Troubleshooting Steps</h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-700">
            <li>Click "Clear Browser Cache" to remove any cached data</li>
            <li>Click "Test Signup" to create a new account with your email</li>
            <li>Click "List All Users" to see all accounts in the database</li>
            <li>Click "Test Signin" to verify the account can be used to sign in</li>
            <li>If signin fails, check the error message for specific details</li>
          </ol>
        </div>
      </div>
    </div>
  );
}


