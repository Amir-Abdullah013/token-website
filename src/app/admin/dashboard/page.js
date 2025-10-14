'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../lib/admin-auth';
import Layout from '../../../components/Layout';
import AdminRoute from '../../../components/AdminRoute';

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
      console.log('📊 Fetching admin dashboard data...');
      
      // Fetch admin stats
      const statsResponse = await fetch('/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('✅ Admin stats received:', statsData);
        
        if (statsData.success) {
          setDashboardData(prev => ({
            ...prev,
            totalUsers: statsData.totalUsers || 0,
            activeUsers: statsData.activeWallets || 0,
            totalDeposits: statsData.totalDeposits || 0,
            totalWithdrawals: statsData.totalWithdrawals || 0,
            pendingTransactions: statsData.pendingTransactions || 0,
            verifiedUsers: statsData.verifiedUsers || 0,
            totalBalance: statsData.totalBalance || 0,
            totalTikiBalance: statsData.totalTikiBalance || 0
          }));
        } else {
          console.warn('⚠️ Admin stats API returned error:', statsData.error);
        }
      } else {
        console.error('❌ Failed to fetch admin stats:', statsResponse.status);
      }
      
      // Fetch recent activity from real API
      try {
        const activityResponse = await fetch('/api/admin/recent-activity');
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          if (activityData.success) {
            setDashboardData(prev => ({
              ...prev,
              recentActivity: activityData.activities || []
            }));
          }
        }
      } catch (activityError) {
        console.warn('⚠️ Could not fetch recent activity, using fallback:', activityError);
        
        // Fallback recent activity
        const recentActivity = [
          { type: 'user', message: 'New user registered', time: '2m ago', status: 'success' },
          { type: 'deposit', message: 'Large deposit processed', time: '15m ago', status: 'info' },
          { type: 'withdrawal', message: 'Withdrawal pending approval', time: '1h ago', status: 'warning' }
        ];
        
        setDashboardData(prev => ({
          ...prev,
          recentActivity
        }));
      }
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // AdminRoute component handles authentication, so we don't need to check here

  return (
    <AdminRoute>
      <Layout showSidebar={true}>
        <div className="max-w-7xl mx-auto">
        {/* Premium Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Admin Dashboard</h1>
          <p className="text-slate-300 mt-2">Welcome back, {adminUser?.name || 'Admin'}! Manage your application.</p>
        </div>

      

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Management Cards - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            {/* Premium User Management */}
            <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 rounded-lg border border-cyan-400/30 hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-cyan-200">Total Users</h3>
                      <span className="text-2xl">👥</span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{dashboardData.totalUsers.toLocaleString()}</p>
                    <p className="text-sm text-cyan-300">Total registered users</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 rounded-lg border border-emerald-400/30 hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-emerald-200">Active Users</h3>
                      <span className="text-2xl">✅</span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{dashboardData.activeUsers.toLocaleString()}</p>
                    <p className="text-sm text-emerald-300">Users with active wallets</p>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-3">
                  <Button 
                    variant="primary"
                    onClick={() => router.push('/admin/users')}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30"
                  >
                    Manage Users
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/admin/users?action=add')}
                    className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                  >
                    Add New User
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Premium Transaction Management */}
            <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Transaction Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 rounded-lg border border-emerald-400/30 hover:scale-105 transition-all duration-300">
                    <h3 className="font-semibold text-emerald-200 mb-1">Total Deposits</h3>
                    <p className="text-2xl font-bold text-white">${dashboardData.totalDeposits.toLocaleString()}</p>
                    <p className="text-sm text-emerald-300">Total deposits processed</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-red-500/20 via-rose-500/20 to-pink-500/20 rounded-lg border border-red-400/30 hover:scale-105 transition-all duration-300">
                    <h3 className="font-semibold text-red-200 mb-1">Total Withdrawals</h3>
                    <p className="text-2xl font-bold text-white">${dashboardData.totalWithdrawals.toLocaleString()}</p>
                    <p className="text-sm text-red-300">Total withdrawals processed</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 rounded-lg border border-amber-400/30 hover:scale-105 transition-all duration-300">
                    <h3 className="font-semibold text-amber-200 mb-1">Pending</h3>
                    <p className="text-2xl font-bold text-white">{dashboardData.pendingTransactions}</p>
                    <p className="text-sm text-amber-300">transactions pending</p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    variant="primary"
                    onClick={() => router.push('/admin/transactions')}
                    className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg shadow-violet-500/25 border border-violet-400/30"
                  >
                    View All Transactions
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/admin/deposits')}
                    className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                  >
                    Manage Deposits
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      console.log('Admin Dashboard: Navigating to withdrawals page');
                      router.push('/admin/withdrawals');
                    }}
                    className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                  >
                    Manage Withdrawals
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
           
            

            {/* Premium Quick Actions */}
            <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/admin/users')}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 rounded-lg border border-cyan-400/30 transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">👥</span>
                      <span className="font-medium text-cyan-200">Manage Users</span>
                    </div>
                    <span className="text-cyan-400">→</span>
                  </button>

                  <button 
                    onClick={() => router.push('/admin/transactions')}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 rounded-lg border border-emerald-400/30 transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">💳</span>
                      <span className="font-medium text-emerald-200">Manage Transactions</span>
                    </div>
                    <span className="text-emerald-400">→</span>
                  </button>

                  <button 
                    onClick={() => router.push('/admin/notifications')}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-violet-500/20 to-purple-500/20 hover:from-violet-500/30 hover:to-purple-500/30 rounded-lg border border-violet-400/30 transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📢</span>
                      <span className="font-medium text-violet-200">Manage Notifications</span>
                    </div>
                    <span className="text-violet-400">→</span>
                  </button>

                  <button 
                    onClick={() => router.push('/admin/transactions')}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-rose-500/20 to-pink-500/20 hover:from-rose-500/30 hover:to-pink-500/30 rounded-lg border border-rose-400/30 transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📋</span>
                      <span className="font-medium text-rose-200">View Transactions</span>
                    </div>
                    <span className="text-rose-400">→</span>
                  </button>

                  <button 
                    onClick={() => router.push('/admin/profile')}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-slate-500/20 to-gray-500/20 hover:from-slate-500/30 hover:to-gray-500/30 rounded-lg border border-slate-400/30 transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">👤</span>
                      <span className="font-medium text-slate-200">Admin Profile</span>
                    </div>
                    <span className="text-slate-400">→</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Premium Recent Activity */}
            <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded-lg border border-slate-600/30 hover:scale-105 transition-all duration-300">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          activity.status === 'success' ? 'bg-emerald-500' :
                          activity.status === 'info' ? 'bg-cyan-500' :
                          activity.status === 'warning' ? 'bg-amber-500' : 'bg-slate-500'
                        }`}></div>
                        <span className="text-sm text-slate-200">{activity.message}</span>
                      </div>
                      <span className="text-xs text-slate-400">{activity.time}</span>
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

// Disable prerendering for this page
export const dynamic = 'force-dynamic';
export const ssr = false;


