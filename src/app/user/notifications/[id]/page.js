'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
// Removed direct database import - using API calls instead
import { authHelpers } from '@/lib/supabase';
import { Button, Card, Loader, Toast } from '@/components';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserAndNotification();
  }, [params.id]);

  const loadUserAndNotification = async () => {
    try {
      setLoading(true);
      const currentUser = await authHelpers.getCurrentUser();
      
      if (!currentUser) {
        router.push('/auth/signin');
        return;
      }

      setUser(currentUser);
      
      // Fetch notification via API
      const response = await fetch(`/api/notifications/${params.id}`);
      if (response.ok) {
        const notificationData = await response.json();
        setNotification(notificationData.notification);
      } else {
        throw new Error('Failed to load notification');
      }
    } catch (error) {
      console.error('Error loading notification:', error);
      setToast({
        type: 'error',
        message: 'Failed to load notification'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      setMarkingAsRead(true);
      
      const response = await fetch(`/api/notifications/${notification.id}/read`, {
        method: 'PATCH'
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }
      
      // Update local state
      setNotification(prev => ({ ...prev, status: 'read' }));
      
      setToast({
        type: 'success',
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setToast({
        type: 'error',
        message: 'Failed to mark notification as read'
      });
    } finally {
      setMarkingAsRead(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Notification not found</h3>
          <p className="text-gray-600 mb-6">The notification you're looking for doesn't exist or you don't have access to it.</p>
          <Button
            onClick={() => router.push('/user/notifications')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Back to Notifications
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/user/notifications')}
            className="mb-4 bg-gray-600 hover:bg-gray-700 text-white"
          >
            ← Back to Notifications
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notification Details</h1>
              <p className="text-gray-600 mt-2">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>
            {notification.status === 'unread' && (
              <Button
                onClick={handleMarkAsRead}
                disabled={markingAsRead}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {markingAsRead ? 'Marking as Read...' : 'Mark as Read'}
              </Button>
            )}
          </div>
        </div>

        {/* Notification Content */}
        <Card className={`${getNotificationColor(notification.type, notification.status)} ${
          notification.status === 'unread' ? 'ring-2 ring-blue-200' : ''
        }`}>
          <div className="flex items-start space-x-4">
            <div className="text-4xl">
              {getNotificationIcon(notification.type)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-2xl font-bold ${
                  notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {notification.title}
                </h2>
                {notification.status === 'unread' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-600">Unread</span>
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <p className={`text-lg leading-relaxed ${
                  notification.status === 'unread' ? 'text-gray-800' : 'text-gray-600'
                }`}>
                  {notification.message}
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    notification.type === 'success' ? 'bg-green-100 text-green-800' :
                    notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    notification.type === 'alert' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {notification.type}
                  </span>
                  
                  {notification.userId && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      Personal Notification
                    </span>
                  )}
                  
                  {!notification.userId && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      Global Notification
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-500">
                  Created {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            onClick={() => router.push('/user/notifications')}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            ← Back to Notifications
          </Button>
          
          {notification.status === 'unread' && (
            <Button
              onClick={handleMarkAsRead}
              disabled={markingAsRead}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {markingAsRead ? 'Marking as Read...' : 'Mark as Read'}
            </Button>
          )}
        </div>
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

// Disable prerendering for this page
export const dynamic = 'force-dynamic';













