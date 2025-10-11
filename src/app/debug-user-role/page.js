'use client';

import { useState } from 'react';

export default function DebugUserRole() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [updateEmail, setUpdateEmail] = useState('');
  const [updateRole, setUpdateRole] = useState('ADMIN');

  const checkUserRole = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/debug-user-role');
      const data = await response.json();
      
      if (data.success) {
        setUserInfo(data);
        setMessage('✅ User role info retrieved successfully');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async () => {
    if (!updateEmail || !updateRole) {
      setMessage('❌ Please enter email and select role');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/update-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: updateEmail,
          role: updateRole
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setUserInfo(null); // Clear cached info
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">User Role Debug Tool</h1>
          
          {/* Check Current User Role */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Check Current User Role</h2>
            <button
              onClick={checkUserRole}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check My Role'}
            </button>
          </div>

          {/* Update User Role */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Update User Role</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={updateEmail}
                  onChange={(e) => setUpdateEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={updateRole}
                  onChange={(e) => setUpdateRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <button
                onClick={updateUserRole}
                disabled={loading || !updateEmail}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>

          {/* User Info Display */}
          {userInfo && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current User Information</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Session User:</h3>
                <pre className="text-sm text-gray-700 mb-4">
                  {JSON.stringify(userInfo.sessionUser, null, 2)}
                </pre>
                
                <h3 className="font-semibold text-gray-900 mb-2">Database User:</h3>
                <pre className="text-sm text-gray-700">
                  {userInfo.databaseUser ? JSON.stringify(userInfo.databaseUser, null, 2) : 'No database user found'}
                </pre>
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-md ${
              message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1">
              <li>First, click "Check My Role" to see your current role</li>
              <li>If you need admin access, enter your email and select "ADMIN" role</li>
              <li>Click "Update Role" to change your role in the database</li>
              <li>After updating, try accessing <code className="bg-blue-100 px-1 rounded">/admin/dashboard</code></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}







