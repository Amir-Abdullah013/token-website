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

  const getTypeColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/30';
      case 'warning':
        return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-400/30';
      case 'alert':
        return 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border border-red-400/30';
      case 'info':
      default:
        return 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/30';
    }
  };

  if (compact) {
    return (
      <div
        className={`p-3 rounded-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur-sm cursor-pointer ${getNotificationColor(notification.type, notification.status)} ${
          notification.status === 'unread' ? 'ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20' : ''
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
                notification.status === 'unread' ? 'text-white' : 'text-slate-300'
              }`}>
                {notification.title}
              </h3>
              {notification.status === 'unread' && (
                <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></div>
              )}
            </div>
            
            <p className={`text-xs mt-1 ${
              notification.status === 'unread' ? 'text-slate-200' : 'text-slate-400'
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
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-400/30">
                    Personal
                  </span>
                )}
                {!notification.userId && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-300 border border-slate-400/30">
                    Global
                  </span>
                )}
              </div>
              
              <span className="text-xs text-slate-400">
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
      className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur-sm cursor-pointer ${getNotificationColor(notification.type, notification.status)} ${
        notification.status === 'unread' ? 'ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20' : ''
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
              notification.status === 'unread' ? 'text-white' : 'text-slate-300'
            }`}>
              {notification.title}
            </h3>
            <div className="flex items-center space-x-2">
              {notification.status === 'unread' && (
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              )}
              <span className="text-sm text-slate-400">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          
          <p className={`mt-2 ${
            notification.status === 'unread' ? 'text-slate-200' : 'text-slate-400'
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
            
            {showActions && notification.status === 'unread' && onMarkAsRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.$id);
                }}
                className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
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


























