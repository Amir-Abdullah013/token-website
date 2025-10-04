'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notificationHelpers } from '@/lib/database';
import { authHelpers } from '@/lib/supabase';;
import { Button, Card, Loader, Toast } from '@/components';
import { formatDistanceToNow } from 'date-fns';

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserAndNotifications();
  }, []);

  const loadUserAndNotifications = async () => {
    try {
      setLoading(true);
      const currentUser = await authHelpers.getCurrentUser();
      
      if (!currentUser) {
        router.push('/auth/signin');
        return;
      }

      setUser(currentUser);
      const allNotifications = await databaseHelpers.notifications.getAllNotifications();
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setToast({
        type: 'error',
        message: 'Failed to load notifications'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      setDeleting(notificationId);
      await databaseHelpers.notifications.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.filter(notification => notification.$id !== notificationId)
      );
      
      setToast({
        type: 'success',
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      setToast({
        type: 'error',
        message: 'Failed to delete notification'
      });
    } finally {
      setDeleting(null);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'alert':
        return '🚨';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type, status) => {
    if (status === 'read') {
      return 'bg-gray-50 border-gray-200';
    }
    
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'alert':
        return 'bg-red-50 border-red-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (loading && !notifications.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const globalCount = notifications.filter(n => !n.userId).length;
  const personalCount = notifications.filter(n => n.userId).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications Management</h1>
              <p className="text-gray-600 mt-2">
                Manage all system and user notifications
              </p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => router.push('/admin/notifications/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create New Notification
              </Button>
              <Button
                onClick={() => router.push('/admin/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{notifications.length}</div>
              <div className="text-blue-800 font-medium">Total Notifications</div>
            </div>
          </Card>
          
          <Card className="bg-orange-50 border-orange-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{unreadCount}</div>
              <div className="text-orange-800 font-medium">Unread</div>
            </div>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{globalCount}</div>
              <div className="text-green-800 font-medium">Global</div>
            </div>
          </Card>
          
          <Card className="bg-purple-50 border-purple-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{personalCount}</div>
              <div className="text-purple-800 font-medium">Personal</div>
            </div>
          </Card>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-600 mb-6">Create your first notification to get started.</p>
            <Button
              onClick={() => router.push('/admin/notifications/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create Notification
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.$id}
                className={`${getNotificationColor(notification.type, notification.status)} ${
                  notification.status === 'unread' ? 'ring-2 ring-blue-200' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-semibold ${
                        notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {notification.status === 'unread' && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    <p className={`mt-2 ${
                      notification.status === 'unread' ? 'text-gray-800' : 'text-gray-600'
                    }`}>
                      {notification.message.length > 150 
                        ? `${notification.message.substring(0, 150)}...` 
                        : notification.message
                      }
                    </p>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          notification.type === 'success' ? 'bg-green-100 text-green-800' :
                          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          notification.type === 'alert' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {notification.type}
                        </span>
                        
                        {notification.userId && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Personal
                          </span>
                        )}
                        
                        {!notification.userId && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Global
                          </span>
                        )}
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          notification.status === 'unread' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {notification.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/admin/notifications/${notification.$id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDeleteNotification(notification.$id)}
                          disabled={deleting === notification.$id}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm"
                        >
                          {deleting === notification.$id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}









