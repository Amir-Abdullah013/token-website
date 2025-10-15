'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button, Card, Loader, Toast } from '@/components';
import { formatDistanceToNow } from 'date-fns';

export default function UserNotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      loadNotifications();
    } else if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/notifications?userId=${user.id}&limit=25&offset=0`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
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

  const handleMarkAsRead = async (notificationId) => {
    try {
      setMarkingAsRead(notificationId);
      
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'READ' }
            : notification
        )
      );
      
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
      setMarkingAsRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, status: 'READ' }))
      );
      
      setToast({
        type: 'success',
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setToast({
        type: 'error',
        message: 'Failed to mark all notifications as read'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewNotification = (notificationId) => {
    router.push(`/user/notifications/${notificationId}`);
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
      return 'bg-gradient-to-br from-slate-800/20 to-slate-900/20 border border-slate-600/30';
    }
    
    switch (type) {
      case 'success':
        return 'bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 border border-emerald-400/30';
      case 'warning':
        return 'bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-400/30';
      case 'alert':
        return 'bg-gradient-to-br from-red-500/20 via-rose-500/20 to-pink-500/20 border border-red-400/30';
      case 'info':
      default:
        return 'bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-400/30';
    }
  };

  if (loading && !notifications.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Premium Header - Mobile Responsive */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                🔔 Notifications
              </h1>
              <p className="text-slate-300 mt-2 text-sm sm:text-base">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="flex justify-center sm:justify-end">
                <Button
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30 px-4 py-2 text-sm sm:text-base"
                >
                  <span className="mr-2">✅</span>
                  Mark All as Read
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Premium Notifications List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <Card key={index} className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
                <div className="p-4 sm:p-6">
                  <div className="animate-pulse">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-slate-700/50 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
                        <div className="h-3 bg-slate-700/50 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="text-center py-12 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
            <div className="text-slate-400 text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">No notifications yet</h3>
            <p className="text-slate-400 text-sm sm:text-base">You'll see important updates and announcements here.</p>
            <div className="mt-6">
              <Button
                onClick={() => router.push('/user/dashboard')}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30"
              >
                <span className="mr-2">🏠</span>
                Back to Dashboard
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <Card
                key={notification.id || notification.$id || `notification-${index}`}
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur-sm ${getNotificationColor(notification.type, notification.status)} ${
                  notification.status === 'unread' ? 'ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20' : ''
                }`}
                onClick={() => handleViewNotification(notification.$id)}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="text-xl sm:text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h3 className={`text-base sm:text-lg font-semibold ${
                          notification.status === 'unread' ? 'text-white' : 'text-slate-300'
                        }`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {notification.status === 'unread' && (
                            <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></div>
                          )}
                          <span className="text-xs sm:text-sm text-slate-400">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`mt-2 text-sm sm:text-base ${
                        notification.status === 'unread' ? 'text-slate-200' : 'text-slate-400'
                      }`}>
                        {notification.message.length > 150 
                          ? `${notification.message.substring(0, 150)}...` 
                          : notification.message
                        }
                      </p>
                    
                      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            notification.type === 'success' ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/30' :
                            notification.type === 'warning' ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-400/30' :
                            notification.type === 'alert' ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border border-red-400/30' :
                            'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/30'
                          }`}>
                            {notification.type}
                          </span>
                          {notification.userId && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-400/30">
                              Personal
                            </span>
                          )}
                          {!notification.userId && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-300 border border-slate-400/30">
                              Global
                            </span>
                          )}
                        </div>
                        
                        {notification.status === 'unread' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.$id);
                            }}
                            disabled={markingAsRead === notification.$id}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-xs sm:text-sm shadow-lg shadow-cyan-500/25 border border-cyan-400/30 px-3 py-1.5"
                          >
                            {markingAsRead === notification.$id ? (
                              <span className="flex items-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                Marking...
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <span className="mr-1">✅</span>
                                Mark as Read
                              </span>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Premium Back Button - Mobile Responsive */}
        <div className="mt-6 sm:mt-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => router.push('/user/dashboard')}
              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white shadow-lg shadow-slate-500/25 border border-slate-400/30 px-4 py-2 text-sm sm:text-base"
            >
              <span className="mr-2">🏠</span>
              Back to Dashboard
            </Button>
            {notifications.length > 0 && (
              <Button
                onClick={loadNotifications}
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30 px-4 py-2 text-sm sm:text-base"
              >
                <span className="mr-2">🔄</span>
                Refresh Notifications
              </Button>
            )}
          </div>
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













