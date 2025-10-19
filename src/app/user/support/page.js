'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Removed direct database import - using API calls instead
import { useAuth } from '@/lib/auth-context';;
import { Button, Card, Loader, Toast } from '@/components';
import { formatDistanceToNow } from 'date-fns';

export default function UserSupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserAndTickets();
  }, []);

  const loadUserAndTickets = async () => {
    try {
      setLoading(true);
      const currentUser = await authHelpers.getCurrentUser();
      
      if (!currentUser) {
        router.push('/auth/signin');
        return;
      }

      setUser(currentUser);
      const userTickets = await databaseHelpers.support.getUserTickets(currentUser.id);
      setTickets(userTickets);
    } catch (error) {
      console.error('Error loading support tickets:', error);
      setToast({
        type: 'error',
        message: 'Failed to load support tickets'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = () => {
    router.push('/user/support/create');
  };

  const handleViewTicket = (ticketId) => {
    router.push(`/user/support/${ticketId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLastMessage = (messages) => {
    if (!messages || messages.length === 0) return 'No messages';
    const lastMessage = messages[messages.length - 1];
    return lastMessage.message.length > 100 
      ? `${lastMessage.message.substring(0, 100)}...` 
      : lastMessage.message;
  };

  const getLastMessageSender = (messages) => {
    if (!messages || messages.length === 0) return 'user';
    return messages[messages.length - 1].sender;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const openTickets = tickets.filter(ticket => ticket.status === 'open').length;
  const closedTickets = tickets.filter(ticket => ticket.status === 'closed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
              <p className="text-gray-600 mt-2">
                Get help with your account and transactions
              </p>
            </div>
            <Button
              onClick={handleCreateTicket}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create New Ticket
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <div className="text-center p-6">
              <div className="text-3xl font-bold text-blue-600">{tickets.length}</div>
              <div className="text-blue-800 font-medium">Total Tickets</div>
            </div>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <div className="text-center p-6">
              <div className="text-3xl font-bold text-green-600">{openTickets}</div>
              <div className="text-green-800 font-medium">Open Tickets</div>
            </div>
          </Card>
          
          <Card className="bg-gray-50 border-gray-200">
            <div className="text-center p-6">
              <div className="text-3xl font-bold text-gray-600">{closedTickets}</div>
              <div className="text-gray-800 font-medium">Closed Tickets</div>
            </div>
          </Card>
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No support tickets yet</h3>
            <p className="text-gray-600 mb-6">Create your first support ticket to get help with your account.</p>
            <Button
              onClick={handleCreateTicket}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create Your First Ticket
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card
                key={ticket.$id}
                className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-300"
                onClick={() => handleViewTicket(ticket.$id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {ticket.subject}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">
                        {getLastMessage(ticket.messages)}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>
                            Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                          </span>
                          <span>
                            Last message from {getLastMessageSender(ticket.messages)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400">•</span>
                          <span>{ticket.messages?.length || 0} message{(ticket.messages?.length || 0) !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Help Resources */}
        <div className="mt-8">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Help Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">📚</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Documentation</h4>
                    <p className="text-sm text-gray-600">Browse our help articles</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">💬</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Live Chat</h4>
                    <p className="text-sm text-gray-600">Chat with our support team</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">📧</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Email Support</h4>
                    <p className="text-sm text-gray-600">support@Pryvons.com</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">📞</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Phone Support</h4>
                    <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Button
            onClick={() => router.push('/user/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            ← Back to Dashboard
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

// Disable prerendering for this page
export const dynamic = 'force-dynamic';



















