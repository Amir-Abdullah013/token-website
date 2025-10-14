'use client';

import { useState } from 'react';

export default function TestAuthDebug() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Debug User',
    email: 'debuguser@example.com',
    password: 'password123'
  });

  const clearCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      setResult('✅ Browser cache cleared');
    }
  };

  const testSignup = async () => {
    setLoading(true);
    setResult('Testing signup...');
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Signup successful! 
User ID: ${data.user.id}
Name: ${data.user.name}
Email: ${data.user.email}
Role: ${data.user.role}
Created: ${data.user.createdAt ? new Date(data.user.createdAt).toLocaleString() : 'Unknown'}`);
      } else {
        setResult(`❌ Signup failed: ${data.error}`);
        if (data.details) {
          setResult(prev => prev + `\nDetails: ${data.details}`);
        }
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
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Signin successful! 
Welcome ${data.user.name}
Email: ${data.user.email}
Last Login: ${data.user.lastLogin ? new Date(data.user.lastLogin).toLocaleString() : 'Never logged in'}
Session ID: ${data.user.id}`);
      } else {
        setResult(`❌ Signin failed: ${data.error}`);
        if (data.debug) {
          setResult(prev => prev + `\nDebug: ${JSON.stringify(data.debug, null, 2)}`);
        }
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

  const testUserLookup = async () => {
    setLoading(true);
    setResult('Testing user lookup...');
    
    try {
      const response = await fetch(`/api/user/profile?userId=debug-user-id`);
      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ User lookup successful! 
Name: ${data.user.name}
Email: ${data.user.email}
Created: ${data.user.createdAt ? new Date(data.user.createdAt).toLocaleString() : 'Unknown'}`);
      } else {
        setResult(`❌ User lookup failed: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseUsers = async () => {
    setLoading(true);
    setResult('Fetching all users from database...');
    
    try {
      const response = await fetch('/api/debug/users');
      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Found ${data.count} users in database:
        
${data.users.map((user, index) => 
  `${index + 1}. ${user.name} (${user.email}) - Created: ${new Date(user.createdAt).toLocaleDateString()}`
).join('\n')}`);
      } else {
        setResult(`❌ Failed to fetch users: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSpecificUser = async (email) => {
    setLoading(true);
    setResult(`Testing signin for specific user: ${email}`);
    
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: 'password123'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Signin successful for ${email}! 
Welcome ${data.user.name}
Last Login: ${data.user.lastLogin ? new Date(data.user.lastLogin).toLocaleString() : 'Never logged in'}`);
      } else {
        setResult(`❌ Signin failed for ${email}: ${data.error}`);
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

  const generateRandomEmail = () => {
    const randomId = Math.random().toString(36).substring(2, 8);
    setFormData(prev => ({
      ...prev,
      email: `debuguser${randomId}@example.com`
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Auth Debug & Testing</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Form</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email"
                  />
                  <button
                    onClick={generateRandomEmail}
                    className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Random
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={testSignup}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Signup'}
                </button>
                
                <button
                  onClick={testSignin}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Signin'}
                </button>
              </div>
              
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
            <div className="bg-gray-100 p-4 rounded min-h-[300px]">
              <pre className="whitespace-pre-wrap text-sm">{result || 'No results yet...'}</pre>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Database Tests</h2>
            <div className="space-y-3">
              <button
                onClick={testDatabaseUsers}
                disabled={loading}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'List All Users'}
              </button>
              
              <button
                onClick={testUserLookup}
                disabled={loading}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test User Lookup'}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Specific User Tests</h2>
            <div className="space-y-2">
              <button
                onClick={() => testSpecificUser('testuser@example.com')}
                disabled={loading}
                className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                Test: testuser@example.com
              </button>
              
              <button
                onClick={() => testSpecificUser('testuser2@example.com')}
                disabled={loading}
                className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                Test: testuser2@example.com
              </button>
              
              <button
                onClick={() => testSpecificUser('testuser3@example.com')}
                disabled={loading}
                className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                Test: testuser3@example.com
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Debugging Steps</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Clear browser cache to remove any cached data</li>
            <li>Test signup with a new email address</li>
            <li>Test signin with the same credentials</li>
            <li>Check database users to verify the user was created</li>
            <li>Test specific users that might be having issues</li>
            <li>Check console logs for detailed debugging information</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';



