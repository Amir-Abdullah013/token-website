'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function TestAdminUsers() {
  const { user, loading, isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      setError(null);
      
      const response = await fetch('/api/admin/users?page=1&limit=10');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Users data received:', data);
        setUsers(data.users || []);
      } else {
        const errorData = await response.json();
        console.error('❌ Error loading users:', errorData);
        setError(errorData.error || 'Failed to load users');
      }
    } catch (err) {
      console.error('❌ Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <h1 className="text-2xl font-bold mb-6">Test Admin Users API</h1>
      
      <div className="mb-4">
        <button 
          onClick={loadUsers}
          disabled={loadingUsers}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loadingUsers ? 'Loading...' : 'Reload Users'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Users Data ({users.length} users)
          </h3>
          
          {users.length === 0 ? (
            <p className="text-gray-500">No users found</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500">Role: {user.role}</p>
                      <p className="text-sm text-gray-500">Status: {user.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <strong>Created:</strong> {formatDate(user.createdAt)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Last Login:</strong> {formatDate(user.lastLogin)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Wallet Balance:</strong> ${user.walletBalance || 0}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Von Balance:</strong> {user.VonBalance || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';


