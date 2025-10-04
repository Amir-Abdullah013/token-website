'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notificationHelpers } from '@/lib/database';
import { authHelpers } from '@/lib/supabase';;
import { Button, Card, Input, Loader, Toast } from '@/components';

export default function CreateNotificationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all', // 'all' or 'specific'
    userId: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authHelpers.getCurrentUser();
      
      if (!currentUser) {
        router.push('/auth/signin');
        return;
      }

      setUser(currentUser);
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/auth/signin');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      setToast({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    if (formData.targetType === 'specific' && !formData.userId.trim()) {
      setToast({
        type: 'error',
        message: 'Please enter a user ID for specific notifications'
      });
      return;
    }

    try {
      setLoading(true);
      
      const notification = await databaseHelpers.notifications.createNotification(
        formData.title,
        formData.message,
        formData.type,
        formData.targetType === 'specific' ? formData.userId : null
      );
      
      setToast({
        type: 'success',
        message: `Notification created successfully! ${
          formData.targetType === 'all' 
            ? 'It will be visible to all users.' 
            : `It will be visible to user ${formData.userId}.`
        }`
      });
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all',
        userId: ''
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/admin/notifications');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating notification:', error);
      setToast({
        type: 'error',
        message: 'Failed to create notification'
      });
    } finally {
      setLoading(false);
    }
  };

  const notificationTypes = [
    { value: 'info', label: 'Info', description: 'General information' },
    { value: 'success', label: 'Success', description: 'Positive updates' },
    { value: 'warning', label: 'Warning', description: 'Important notices' },
    { value: 'alert', label: 'Alert', description: 'Urgent notifications' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/admin/notifications')}
            className="mb-4 bg-gray-600 hover:bg-gray-700 text-white"
          >
            ← Back to Notifications
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">Create New Notification</h1>
          <p className="text-gray-600 mt-2">
            Send notifications to all users or specific users
          </p>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <Input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter notification title"
                required
                className="w-full"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Enter notification message"
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notificationTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex items-center p-4 border rounded-lg cursor-pointer ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {formData.type === type.value && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{type.label}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Target Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience *
              </label>
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="targetType"
                    value="all"
                    checked={formData.targetType === 'all'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">All Users</div>
                    <div className="text-sm text-gray-500">Send to all registered users</div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="targetType"
                    value="specific"
                    checked={formData.targetType === 'specific'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Specific User</div>
                    <div className="text-sm text-gray-500">Send to a specific user by ID</div>
                  </div>
                </label>
              </div>
            </div>

            {/* User ID (if specific) */}
            {formData.targetType === 'specific' && (
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                  User ID *
                </label>
                <Input
                  id="userId"
                  name="userId"
                  type="text"
                  value={formData.userId}
                  onChange={handleInputChange}
                  placeholder="Enter user ID"
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter the Appwrite user ID of the target user
                </p>
              </div>
            )}

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <Card className={`${
                formData.type === 'success' ? 'bg-green-50 border-green-200' :
                formData.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                formData.type === 'alert' ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {formData.type === 'success' ? '✅' :
                     formData.type === 'warning' ? '⚠️' :
                     formData.type === 'alert' ? '🚨' : 'ℹ️'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {formData.title || 'Notification Title'}
                    </h3>
                    <p className="text-gray-700 mt-1">
                      {formData.message || 'Notification message will appear here...'}
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        formData.type === 'success' ? 'bg-green-100 text-green-800' :
                        formData.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        formData.type === 'alert' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {formData.type}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {formData.targetType === 'all' ? 'Global' : 'Personal'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                onClick={() => router.push('/admin/notifications')}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Creating...' : 'Create Notification'}
              </Button>
            </div>
          </form>
        </Card>
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








