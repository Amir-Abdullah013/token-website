'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Removed direct database import - using API calls instead
import { authHelpers } from '@/lib/supabase';;
import { Button, Card, Input, Loader, Toast } from '@/components';

export default function CreateTicketPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
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
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      setToast({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    try {
      setLoading(true);
      
      const ticket = await databaseHelpers.support.createTicket(
        user.id,
        formData.subject,
        formData.message
      );
      
      setToast({
        type: 'success',
        message: 'Support ticket created successfully!'
      });
      
      // Redirect to ticket detail after a short delay
      setTimeout(() => {
        router.push(`/user/support/${ticket.$id}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error creating support ticket:', error);
      setToast({
        type: 'error',
        message: 'Failed to create support ticket'
      });
    } finally {
      setLoading(false);
    }
  };

  const ticketCategories = [
    { value: 'account', label: 'Account Issues', description: 'Login, password, profile problems' },
    { value: 'transaction', label: 'Transaction Support', description: 'Deposits, withdrawals, transfers' },
    { value: 'technical', label: 'Technical Issues', description: 'App bugs, performance problems' },
    { value: 'billing', label: 'Billing & Payments', description: 'Fees, payment methods, refunds' },
    { value: 'security', label: 'Security Concerns', description: 'Suspicious activity, account security' },
    { value: 'other', label: 'Other', description: 'General questions and other issues' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/user/support')}
            className="mb-4 bg-gray-600 hover:bg-gray-700 text-white"
          >
            ← Back to Support
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">Create Support Ticket</h1>
          <p className="text-gray-600 mt-2">
            Describe your issue and we'll help you resolve it
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Brief description of your issue"
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
                    placeholder="Please provide detailed information about your issue..."
                    required
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Include any error messages, steps to reproduce the issue, and relevant details.
                  </p>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={() => router.push('/user/support')}
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? 'Creating Ticket...' : 'Create Ticket'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Help Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Issues</h3>
                <div className="space-y-3">
                  {ticketCategories.map((category) => (
                    <div
                      key={category.value}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => {
                        if (category.value !== 'other') {
                          setFormData(prev => ({
                            ...prev,
                            subject: `${category.label}: `
                          }));
                        }
                      }}
                    >
                      <h4 className="font-medium text-gray-900">{category.label}</h4>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Tips */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips for Better Support</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Be specific about the problem you're experiencing</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Include any error messages you see</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Describe the steps that led to the issue</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Mention your browser and device type</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Attach screenshots if relevant</span>
                  </li>
                </ul>
              </div>
            </Card>

            {/* Contact Info */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Ways to Get Help</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">📚</div>
                    <div>
                      <h4 className="font-medium text-gray-900">Help Center</h4>
                      <p className="text-sm text-gray-600">Browse our documentation</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">💬</div>
                    <div>
                      <h4 className="font-medium text-gray-900">Live Chat</h4>
                      <p className="text-sm text-gray-600">Chat with support team</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">📧</div>
                    <div>
                      <h4 className="font-medium text-gray-900">Email</h4>
                      <p className="text-sm text-gray-600">support@tokenapp.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
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



















