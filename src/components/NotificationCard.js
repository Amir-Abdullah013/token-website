'use client';

import { formatDistanceToNow } from 'date-fns';

export default function NotificationCard({ 
  notification, 
  onMarkAsRead, 
  onView, 
  showActions = true,
  compact = false 
}) {
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

  const getTypeColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'alert':
        return 'bg-red-100 text-red-800';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (compact) {
    return (
      <div
        className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${getNotificationColor(notification.type, notification.status)} ${
          notification.status === 'unread' ? 'ring-2 ring-blue-200' : ''
        }`}
        onClick={() => onView && onView(notification.$id)}
      >
        <div className="flex items-start space-x-3">
          <div className="text-lg">
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-semibold ${
                notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {notification.title}
              </h3>
              {notification.status === 'unread' && (
                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
              )}
            </div>
            
            <p className={`text-xs mt-1 ${
              notification.status === 'unread' ? 'text-gray-800' : 'text-gray-600'
            }`}>
              {notification.message.length > 100 
                ? `${notification.message.substring(0, 100)}...` 
                : notification.message
              }
            </p>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                  {notification.type}
                </span>
                {notification.userId && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Personal
                  </span>
                )}
                {!notification.userId && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Global
                  </span>
                )}
              </div>
              
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${getNotificationColor(notification.type, notification.status)} ${
        notification.status === 'unread' ? 'ring-2 ring-blue-200' : ''
      }`}
      onClick={() => onView && onView(notification.$id)}
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
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
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
            </div>
            
            {showActions && notification.status === 'unread' && onMarkAsRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.$id);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark as Read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

























