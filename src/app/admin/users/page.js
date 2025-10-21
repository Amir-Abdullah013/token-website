'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/admin-auth';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast, ToastContainer } from '@/components/Toast';

export default function AdminUsersPage() {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // State management
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [adminUsers, setAdminUsers] = useState(0);
  const [usersWithBalance, setUsersWithBalance] = useState(0);
  const [usersPerPage] = useState(10);

  // User management state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
        return;
      }
      loadUsers();
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  // Load users from API
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedRole !== 'all') params.append('role', selectedRole);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Users data from API:', data.users?.map(u => ({ id: u.id, name: u.name, status: u.status })));
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalUsers(data.pagination?.total || 0);
        
        // Update statistics
        if (data.statistics) {
          setActiveUsers(data.statistics.activeUsers || 0);
          setAdminUsers(data.statistics.adminUsers || 0);
          setUsersWithBalance(data.statistics.usersWithBalance || 0);
        }
      } else {
        const errorData = await response.json();
        console.error('Error loading users:', errorData.error);
        error('Failed to load users: ' + (errorData.error || 'Unknown error'));
        setUsers([]);
        setFilteredUsers([]);
        setTotalPages(1);
        setTotalUsers(0);
        setActiveUsers(0);
        setAdminUsers(0);
        setUsersWithBalance(0);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Reload users when filters change
  useEffect(() => {
    if (mounted && isAuthenticated) {
      loadUsers();
    }
  }, [searchTerm, selectedRole, selectedStatus, currentPage]);

  // Pagination - users are already paginated from API
  const getCurrentPageUsers = () => {
    return filteredUsers;
  };

  // User actions
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    // Navigate to edit page or open edit modal
    router.push(`/admin/users/${adminUser.id}/edit`);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        success(`User ${selectedUser.name} deleted successfully`);
        loadUsers();
        setShowDeleteModal(false);
        setSelectedUser(null);
      } else {
        error('Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      error('Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserStatus = async (user, retryCount = 0) => {
    const maxRetries = 2;
    
    // Prevent self-deactivation
    if (adminUser && user.id === adminUser.id) {
      error('You cannot deactivate your own account. This is a security measure to prevent account lockout.');
      return;
    }
    
    try {
      setActionLoading(true);
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      
      console.log(`🔄 Toggling user status (attempt ${retryCount + 1}/${maxRetries + 1}):`, {
        userId: user.id,
        currentStatus: user.status,
        newStatus: newStatus
      });
      
      // First, let's test if the API endpoint is reachable
      console.log('🧪 Testing API endpoint reachability...');
      try {
        const testResponse = await fetch(`/api/admin/users/${user.id}/status`, {
          method: 'OPTIONS'
        });
        console.log('🧪 OPTIONS test response:', testResponse.status);
      } catch (testError) {
        console.log('🧪 OPTIONS test failed:', testError);
      }
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      console.log('🌐 Making API request to:', `/api/admin/users/${user.id}/status`);
      console.log('🌐 Request payload:', { status: newStatus });
      
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('🌐 API Response received:', {
        url: response.url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        type: response.type,
        redirected: response.redirected
      });
      
      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // Log response body for debugging
      const responseClone = response.clone();
      try {
        const responseText = await responseClone.text();
        console.log('📡 Response body (raw):', responseText);
      } catch (textError) {
        console.error('❌ Failed to read response body:', textError);
      }

      if (response.ok) {
        try {
          const data = await response.json();
          console.log('✅ Status update successful:', data);
          success(`User ${user.name} ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
          
          // Update the user in local state immediately for better UX
          setUsers(prevUsers => {
            const updatedUsers = prevUsers.map(u => 
              u.id === user.id 
                ? { ...u, status: newStatus, updatedAt: new Date().toISOString() }
                : u
            );
            console.log('🔄 Updated users state:', updatedUsers.find(u => u.id === user.id));
            return updatedUsers;
          });
          
          setFilteredUsers(prevFiltered => {
            const updatedFiltered = prevFiltered.map(u => 
              u.id === user.id 
                ? { ...u, status: newStatus, updatedAt: new Date().toISOString() }
                : u
            );
            console.log('🔄 Updated filtered users state:', updatedFiltered.find(u => u.id === user.id));
            return updatedFiltered;
          });
          
          // Also reload from server to ensure consistency, but preserve local changes
          setTimeout(() => {
            console.log('🔄 Reloading users from server...');
            loadUsers();
          }, 1000);
        } catch (jsonError) {
          console.error('❌ Failed to parse success response:', jsonError);
          error('Status updated but failed to parse response');
        }
      } else {
        // Handle error response - simplified approach
        console.log('❌ Error response received:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const responseText = await response.text();
          console.log('📡 Raw error response text:', responseText);
          
          if (responseText && responseText.trim()) {
            try {
              const parsedError = JSON.parse(responseText);
              console.log('📡 Parsed error JSON:', parsedError);
              errorMessage = parsedError.error || parsedError.message || errorMessage;
            } catch (parseError) {
              console.log('📡 Response is not JSON, using as text:', responseText);
              errorMessage = responseText || errorMessage;
            }
          } else {
            console.log('📡 Empty response body');
          }
        } catch (textError) {
          console.error('❌ Failed to read response text:', textError);
        }
        
        console.error('❌ Final error message:', errorMessage);
        
        // Handle specific business logic errors
        if (errorMessage.includes('Cannot deactivate your own account')) {
          // This is a business rule, not an error - show as warning
          error('You cannot deactivate your own account. This is a security measure to prevent account lockout.');
        } else if (errorMessage.includes('HTTP 500') || errorMessage.includes('Internal Server Error')) {
          error('Server error occurred. Please check the server logs and try again.');
        } else if (errorMessage.includes('HTTP 401') || errorMessage.includes('Authentication')) {
          error('Authentication failed. Please refresh the page and try again.');
        } else if (errorMessage.includes('HTTP 403') || errorMessage.includes('Admin access')) {
          error('Access denied. You need admin privileges to perform this action.');
        } else if (errorMessage.includes('HTTP 404')) {
          error('User not found. Please refresh the page and try again.');
        } else {
          error(`Failed to update user status: ${errorMessage}`);
        }
      }
    } catch (err) {
      console.error('❌ Error updating user status:', err);
      
      // Retry logic for certain errors
      if (retryCount < maxRetries && (
        err.name === 'AbortError' || 
        (err.name === 'TypeError' && err.message.includes('fetch')) ||
        (err.message && err.message.includes('timeout'))
      )) {
        console.log(`🔄 Retrying request (${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => {
          handleToggleUserStatus(user, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      if (err.name === 'AbortError') {
        error('Request timed out. Please try again.');
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        error('Network error. Please check your connection and try again.');
      } else {
        error(`Failed to update user status: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatVon = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading admin users...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">User Management</h1>
                <p className="text-slate-300 mt-1">Manage users, roles, and permissions</p>
              </div>
              
            </div>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center">
                    <span className="text-cyan-200 text-lg">👥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-cyan-200">Total Users</p>
                  <p className="text-2xl font-bold text-white">{totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 border border-emerald-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500/30 to-green-500/30 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-200 text-lg">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-emerald-200">Active Users</p>
                  <p className="text-2xl font-bold text-white">{activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-indigo-500/20 border border-violet-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-violet-500/30 to-purple-500/30 rounded-lg flex items-center justify-center">
                    <span className="text-violet-200 text-lg">👑</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-violet-200">Admins</p>
                  <p className="text-2xl font-bold text-white">{adminUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-lg flex items-center justify-center">
                    <span className="text-amber-200 text-lg">💰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-amber-200">Users with Balance</p>
                  <p className="text-2xl font-bold text-white">{usersWithBalance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Search Users
                </label>
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                >
                  <option value="all" className="bg-slate-800 text-white">All Roles</option>
                  <option value="USER" className="bg-slate-800 text-white">Users</option>
                  <option value="ADMIN" className="bg-slate-800 text-white">Admins</option>
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
                  <option value="active" className="bg-slate-800 text-white">Active</option>
                  <option value="inactive" className="bg-slate-800 text-white">Inactive</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={loadUsers}
                  variant="outline"
                  className="w-full bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                <span className="ml-2 text-slate-300">Loading users...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-600/30">
                  <thead className="bg-gradient-to-r from-slate-700/30 to-slate-800/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gradient-to-br from-slate-800/20 to-slate-900/20 divide-y divide-slate-600/20">
                    {getCurrentPageUsers().map((user) => (
                      <tr key={user.id} className="hover:bg-slate-700/20 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500/30 to-blue-500/30 flex items-center justify-center">
                                <span className="text-cyan-200 font-medium">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white flex items-center gap-2">
                                {user.name}
                                {(adminUser && user.id === adminUser.id) && (
                                  <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-slate-300">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'ADMIN' 
                              ? 'bg-gradient-to-r from-violet-500/40 to-purple-500/40 text-white border border-violet-400/60' 
                              : 'bg-gradient-to-r from-cyan-500/40 to-blue-500/40 text-white border border-cyan-400/60'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            (user.status || 'active') === 'active' 
                              ? 'bg-gradient-to-r from-emerald-500/40 to-green-500/40 text-white border border-emerald-400/60' 
                              : 'bg-gradient-to-r from-red-500/40 to-rose-500/40 text-white border border-red-400/60'
                          }`}>
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          <div>
                            <div className="font-medium">{formatCurrency(user.walletBalance)}</div>
                            <div className="text-slate-300">{formatVon(user.VonBalance)} Von</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {formatDate(user.lastLogin)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewUser(user)}
                              className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 hover:text-cyan-200 border border-cyan-400/30"
                            >
                              View
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (adminUser && user.id === adminUser.id) {
                                  error('You cannot deactivate your own account. This is a security measure to prevent account lockout.');
                                  return;
                                }
                                handleToggleUserStatus(user);
                              }}
                              disabled={actionLoading || (adminUser && user.id === adminUser.id)}
                              className={
                                (adminUser && user.id === adminUser.id)
                                  ? 'bg-gray-500/20 text-gray-400 border-gray-500/30 cursor-not-allowed'
                                  : (user.status || 'active') === 'active' 
                                    ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 hover:from-red-500/30 hover:to-rose-500/30 hover:text-red-200 border border-red-400/30' 
                                    : 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 hover:from-emerald-500/30 hover:to-green-500/30 hover:text-emerald-200 border border-emerald-400/30'
                              }
                              title={(adminUser && user.id === adminUser.id) ? 'You cannot deactivate your own account' : ''}
                            >
                              {(adminUser && user.id === adminUser.id) 
                                ? 'Self' 
                                : (user.status || 'active') === 'active' 
                                  ? 'Deactivate' 
                                  : 'Activate'
                              }
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user)}
                              className="bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 hover:from-red-500/30 hover:to-rose-500/30 hover:text-red-200 border border-red-400/30"
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

            {/* Premium Mobile-Responsive Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 space-y-4">
                {/* Mobile-First Pagination Info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  {/* Results Info - Mobile Optimized */}
                  <div className="text-center sm:text-left">
                    <div className="text-sm text-slate-300 mb-1 sm:mb-0">
                      <span className="font-medium text-slate-200">
                        {((currentPage - 1) * usersPerPage) + 1}
                      </span>
                      <span className="mx-1 text-slate-400">to</span>
                      <span className="font-medium text-slate-200">
                        {Math.min(currentPage * usersPerPage, filteredUsers.length)}
                      </span>
                      <span className="mx-1 text-slate-400">of</span>
                      <span className="font-medium text-slate-200">
                        {filteredUsers.length}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 sm:hidden">
                      Users
                    </div>
                  </div>

                  {/* Page Info - Mobile Optimized */}
                  <div className="text-center sm:text-right">
                    <div className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-lg border border-slate-600/30 shadow-sm">
                      <span className="text-sm font-medium text-slate-200">
                        Page {currentPage}
                      </span>
                      <span className="mx-2 text-slate-400">/</span>
                      <span className="text-sm text-slate-300">
                        {totalPages}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile-First Navigation Controls */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:justify-center sm:space-x-3">
                  {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
                  <div className="flex space-x-2 sm:space-x-3">
                    {/* Previous Button */}
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex-1 sm:flex-none bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 py-2.5 px-4 text-sm font-medium"
                    >
                      <span className="flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">Prev</span>
                      </span>
                    </Button>

                    {/* Next Button */}
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex-1 sm:flex-none bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 py-2.5 px-4 text-sm font-medium"
                    >
                      <span className="flex items-center justify-center">
                        <span className="hidden sm:inline">Next</span>
                        <span className="sm:hidden">Next</span>
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </Button>
                  </div>

                  {/* Quick Page Jump - Desktop Only */}
                  <div className="hidden lg:flex items-center space-x-2">
                    <span className="text-sm text-slate-400">Go to:</span>
                    <select
                      value={currentPage}
                      onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                      className="px-3 py-1.5 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all duration-200"
                    >
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <option key={page} value={page} className="bg-slate-800 text-white">
                          Page {page}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mobile: Quick Page Numbers */}
                {totalPages <= 5 && (
                  <div className="flex justify-center space-x-1 sm:hidden">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-400/30 shadow-lg shadow-cyan-500/10'
                            : 'bg-gradient-to-r from-slate-600/30 to-slate-700/30 text-slate-300 hover:from-slate-500/30 hover:to-slate-600/30 hover:text-white border border-slate-500/20'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-slate-800/90 via-slate-700/90 to-slate-800/90 backdrop-blur-sm rounded-lg p-6 max-w-md w-full mx-4 border border-slate-600/30 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">User Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-300">Name</label>
                  <p className="text-white">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Email</label>
                  <p className="text-white">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Role</label>
                  <p className="text-white">{selectedUser.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Status</label>
                  <p className="text-white">{selectedUser.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Wallet Balance</label>
                  <p className="text-white">{formatCurrency(selectedUser.walletBalance)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Von Balance</label>
                  <p className="text-white">{formatVon(selectedUser.VonBalance)} Von</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Created</label>
                  <p className="text-white">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Last Login</label>
                  <p className="text-white">{formatDate(selectedUser.lastLogin)}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowUserModal(false)}
                  className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowUserModal(false);
                    handleEditUser(selectedUser);
                  }}
                  className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30"
                >
                  Edit User
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-slate-800/90 via-slate-700/90 to-slate-800/90 backdrop-blur-sm rounded-lg p-6 max-w-md w-full mx-4 border border-slate-600/30 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">Delete User</h3>
              <p className="text-slate-300 mb-6">
                Are you sure you want to delete <strong className="text-white">{selectedUser.name}</strong>? 
                This action cannot be undone and will permanently remove the user and all their data.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteUser}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 hover:from-red-600 hover:via-rose-600 hover:to-pink-700 text-white shadow-lg shadow-red-500/25 border border-red-400/30"
                >
                  {actionLoading ? 'Deleting...' : 'Delete User'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
      </div>
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';



