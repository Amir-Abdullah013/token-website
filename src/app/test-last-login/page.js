'use client';

import { useState } from 'react';

export default function TestLastLogin() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('116615266603089085637');

  const testSignin = async () => {
    setLoading(true);
    setResult('Testing signin to update last login...');
    
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'testuser@example.com',
          password: 'NewPassword123'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Signin successful! Last login should be updated.`);
      } else {
        setResult(`❌ Signin failed: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testProfile = async () => {
    setLoading(true);
    setResult('Fetching user profile...');
    
    try {
      const response = await fetch(`/api/user/profile?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        const user = data.user;
        setResult(`✅ Profile fetched successfully!
        
User Details:
- Name: ${user.name}
- Email: ${user.email}
- Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}
- Last Login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never logged in'}
- Updated: ${user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'Unknown'}`);
      } else {
        setResult(`❌ Failed to fetch profile: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseUser = async () => {
    setLoading(true);
    setResult('Testing with database user...');
    
    try {
      const response = await fetch('/api/user/profile?userId=1b5c946d-7d38-48bb-995b-c41dbd33d0d5');
      const data = await response.json();
      
      if (data.success) {
        const user = data.user;
        setResult(`✅ Database user profile fetched!
        
User Details:
- Name: ${user.name}
- Email: ${user.email}
- Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}
- Last Login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never logged in'}
- Updated: ${user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'Unknown'}`);
      } else {
        setResult(`❌ Failed to fetch database user profile: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Last Login Functionality</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter user ID"
                />
              </div>
              
              <button
                onClick={testSignin}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Signin (Update Last Login)'}
              </button>
              
              <button
                onClick={testProfile}
                disabled={loading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Test Profile Fetch'}
              </button>
              
              <button
                onClick={testDatabaseUser}
                disabled={loading}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Test Database User Profile'}
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

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Last Login Implementation</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Database Schema</h3>
              <p className="text-sm text-gray-600">Added `lastLogin` field to User model</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Signin API</h3>
              <p className="text-sm text-gray-600">Updates `lastLogin` timestamp when user signs in</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Profile API</h3>
              <p className="text-sm text-gray-600">Returns `lastLogin` field in user profile data</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">UI Components</h3>
              <p className="text-sm text-gray-600">ProfileCard and Profile page display last login time</p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">How It Works</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>When user signs in, the signin API updates the `lastLogin` field in the database</li>
            <li>The profile API fetches user data including the `lastLogin` timestamp</li>
            <li>UI components display the last login time in a user-friendly format</li>
            <li>If no last login exists, it shows "Never logged in"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}


