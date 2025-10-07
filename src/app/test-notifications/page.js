'use client';

import { useState } from 'react';
import { databaseHelpers } from '@/lib/database';
import { authHelpers } from '@/lib/supabase';
import { Button, Card, Toast } from '@/components';

export default function TestNotificationsPage() {
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const createTestNotification = async (type, title, message) => {
    try {
      setLoading(true);
      const user = await authHelpers.getCurrentUser();
      
      if (!user) {
        setToast({
          type: 'error',
          message: 'Please sign in to test notifications'
        });
        return;
      }

      await databaseHelpers.notifications.createNotification(title, message, type, user.id);
      
      setToast({
        type: 'success',
        message: `${type} notification created successfully!`
      });
    } catch (error) {
      console.error('Error creating test notification:', error);
      setToast({
        type: 'error',
        message: 'Failed to create test notification'
      });
    } finally {
      setLoading(false);
    }
  };

  const createGlobalNotification = async (type, title, message) => {
    try {
      setLoading(true);
      await databaseHelpers.notifications.createNotification(title, message, type);
      
      setToast({
        type: 'success',
        message: `Global ${type} notification created successfully!`
      });
    } catch (error) {
      console.error('Error creating global notification:', error);
      setToast({
        type: 'error',
        message: 'Failed to create global notification'
      });
    } finally {
      setLoading(false);
    }
  };

  const testNotifications = [
    {
      type: 'info',
      title: 'System Update',
      message: 'We have released a new version of the platform with improved performance and new features.',
      global: true
    },
    {
      type: 'success',
      title: 'Transaction Completed',
      message: 'Your deposit of $100 has been successfully processed and added to your wallet.',
      global: false
    },
    {
      type: 'warning',
      title: 'Security Alert',
      message: 'We detected unusual activity on your account. Please verify your recent transactions.',
      global: false
    },
    {
      type: 'alert',
      title: 'Maintenance Notice',
      message: 'The platform will be under maintenance from 2:00 AM to 4:00 AM UTC. Some features may be unavailable.',
      global: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Test Notifications System</h1>
          <p className="text-gray-600 mt-2">
            Create test notifications to verify the system is working correctly
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testNotifications.map((notification, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="text-2xl">
                  {notification.type === 'success' ? '✅' :
                   notification.type === 'warning' ? '⚠️' :
                   notification.type === 'alert' ? '🚨' : 'ℹ️'}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {notification.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        notification.type === 'success' ? 'bg-green-100 text-green-800' :
                        notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        notification.type === 'alert' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {notification.type}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        notification.global ? 'bg-gray-100 text-gray-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {notification.global ? 'Global' : 'Personal'}
                      </span>
                    </div>
                    
                    <Button
                      onClick={() => notification.global 
                        ? createGlobalNotification(notification.type, notification.title, notification.message)
                        : createTestNotification(notification.type, notification.title, notification.message)
                      }
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                      {loading ? 'Creating...' : 'Create'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Instructions</h3>
            <div className="space-y-2 text-gray-600">
              <p>1. Click "Create" on any notification to create a test notification</p>
              <p>2. Check the notification bell in the navbar for unread count</p>
              <p>3. Visit <a href="/user/notifications" className="text-blue-600 hover:underline">/user/notifications</a> to see all notifications</p>
              <p>4. Test marking notifications as read</p>
              <p>5. For admin features, visit <a href="/admin/notifications" className="text-blue-600 hover:underline">/admin/notifications</a></p>
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <Button
            onClick={() => window.location.href = '/user/notifications'}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            View All Notifications
          </Button>
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












