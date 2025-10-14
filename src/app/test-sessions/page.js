'use client';

import { useState, useEffect } from 'react';
import { authHelpers } from '../../lib/supabase';

export default function TestSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const activeSessions = await authHelpers.getActiveSessions();
      setSessions(activeSessions);
    } catch (err) {
      setError(err.message);
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Active Sessions</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Active Sessions</h2>
            <button
              onClick={loadSessions}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">Error: {error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading sessions...</p>
            </div>
          ) : sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{session.device}</h3>
                        {session.isCurrent && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Current Session
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Location:</strong> {session.location}</p>
                        <p><strong>IP Address:</strong> {session.ipAddress}</p>
                        <p><strong>Last Active:</strong> {new Date(session.lastActive).toLocaleString()}</p>
                        {session.userAgent && (
                          <p><strong>User Agent:</strong> {session.userAgent}</p>
                        )}
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No active sessions found.</p>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Session Information</h3>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Active sessions show all devices where you're currently signed in</li>
            <li>Current session is the device you're using right now</li>
            <li>You can revoke sessions from other devices for security</li>
            <li>Session data includes device type, location, and last activity</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';



