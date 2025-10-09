'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Removed direct database import - using API calls instead
import { authHelpers } from '@/lib/supabase';;
import { Button, Card, Loader, Toast } from '@/components';

export default function TestAdminLogsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
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
        databaseHelpers.admin.getAdminLogs(10, 0),
        databaseHelpers.admin.getAdminLogStats()
      ]);
      
      setLogs(adminLogs);
      setStats(logStats);
      
    } catch (error) {
      console.error('Error loading admin data:', error);
      setToast({
        type: 'error',
        message: 'Failed to load admin data'
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestLog = async (action) => {
    try {
      await databaseHelpers.admin.logAdminAction(
        user.id,
        action,
        'test',
        'test-id',
        'This is a test admin action for demonstration purposes'
      );
      
      setToast({
        type: 'success',
        message: `Test log created: ${action}`
      });
      
      // Reload logs
      loadUserData();
      
    } catch (error) {
      console.error('Error creating test log:', error);
      setToast({
        type: 'error',
        message: 'Failed to create test log'
      });
    }
  };

  const testActions = [
    'Approved withdrawal of 500 PKR for user X',
    'Rejected deposit request from user Y',
    'Created new notification for all users',
    'Updated user profile for admin Z',
    'Deleted suspicious transaction record',
    'Logged in to admin panel',
    'Logged out from admin panel',
    'Exported user data to CSV',
    'Changed system settings',
    'Viewed transaction details'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Test Admin Logs System</h1>
          <p className="text-gray-600 mt-2">
            Test the admin activity logging system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Actions */}
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Test Logs</h3>
                <div className="space-y-3">
                  {testActions.map((action, index) => (
                    <Button
                      key={index}
                      onClick={() => createTestLog(action)}
                      className="w-full text-left justify-start bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      📝 {action}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/admin/logs')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    📋 View All Admin Logs
                  </Button>
                  
                  <Button
                    onClick={loadUserData}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    🔄 Refresh Data
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Current Logs */}
          <div className="space-y-6">
            {/* Stats */}
            {stats && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Statistics</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                      <div className="text-sm text-gray-600">Total Logs</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.recent}</div>
                      <div className="text-sm text-gray-600">Last 24h</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{stats.uniqueAdmins}</div>
                      <div className="text-sm text-gray-600">Admins</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Recent Logs */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Admin Logs</h3>
                {logs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📋</div>
                    <p className="text-gray-600">No admin logs found</p>
                    <p className="text-sm text-gray-500 mt-1">Create some test logs to see them here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.slice(0, 5).map((log) => (
                      <div
                        key={log.$id}
                        className="p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-lg">
                            {log.action.toLowerCase().includes('approve') ? '✅' :
                             log.action.toLowerCase().includes('reject') ? '❌' :
                             log.action.toLowerCase().includes('create') ? '➕' :
                             log.action.toLowerCase().includes('update') ? '✏️' :
                             log.action.toLowerCase().includes('delete') ? '🗑️' :
                             log.action.toLowerCase().includes('login') ? '🔐' :
                             log.action.toLowerCase().includes('logout') ? '🚪' : '📝'}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {log.action}
                            </h4>
                            <div className="text-xs text-gray-500 mt-1">
                              <div>Admin: {log.adminId}</div>
                              <div>Time: {new Date(log.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-8">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Logs Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">✅ Implemented Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• AdminLogs collection with proper schema</li>
                    <li>• Automatic logging of admin actions</li>
                    <li>• Admin logs list page with search/filter</li>
                    <li>• Search by action, admin ID, or details</li>
                    <li>• Filter by specific admin</li>
                    <li>• Statistics dashboard</li>
                    <li>• Real-time log viewing</li>
                    <li>• Export functionality (placeholder)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">🔧 Test Instructions</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Click "Create Test Logs" buttons above</li>
                    <li>• Visit /admin/logs to see full interface</li>
                    <li>• Test search functionality</li>
                    <li>• Test filter by admin</li>
                    <li>• Check statistics updates</li>
                    <li>• Verify log details and timestamps</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <Button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            Back to Admin Dashboard
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


















