'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';

export default function TestNotificationsAPI() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testNotificationsAPI = async () => {
    if (!user?.$id) {
      setError('No user ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Test notifications endpoint
      const notificationsResponse = await fetch(`/api/notifications?userId=${user.$id}&limit=10&offset=0`);
      
      if (!notificationsResponse.ok) {
        throw new Error(`Notifications API error: ${notificationsResponse.status}`);
      }
      
      const notificationsData = await notificationsResponse.json();
      setNotifications(notificationsData.notifications);
      console.log('Notifications API Response:', notificationsData);

      // Test unread count endpoint
      const unreadResponse = await fetch(`/api/notifications/unread-count?userId=${user.$id}`);
      
      if (!unreadResponse.ok) {
        throw new Error(`Unread count API error: ${unreadResponse.status}`);
      }
      
      const unreadData = await unreadResponse.json();
      setUnreadCount(unreadData.count);
      console.log('Unread count API Response:', unreadData);

    } catch (err) {
      console.error('Error testing notifications API:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.$id })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Mark as read response:', data);
        
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        throw new Error(`Mark as read API error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (user?.$id) {
      testNotificationsAPI();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Notifications API Test
          </h1>
          
          <div className="space-y-6">
            {/* User Info */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h2 className="text-xl font-semibold mb-4">User Information</h2>
              <div className="space-y-2 text-sm">
                <div><strong>User ID:</strong> {user?.$id || 'Not available'}</div>
                <div><strong>User Name:</strong> {user?.name || 'Not available'}</div>
                <div><strong>User Email:</strong> {user?.email || 'Not available'}</div>
              </div>
            </div>

            {/* Test Button */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">API Test</h2>
              <button
                onClick={testNotificationsAPI}
                disabled={loading || !user?.$id}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing...' : 'Test Notifications API'}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold text-gray-900">Total Notifications</h3>
                <p className="text-2xl font-bold text-green-600">{notifications.length}</p>
              </div>
              <div className="border rounded-lg p-4 bg-red-50">
                <h3 className="font-semibold text-gray-900">Unread Count</h3>
                <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications List */}
            {notifications.length > 0 && (
              <div className="border rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Notifications</h2>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-3 rounded-lg border ${
                        notification.isRead 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{notification.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Type: {notification.type}</span>
                            <span>Status: {notification.isRead ? 'Read' : 'Unread'}</span>
                            <span>Created: {new Date(notification.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                        {!notification.isRead && (
                          <button
                            onClick={() => testMarkAsRead(notification.id)}
                            className="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="border rounded-lg p-4 bg-yellow-50">
              <h2 className="text-xl font-semibold mb-4">Instructions</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Make sure you are logged in (user ID should be available)</li>
                <li>Click "Test Notifications API" to test the API endpoints</li>
                <li>Check the console for any error messages</li>
                <li>If successful, notifications should be displayed above</li>
                <li>Click "Mark as Read" to test the mark-as-read functionality</li>
                <li>In development mode, mock data will be returned</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';


