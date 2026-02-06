'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import { useToast, ToastContainer } from '@/components/Toast';
import { TrendingUp, Users, Gift, DollarSign, Calendar, CheckCircle, Clock } from 'lucide-react';

export default function AdminAdsPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // Data state
  const [allAdRewards, setAllAdRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRewards: 0,
    totalTokensDistributed: 0,
    totalUsers: 0,
    todayRewards: 0,
    todayTokens: 0
  });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchAdRewards();
      fetchStats();
    }
  }, [isAuthenticated, user?.role]);

  const fetchAdRewards = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/ads/all');
      if (response.ok) {
        const data = await response.json();
        setAllAdRewards(data.rewards || []);
      }
    } catch (err) {
      console.error('Error fetching ad rewards:', err);
      error('Failed to load ad rewards');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/ads/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  // Filter rewards
  const filteredRewards = allAdRewards.filter(reward => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const userName = reward.user?.name?.toLowerCase() || '';
      const userEmail = reward.user?.email?.toLowerCase() || '';
      const userId = reward.userId?.toLowerCase() || '';
      
      if (!userName.includes(searchLower) && 
          !userEmail.includes(searchLower) && 
          !userId.includes(searchLower)) {
        return false;
      }
    }

    // Date filter
    if (dateFilter !== 'all') {
      const rewardDate = new Date(reward.createdAt);
      const now = new Date();
      const diffDays = (now - rewardDate) / (1000 * 60 * 60 * 24);
      
      if (dateFilter === '1d' && diffDays > 1) return false;
      if (dateFilter === '7d' && diffDays > 7) return false;
      if (dateFilter === '30d' && diffDays > 30) return false;
    }

    return true;
  });

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    router.push('/user/dashboard');
    return null;
  }

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Ad Rewards Management
              </h1>
              <p className="text-slate-300 mt-1">Monitor and track all user ad rewards</p>
            </div>
            <Button
              onClick={() => {
                fetchAdRewards();
                fetchStats();
              }}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
            >
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-emerald-500/30 via-green-500/30 to-teal-500/30 border border-emerald-400/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm text-white flex items-center">
                <Gift className="h-4 w-4 mr-2" />
                Total Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.totalRewards.toLocaleString()}
              </div>
              <p className="text-emerald-200 text-xs mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/30 via-blue-500/30 to-indigo-500/30 border border-cyan-400/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm text-white flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatNumber(stats.totalTokensDistributed)} Points
              </div>
              <p className="text-cyan-200 text-xs mt-1">Distributed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500/30 via-purple-500/30 to-indigo-500/30 border border-violet-400/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm text-white flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.totalUsers.toLocaleString()}
              </div>
              <p className="text-violet-200 text-xs mt-1">Watching ads</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/30 via-orange-500/30 to-yellow-500/30 border border-amber-400/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm text-white flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Today's Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.todayRewards.toLocaleString()}
              </div>
              <p className="text-amber-200 text-xs mt-1">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500/30 via-pink-500/30 to-purple-500/30 border border-rose-400/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm text-white flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Today's Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatNumber(stats.todayTokens)} Points
              </div>
              <p className="text-rose-200 text-xs mt-1">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Search User
                </label>
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Time Range
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                >
                  <option value="all" className="bg-slate-800">All Time</option>
                  <option value="1d" className="bg-slate-800">Last 24 Hours</option>
                  <option value="7d" className="bg-slate-800">Last 7 Days</option>
                  <option value="30d" className="bg-slate-800">Last 30 Days</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Table */}
        <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              All Ad Rewards ({filteredRewards.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                <p className="text-slate-400">Loading rewards...</p>
              </div>
            ) : filteredRewards.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No ad rewards found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-600/30">
                  <thead className="bg-gradient-to-r from-slate-700/30 to-slate-800/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Reward
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Provider
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gradient-to-br from-slate-800/20 to-slate-900/20 divide-y divide-slate-600/20">
                    {filteredRewards.map((reward) => (
                      <tr key={reward.id} className="hover:bg-slate-700/20 transition-colors duration-150">
                        <td className="px-4 py-3 text-sm text-white">
                          {reward.user?.name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {reward.user?.email || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-amber-400">
                          +{formatNumber(parseFloat(reward.reward))} Points
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {formatDate(reward.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {reward.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-cyan-300">
                          {  'Adsterra'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}
