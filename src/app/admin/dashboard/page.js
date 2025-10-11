'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../lib/admin-auth';
import Layout from '../../../components/Layout';
import AdminRoute from '../../../components/AdminRoute';
import AdminStats from '../../../components/AdminStats';
import Button from '../../../components/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';

export default function AdminDashboard() {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingTransactions: 0,
    recentActivity: []
  });
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsDataLoading(true);
      
      // Fetch admin stats
      const statsResponse = await fetch('/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setDashboardData(prev => ({
          ...prev,
          totalUsers: statsData.totalUsers || 0,
          activeUsers: statsData.activeWallets || 0,
          totalDeposits: statsData.totalDeposits || 0,
          totalWithdrawals: statsData.totalWithdrawals || 0,
          pendingTransactions: statsData.pendingTransactions || 0
        }));
      }
      
      // Fetch recent activity (mock for now, can be replaced with real API)
      const recentActivity = [
        { type: 'user', message: 'New user registered', time: '2m ago', status: 'success' },
        { type: 'deposit', message: 'Large deposit processed', time: '15m ago', status: 'info' },
        { type: 'withdrawal', message: 'Withdrawal pending approval', time: '1h ago', status: 'warning' }
      ];
      
      setDashboardData(prev => ({
        ...prev,
        recentActivity
      }));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
        return;
      }
      
      // Check if user is admin (you can implement this check)
      // For now, we'll assume the user is admin if they can access this page
      console.log('Admin Dashboard: User session found:', {
        id: adminUser?.id,
        email: adminUser?.email,
        name: adminUser?.name
      });
      
      // Fetch dashboard data
      fetchDashboardData();
    }
  }, [mounted, isLoading, isAuthenticated, adminUser, router]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // AdminRoute component handles authentication, so we don't need to check here

  return (
    <AdminRoute>
      <Layout showSidebar={true}>
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {adminUser?.name || 'Admin'}! Manage your application.</p>
        </div>

        {/* Admin Stats */}
        <div className="mb-8">
          <AdminStats />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Management Cards - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Management */}
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-blue-900">Total Users</h3>
                      <span className="text-2xl">👥</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-900 mb-1">{dashboardData.totalUsers.toLocaleString()}</p>
                    <p className="text-sm text-blue-700">Total registered users</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-green-900">Active Users</h3>
                      <span className="text-2xl">✅</span>
                    </div>
                    <p className="text-3xl font-bold text-green-900 mb-1">{dashboardData.activeUsers.toLocaleString()}</p>
                    <p className="text-sm text-green-700">Users with active wallets</p>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-3">
                  <Button 
                    variant="primary"
                    onClick={() => router.push('/admin/users')}
                  >
                    Manage Users
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/admin/users?action=add')}
                  >
                    Add New User
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Management */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <h3 className="font-semibold text-emerald-900 mb-1">Total Deposits</h3>
                    <p className="text-2xl font-bold text-emerald-900">${dashboardData.totalDeposits.toLocaleString()}</p>
                    <p className="text-sm text-emerald-700">Total deposits processed</p>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-1">Total Withdrawals</h3>
                    <p className="text-2xl font-bold text-red-900">${dashboardData.totalWithdrawals.toLocaleString()}</p>
                    <p className="text-sm text-red-700">Total withdrawals processed</p>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-yellow-900 mb-1">Pending</h3>
                    <p className="text-2xl font-bold text-yellow-900">{dashboardData.pendingTransactions}</p>
                    <p className="text-sm text-yellow-700">transactions pending</p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    variant="primary"
                    onClick={() => router.push('/admin/transactions')}
                  >
                    View All Transactions
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/admin/deposits')}
                  >
                    Manage Deposits
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      console.log('Admin Dashboard: Navigating to withdrawals page');
                      router.push('/admin/withdrawals');
                    }}
                  >
                    Manage Withdrawals
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
           
            

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/admin/users')}
                    className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">👥</span>
                      <span className="font-medium">Manage Users</span>
                    </div>
                    <span className="text-blue-600">→</span>
                  </button>

                  <button 
                    onClick={() => router.push('/admin/transactions')}
                    className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">💳</span>
                      <span className="font-medium">Manage Transactions</span>
                    </div>
                    <span className="text-green-600">→</span>
                  </button>

                  <button 
                    onClick={() => router.push('/admin/notifications')}
                    className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📢</span>
                      <span className="font-medium">Manage Notifications</span>
                    </div>
                    <span className="text-purple-600">→</span>
                  </button>

                  <button 
                    onClick={() => router.push('/admin/wallets')}
                    className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">💼</span>
                      <span className="font-medium">View Wallets</span>
                    </div>
                    <span className="text-green-600">→</span>
                  </button>

                  <button 
                    onClick={() => router.push('/admin/transactions')}
                    className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📋</span>
                      <span className="font-medium">View Transactions</span>
                    </div>
                    <span className="text-purple-600">→</span>
                  </button>

                  <button 
                    onClick={() => router.push('/admin/profile')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">👤</span>
                      <span className="font-medium">Admin Profile</span>
                    </div>
                    <span className="text-gray-600">→</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-2">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          activity.status === 'success' ? 'bg-green-500' :
                          activity.status === 'info' ? 'bg-blue-500' :
                          activity.status === 'warning' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="text-sm">{activity.message}</span>
                      </div>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
    </AdminRoute>
  );
}

