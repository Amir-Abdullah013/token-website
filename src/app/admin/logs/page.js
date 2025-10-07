'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminHelpers } from '@/lib/database';
import { authHelpers } from '@/lib/supabase';;
import { Button, Card, Input, Loader, Toast } from '@/components';
import { formatDistanceToNow } from 'date-fns';

export default function AdminLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [uniqueAdmins, setUniqueAdmins] = useState([]);

  useEffect(() => {
    loadUserAndLogs();
  }, []);

  const loadUserAndLogs = async () => {
    try {
      setLoading(true);
      const currentUser = await authHelpers.getCurrentUser();
      
      if (!currentUser) {
        router.push('/auth/signin');
        return;
      }

      setUser(currentUser);
      
      // Load admin logs and stats
      const [adminLogs, logStats] = await Promise.all([
        databaseHelpers.admin.getAdminLogs(50, 0),
        databaseHelpers.admin.getAdminLogStats()
      ]);
      
      setLogs(adminLogs);
      setStats(logStats);
      
      // Extract unique admins for filter
      const admins = [...new Set(adminLogs.map(log => log.adminId))];
      setUniqueAdmins(admins);
      
    } catch (error) {
      console.error('Error loading admin logs:', error);
      setToast({
        type: 'error',
        message: 'Failed to load admin logs'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadUserAndLogs();
      return;
    }

    try {
      setSearching(true);
      const searchResults = await databaseHelpers.admin.searchAdminLogs(searchTerm, 50, 0);
      setLogs(searchResults);
    } catch (error) {
      console.error('Error searching admin logs:', error);
      setToast({
        type: 'error',
        message: 'Failed to search admin logs'
      });
    } finally {
      setSearching(false);
    }
  };

  const handleFilterByAdmin = async (adminId) => {
    setSelectedAdmin(adminId);
    
    if (!adminId) {
      loadUserAndLogs();
      return;
    }

    try {
      setLoading(true);
      const adminLogs = await databaseHelpers.admin.getAdminLogsByAdmin(adminId, 50, 0);
      setLogs(adminLogs);
    } catch (error) {
      console.error('Error filtering by admin:', error);
      setToast({
        type: 'error',
        message: 'Failed to filter admin logs'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedAdmin('');
    loadUserAndLogs();
  };

  const getActionIcon = (action) => {
    if (action.toLowerCase().includes('approve')) return '✅';
    if (action.toLowerCase().includes('reject')) return '❌';
    if (action.toLowerCase().includes('create')) return '➕';
    if (action.toLowerCase().includes('update')) return '✏️';
    if (action.toLowerCase().includes('delete')) return '🗑️';
    if (action.toLowerCase().includes('login')) return '🔐';
    if (action.toLowerCase().includes('logout')) return '🚪';
    return '📝';
  };

  const getActionColor = (action) => {
    if (action.toLowerCase().includes('approve')) return 'text-green-600';
    if (action.toLowerCase().includes('reject')) return 'text-red-600';
    if (action.toLowerCase().includes('create')) return 'text-blue-600';
    if (action.toLowerCase().includes('update')) return 'text-yellow-600';
    if (action.toLowerCase().includes('delete')) return 'text-red-600';
    if (action.toLowerCase().includes('login')) return 'text-green-600';
    if (action.toLowerCase().includes('logout')) return 'text-gray-600';
    return 'text-gray-600';
  };

  if (loading && !logs.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Activity Logs</h1>
              <p className="text-gray-600 mt-2">
                Monitor and audit all admin activities for transparency
              </p>
            </div>
            <Button
              onClick={() => router.push('/admin/dashboard')}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-blue-50 border-blue-200">
              <div className="text-center p-6">
                <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-blue-800 font-medium">Total Actions</div>
              </div>
            </Card>
            
            <Card className="bg-green-50 border-green-200">
              <div className="text-center p-6">
                <div className="text-3xl font-bold text-green-600">{stats.recent}</div>
                <div className="text-green-800 font-medium">Last 24 Hours</div>
              </div>
            </Card>
            
            <Card className="bg-purple-50 border-purple-200">
              <div className="text-center p-6">
                <div className="text-3xl font-bold text-purple-600">{stats.uniqueAdmins}</div>
                <div className="text-purple-800 font-medium">Active Admins</div>
              </div>
            </Card>
          </div>
        )}

        {/* Search and Filter */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Actions
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by action, admin ID, or details..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={searching}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>

              {/* Filter by Admin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Admin
                </label>
                <select
                  value={selectedAdmin}
                  onChange={(e) => handleFilterByAdmin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Admins</option>
                  {uniqueAdmins.map((adminId) => (
                    <option key={adminId} value={adminId}>
                      {adminId}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  onClick={handleClearFilters}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Logs List */}
        {logs.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No admin logs found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedAdmin 
                ? 'No logs match your search criteria. Try adjusting your filters.' 
                : 'Admin activity logs will appear here once admins start performing actions.'
              }
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.$id} className="hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl">
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-lg font-semibold ${getActionColor(log.action)}`}>
                          {log.action}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Admin ID:</span> {log.adminId}
                        </div>
                        <div>
                          <span className="font-medium">Target:</span> {log.targetType} - {log.targetId}
                        </div>
                        {log.details && (
                          <div className="md:col-span-2">
                            <span className="font-medium">Details:</span> {log.details}
                          </div>
                        )}
                        {log.ipAddress && (
                          <div>
                            <span className="font-medium">IP:</span> {log.ipAddress}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Time:</span> {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {logs.length >= 50 && (
          <div className="mt-8 text-center">
            <Button
              onClick={() => {
                // Implement pagination if needed
                setToast({
                  type: 'info',
                  message: 'Load more functionality can be implemented here'
                });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Load More Logs
            </Button>
          </div>
        )}

        {/* Export Button */}
        <div className="mt-8">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
              <div className="flex space-x-4">
                <Button
                  onClick={() => {
                    setToast({
                      type: 'info',
                      message: 'Export functionality can be implemented here'
                    });
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Export to CSV
                </Button>
                <Button
                  onClick={() => {
                    setToast({
                      type: 'info',
                      message: 'PDF export functionality can be implemented here'
                    });
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Export to PDF
                </Button>
              </div>
            </div>
          </Card>
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













