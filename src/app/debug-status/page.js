'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';

export default function DebugStatus() {
  const { user, loading, isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/admin/users?page=1&limit=10');
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Users data:', data.users);
        setUsers(data.users || []);
      } else {
        console.error('Error loading users:', response.status);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const testStatusUpdate = async (userId, newStatus) => {
    try {
      console.log(`🔄 Testing status update for user ${userId} to ${newStatus}`);
      
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      console.log('✅ Status update response:', data);
      
      if (response.ok) {
        // Reload users to see the change
        setTimeout(() => {
          loadUsers();
        }, 500);
      }
    } catch (error) {
      console.error('❌ Error updating status:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-8">Please sign in to access this page.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Status Updates</h1>
      
      <div className="mb-6">
        <button 
          onClick={loadUsers}
          disabled={loadingUsers}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loadingUsers ? 'Loading...' : 'Reload Users'}
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Users Status Debug ({users.length} users)
          </h3>
          
          {users.length === 0 ? (
            <p className="text-gray-500">No users found</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500">ID: {user.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <strong>Current Status:</strong> 
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                          (user.status || 'active') === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status || 'active'}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Updated:</strong> {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => testStatusUpdate(user.id, 'inactive')}
                        className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700"
                      >
                        Deactivate
                      </button>
                      <button
                        onClick={() => testStatusUpdate(user.id, 'active')}
                        className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700"
                      >
                        Activate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2 text-blue-900">Debug Instructions</h3>
        <div className="text-blue-800 space-y-1">
          <p>1. Click "Reload Users" to see current status</p>
          <p>2. Click "Deactivate" or "Activate" to test status changes</p>
          <p>3. Watch the console for debug logs</p>
          <p>4. Check if the status badge updates immediately</p>
          <p>5. Reload users to see if changes persist</p>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';


