import { redirect } from 'next/navigation';
import { getServerSession, getUserRole } from '../../../lib/session';
import Layout from '../../../components/Layout';
import AdminStats from '../../../components/AdminStats';
import Button from '../../../components/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';

export default async function AdminDashboard() {
  // Check authentication server-side
  const user = await getServerSession();
  if (!user) {
    redirect('/auth/signin');
  }

  // Check user role - must be admin
  const userRole = await getUserRole(user);
  if (userRole !== 'admin') {
    redirect('/user/dashboard');
  }

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.name}! Manage your application.</p>
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
                    <p className="text-3xl font-bold text-blue-900 mb-1">1,234</p>
                    <p className="text-sm text-blue-700">+12.5% from last month</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-green-900">Active Users</h3>
                      <span className="text-2xl">✅</span>
                    </div>
                    <p className="text-3xl font-bold text-green-900 mb-1">987</p>
                    <p className="text-sm text-green-700">80% of total users</p>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-3">
                  <Button 
                    variant="primary"
                    onClick={() => window.location.href = '/admin/users'}
                  >
                    Manage Users
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/admin/users?action=add'}
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
                    <p className="text-2xl font-bold text-emerald-900">$2.4M</p>
                    <p className="text-sm text-emerald-700">+15.2% this month</p>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-1">Total Withdrawals</h3>
                    <p className="text-2xl font-bold text-red-900">$1.8M</p>
                    <p className="text-sm text-red-700">+7.1% this month</p>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-yellow-900 mb-1">Pending</h3>
                    <p className="text-2xl font-bold text-yellow-900">23</p>
                    <p className="text-sm text-yellow-700">awaiting approval</p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    variant="primary"
                    onClick={() => window.location.href = '/admin/transactions'}
                  >
                    View All Transactions
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/admin/deposits'}
                  >
                    Manage Deposits
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/admin/withdrawals'}
                  >
                    Manage Withdrawals
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="font-medium">API Status</span>
                    </div>
                    <span className="text-green-600 font-medium">Online</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="font-medium">Database</span>
                    </div>
                    <span className="text-green-600 font-medium">Healthy</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="font-medium">Backup Status</span>
                    </div>
                    <span className="text-yellow-600 font-medium">Pending</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <button 
                    onClick={() => window.location.href = '/admin/users'}
                    className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">👥</span>
                      <span className="font-medium">Manage Users</span>
                    </div>
                    <span className="text-blue-600">→</span>
                  </button>

                  <button 
                    onClick={() => window.location.href = '/admin/wallets'}
                    className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">💼</span>
                      <span className="font-medium">View Wallets</span>
                    </div>
                    <span className="text-green-600">→</span>
                  </button>

                  <button 
                    onClick={() => window.location.href = '/admin/transactions'}
                    className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📋</span>
                      <span className="font-medium">View Transactions</span>
                    </div>
                    <span className="text-purple-600">→</span>
                  </button>

                  <button 
                    onClick={() => window.location.href = '/admin/profile'}
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
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm">New user registered</span>
                    </div>
                    <span className="text-xs text-gray-500">2m ago</span>
                  </div>

                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm">Large deposit processed</span>
                    </div>
                    <span className="text-xs text-gray-500">15m ago</span>
                  </div>

                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="text-sm">Withdrawal pending approval</span>
                    </div>
                    <span className="text-xs text-gray-500">1h ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

