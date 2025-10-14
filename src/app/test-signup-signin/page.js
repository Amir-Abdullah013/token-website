'use client';

import { useState } from 'react';

export default function TestSignupSignin() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'password123'
  });

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

  const generateRandomEmail = () => {
    const randomId = Math.random().toString(36).substring(2, 8);
    setFormData(prev => ({
      ...prev,
      email: `testuser${randomId}@example.com`
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Signup & Signin Flow</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
              
              <div className="flex space-x-3">
                <button
                  onClick={testSignup}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test Signup'}
                </button>
                
                <button
                  onClick={testSignin}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test Signin'}
                </button>
              </div>
              
              <button
                onClick={testDatabaseUsers}
                disabled={loading}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Check Database Users'}
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

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Signup & Signin Process</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">1. Signup Process</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Validates email format and password strength</li>
                <li>Checks if user already exists in database</li>
                <li>Hashes password with bcrypt (12 salt rounds)</li>
                <li>Creates user record in database</li>
                <li>Creates wallet for the user</li>
                <li>Returns user data (without password)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">2. Signin Process</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Finds user by email in database</li>
                <li>Verifies password with bcrypt</li>
                <li>Updates last login timestamp</li>
                <li>Returns user session data</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">3. Database Integration</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Uses PostgreSQL database via Prisma</li>
                <li>Stores encrypted passwords</li>
                <li>Tracks user creation and login times</li>
                <li>Maintains user sessions</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Testing Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-green-700">
            <li>Click "Random" to generate a unique email address</li>
            <li>Click "Test Signup" to create a new account</li>
            <li>Click "Test Signin" to verify the account works</li>
            <li>Click "Check Database Users" to see all users in the database</li>
            <li>Verify that the user appears in the database list</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';



