'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../lib/admin-auth';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useToast, ToastContainer } from '../../../components/Toast';

export default function AdminNotificationsPage() {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // State management
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [globalNotifications, setGlobalNotifications] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [readNotifications, setReadNotifications] = useState(0);
  const [notificationsPerPage] = useState(10);

  // Notification management state
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Create notification form state
  const [createForm, setCreateForm] = useState({
    title: '',
    message: '',
    type: 'INFO'
  });

  // Edit notification form state
  const [editForm, setEditForm] = useState({
    title: '',
    message: '',
    type: 'INFO'
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
        return;
      }
      loadNotifications();
    }
  }, [mounted, isLoading, isAuthenticated]);

  // Reload notifications when filters change
  useEffect(() => {
    if (mounted && isAuthenticated) {
      loadNotifications();
    }
  }, [selectedType, selectedStatus, currentPage]);

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: notificationsPerPage.toString()
      });
      
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      
      const response = await fetch(`/api/admin/notifications?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Notifications data from API:', data.notifications?.map(n => ({ id: n.id, title: n.title, type: n.type, status: n.status })));
        setNotifications(data.notifications || []);
        setFilteredNotifications(data.notifications || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalNotifications(data.pagination?.total || 0);
        
        // Update statistics
        if (data.statistics) {
          setGlobalNotifications(data.statistics.globalNotifications || 0);
          setUnreadNotifications(data.statistics.unreadNotifications || 0);
          setReadNotifications(data.statistics.readNotifications || 0);
        }
      } else {
        const errorData = await response.json();
        console.error('Error loading notifications:', errorData.error);
        error('Failed to load notifications: ' + (errorData.error || 'Unknown error'));
        setNotifications([]);
        setFilteredNotifications([]);
        setTotalPages(1);
        setTotalNotifications(0);
        setGlobalNotifications(0);
        setUnreadNotifications(0);
        setReadNotifications(0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      error('Failed to load notifications');
      setNotifications([]);
      setFilteredNotifications([]);
      setTotalPages(1);
      setTotalNotifications(0);
      setGlobalNotifications(0);
      setUnreadNotifications(0);
      setReadNotifications(0);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleViewNotification = (notification) => {
    setSelectedNotification(notification);
    setShowNotificationModal(true);
  };

  const handleCreateNotification = async () => {
    if (!createForm.title || !createForm.message) {
      error('Please fill in all required fields');
      return;
    }

    try {
      setActionLoading(true);
      
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Notification created successfully:', data);
        success('Notification created successfully');
        
        // Reset form
        setCreateForm({
          title: '',
          message: '',
          type: 'INFO'
        });
        setShowCreateModal(false);
        
        // Reload notifications
        loadNotifications();
      } else {
        const errorData = await response.json();
        console.error('Create notification error:', errorData);
        error(`Failed to create notification: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error creating notification:', err);
      error('Failed to create notification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditNotification = (notification) => {
    setSelectedNotification(notification);
    setEditForm({
      title: notification.title,
      message: notification.message,
      type: notification.type
    });
    setShowEditModal(true);
  };

  const handleUpdateNotification = async () => {
    if (!editForm.title || !editForm.message) {
      error('Please fill in all required fields');
      return;
    }

    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/admin/notifications/${selectedNotification.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Notification updated successfully:', data);
        success('Notification updated successfully');
        
        // Reset form and close modal
        setEditForm({
          title: '',
          message: '',
          type: 'INFO'
        });
        setShowEditModal(false);
        setSelectedNotification(null);
        
        // Reload notifications
        loadNotifications();
      } else {
        const errorData = await response.json();
        console.error('Update notification error:', errorData);
        error(`Failed to update notification: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error updating notification:', err);
      error('Failed to update notification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotification = (notification) => {
    setSelectedNotification(notification);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/admin/notifications/${selectedNotification.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Notification deleted successfully:', data);
        success('Notification deleted successfully');
        
        // Close modal and reset
        setShowDeleteModal(false);
        setSelectedNotification(null);
        
        // Reload notifications
        loadNotifications();
      } else {
        const errorData = await response.json();
        console.error('Delete notification error:', errorData);
        error(`Failed to delete notification: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      error('Failed to delete notification');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Invalid Date';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800';
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ALERT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'READ':
        return 'bg-green-100 text-green-800';
      case 'UNREAD':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentPageNotifications = () => {
    return filteredNotifications;
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout showSidebar={true}>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm shadow-xl border-b border-slate-600/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Notification Management</h1>
                <p className="text-slate-300">Create and manage notifications for all users</p>
            </div>
              <div className="flex items-center space-x-4">
              <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30"
              >
                  Create Notification
              </Button>
              <Button
                onClick={() => router.push('/admin/dashboard')}
                  variant="outline"
                  className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
              >
                Back to Dashboard
              </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-cyan-200 text-lg">📢</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-cyan-200">Total Notifications</p>
                    <p className="text-2xl font-bold text-white">{totalNotifications}</p>
                  </div>
            </div>
              </CardContent>
          </Card>
          
            <Card className="bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 border border-emerald-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500/30 to-green-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-emerald-200 text-lg">🌍</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-emerald-200">Global Notifications</p>
                    <p className="text-2xl font-bold text-white">{globalNotifications}</p>
                  </div>
            </div>
              </CardContent>
          </Card>
          
            <Card className="bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-amber-200 text-lg">📬</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-amber-200">Unread</p>
                    <p className="text-2xl font-bold text-white">{unreadNotifications}</p>
                  </div>
            </div>
              </CardContent>
          </Card>
          
            <Card className="bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-indigo-500/20 border border-violet-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-violet-500/30 to-purple-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-violet-200 text-lg">✅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-violet-200">Read</p>
                    <p className="text-2xl font-bold text-white">{readNotifications}</p>
                  </div>
            </div>
              </CardContent>
          </Card>
        </div>

          {/* Filters */}
          <Card className="mb-6 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                  >
                    <option value="all" className="bg-slate-800 text-white">All Types</option>
                    <option value="INFO" className="bg-slate-800 text-white">Info</option>
                    <option value="SUCCESS" className="bg-slate-800 text-white">Success</option>
                    <option value="WARNING" className="bg-slate-800 text-white">Warning</option>
                    <option value="ALERT" className="bg-slate-800 text-white">Alert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                  >
                    <option value="all" className="bg-slate-800 text-white">All Status</option>
                    <option value="READ" className="bg-slate-800 text-white">Read</option>
                    <option value="UNREAD" className="bg-slate-800 text-white">Unread</option>
                  </select>
                </div>
                <div className="flex items-end">
            <Button
                    onClick={loadNotifications}
                    disabled={loadingNotifications}
                    className="w-full bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
            >
                    {loadingNotifications ? 'Loading...' : 'Refresh'}
            </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Table */}
          <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">All Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingNotifications ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  <span className="ml-2 text-slate-300">Loading notifications...</span>
                      </div>
              ) : (
                <>
                  {getCurrentPageNotifications().length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-slate-400 text-4xl mb-4">🔔</div>
                      <h3 className="text-lg font-medium text-white mb-2">No Notifications Found</h3>
                      <p className="text-slate-300">No notifications match your search criteria.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-600/30">
                        <thead className="bg-gradient-to-r from-slate-700/30 to-slate-800/30">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              Created By
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-gradient-to-br from-slate-800/20 to-slate-900/20 divide-y divide-slate-600/20">
                          {getCurrentPageNotifications().map((notification) => (
                            <tr key={notification.id} className="hover:bg-slate-700/20 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-white">
                                  {notification.title}
                                </div>
                                <div className="text-sm text-slate-300 truncate max-w-xs">
                                  {notification.message}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                          {notification.type}
                        </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(notification.status)}`}>
                                  {notification.status}
                          </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {notification.creator_name || 'System'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                {formatDate(notification.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewNotification(notification)}
                                    className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 hover:text-cyan-200 border border-cyan-400/30"
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditNotification(notification)}
                                    className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 hover:from-emerald-500/30 hover:to-green-500/30 hover:text-emerald-200 border border-emerald-400/30"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteNotification(notification)}
                                    className="bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 hover:from-red-500/30 hover:to-rose-500/30 hover:text-red-200 border border-red-400/30"
                                    disabled={actionLoading}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-slate-300">
                        Showing {((currentPage - 1) * notificationsPerPage) + 1} to {Math.min(currentPage * notificationsPerPage, totalNotifications)} of {totalNotifications} notifications
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                        >
                          Previous
                        </Button>
                        <span className="px-3 py-2 text-sm text-slate-300">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notification Details Modal */}
        {showNotificationModal && selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Notification Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Title:</span> {selectedNotification.title}
                </div>
                <div>
                  <span className="font-medium">Message:</span> 
                  <p className="mt-1 text-sm text-gray-600">{selectedNotification.message}</p>
                </div>
                <div>
                  <span className="font-medium">Type:</span> {selectedNotification.type}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {selectedNotification.status}
                </div>
                <div>
                  <span className="font-medium">Global:</span> {selectedNotification.isGlobal ? 'Yes' : 'No'}
                </div>
                <div>
                  <span className="font-medium">Created By:</span> {selectedNotification.creator_name || 'System'}
                  </div>
                <div>
                  <span className="font-medium">Created:</span> {formatDate(selectedNotification.createdAt)}
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setShowNotificationModal(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Notification Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Create New Notification</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <Input
                    type="text"
                    placeholder="Notification title"
                    value={createForm.title}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    placeholder="Notification message"
                    value={createForm.message}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INFO">Info</option>
                    <option value="SUCCESS">Success</option>
                    <option value="WARNING">Warning</option>
                    <option value="ALERT">Alert</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateNotification}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading ? 'Creating...' : 'Create Notification'}
                </Button>
              </div>
            </div>
      </div>
        )}

        {/* Edit Notification Modal */}
        {showEditModal && selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Edit Notification</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <Input
                    type="text"
                    placeholder="Notification title"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    placeholder="Notification message"
                    value={editForm.message}
                    onChange={(e) => setEditForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INFO">Info</option>
                    <option value="SUCCESS">Success</option>
                    <option value="WARNING">Warning</option>
                    <option value="ALERT">Alert</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => setShowEditModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateNotification}
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {actionLoading ? 'Updating...' : 'Update Notification'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Notification</h3>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Are you sure you want to delete this notification? This action cannot be undone.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-900">{selectedNotification.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedNotification.message}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  disabled={actionLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {actionLoading ? 'Deleting...' : 'Delete Notification'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';
