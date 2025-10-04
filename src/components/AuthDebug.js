'use client';

import { useAuth } from '../lib/auth-context';

export default function AuthDebug() {
  const { user, loading, isAuthenticated, error, configValid } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-1">
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>Config Valid:</strong> {configValid ? 'Yes' : 'No'}</p>
        <p><strong>User ID:</strong> {user?.$id || 'None'}</p>
        <p><strong>User Name:</strong> {user?.name || 'None'}</p>
        <p><strong>User Email:</strong> {user?.email || 'None'}</p>
        <p><strong>User Role:</strong> {user?.role || 'None'}</p>
        {error && <p><strong>Error:</strong> {error}</p>}
      </div>
    </div>
  );
}









