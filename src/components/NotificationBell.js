'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { authHelpers } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    loadUserAndNotifications();
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right - window.scrollX
      });
    }
  }, [isOpen]);

  const loadUserAndNotifications = async () => {
    try {
      const currentUser = await authHelpers.getCurrentUser();
      
      if (!currentUser) {
        return;
      }

      setUser(currentUser);
      
      // Load recent notifications (last 5)
      try {
        const notificationsResponse = await fetch(`/api/notifications?userId=${currentUser.id}&limit=5&offset=0`);
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json();
          setNotifications(notificationsData.notifications || []);
        } else {
          console.warn('Failed to load notifications:', notificationsResponse.status);
          setNotifications([]);
        }
      } catch (notifError) {
        console.error('Error loading notifications:', notifError);
        setNotifications([]);
      }
      
      // Get unread count
      try {
        const unreadResponse = await fetch(`/api/notifications/unread-count?userId=${currentUser.id}`);
        if (unreadResponse.ok) {
          const unreadData = await unreadResponse.json();
          setUnreadCount(unreadData.count || 0);
        } else {
          console.warn('Failed to load unread count:', unreadResponse.status);
          setUnreadCount(0);
        }
      } catch (unreadError) {
        console.error('Error loading unread count:', unreadError);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error loading user and notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id })
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push('/user/notifications');
  };

  const handleViewNotification = (notificationId) => {
    setIsOpen(false);
    router.push(`/user/notifications/${notificationId}`);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'SUCCESS':
        return '✅';
      case 'WARNING':
        return '⚠️';
      case 'ALERT':
        return '🚨';
      case 'INFO':
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type, status) => {
    if (status === 'READ') {
      return 'bg-gradient-to-br from-slate-800/20 to-slate-900/20';
    }
    
    switch (type) {
      case 'SUCCESS':
        return 'bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20';
      case 'WARNING':
        return 'bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20';
      case 'ALERT':
        return 'bg-gradient-to-br from-red-500/20 via-rose-500/20 to-pink-500/20';
      case 'INFO':
      default:
        return 'bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20';
    }
  };

  if (!user || !mounted) {
    return null;
  }

  return (
    <>
      <div className="relative">
        {/* Premium Bell Icon */}
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-slate-300 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 rounded-full transition-colors"
        >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Premium Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg shadow-red-500/25 border border-red-400/30">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

        {/* Dropdown Portal */}
        {isOpen && mounted && createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[99998]"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Premium Dropdown Content */}
            <div 
              className="fixed w-80 bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-800/95 backdrop-blur-sm rounded-lg shadow-2xl shadow-slate-900/50 border border-slate-600/30 z-[99999]"
              style={{
                top: `${buttonPosition.top}px`,
                right: `${buttonPosition.right}px`
              }}
            >
            {/* Premium Header */}
            <div className="px-4 py-3 border-b border-slate-600/30">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Notifications</h3>
                <button
                  onClick={handleViewAll}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  View all
                </button>
              </div>
              {unreadCount > 0 && (
                <p className="text-sm text-slate-300 mt-1">
                  {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Premium Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="text-slate-400 text-4xl mb-2">🔔</div>
                  <p className="text-slate-300">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-600/30">
                  {notifications.map((notification, index) => (
                    <div
                      key={notification.id || notification.$id || `notification-${index}`}
                      className={`px-4 py-3 hover:bg-slate-700/20 cursor-pointer transition-all duration-300 ${getNotificationColor(notification.type, notification.status)}`}
                      onClick={() => handleViewNotification(notification.id || notification.$id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium ${
                              notification.status === 'UNREAD' ? 'text-white' : 'text-slate-300'
                            }`}>
                              {notification.title}
                            </h4>
                            {notification.status === 'UNREAD' && (
                              <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          
                          <p className="text-sm text-slate-300 mt-1 line-clamp-2">
                            {notification.message.length > 80 
                              ? `${notification.message.substring(0, 80)}...` 
                              : notification.message
                            }
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-400">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                            
                            {notification.status === 'UNREAD' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.$id);
                                }}
                                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Premium Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-600/30">
                <button
                  onClick={handleViewAll}
                  className="w-full text-center text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  View all notifications
                </button>
              </div>
            )}
            </div>
          </>,
          document.body
        )}
      </div>
    </>
  );
}




