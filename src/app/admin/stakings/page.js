'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../lib/admin-auth';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import { useToast, ToastContainer } from '../../../components/Toast';

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CLAIMED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      {status}
    </span>
  );
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="border-b border-gray-200 animate-pulse">
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </td>
      </tr>
    ))}
  </>
);

export default function AdminStakingsPage() {
  const { adminUser } = useAdminAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // State
  const [stakings, setStakings] = useState([]);
  const [filteredStakings, setFilteredStakings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statistics, setStatistics] = useState({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (adminUser?.id) {
      fetchStakings();
    }
  }, [adminUser?.id]);

  // Fetch stakings
  const fetchStakings = async () => {
    try {
      setIsLoading(true);
      setErrorState(null);
      
      const response = await fetch('/api/admin/stakings');
      if (!response.ok) {
        throw new Error(`Failed to fetch stakings: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Admin stakings API response:', data);
      if (data.success) {
        console.log('🔍 Stakings received:', data.stakings);
        setStakings(data.stakings || []);
        setFilteredStakings(data.stakings || []);
        setStatistics(data.statistics || {});
      } else {
        throw new Error(data.error || 'Failed to load stakings');
      }
    } catch (err) {
      console.error('Error fetching stakings:', err);
      setErrorState(err.message || 'Failed to load stakings');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredStakings(stakings);
      return;
    }

    const filtered = stakings.filter(staking => {
      const userName = staking.user_name?.toLowerCase() || '';
      const userEmail = staking.user_email?.toLowerCase() || '';
      const userId = staking.userId?.toLowerCase() || '';
      const searchLower = term.toLowerCase();

      return userName.includes(searchLower) ||
             userEmail.includes(searchLower) ||
             userId.includes(searchLower);
    });

    setFilteredStakings(filtered);
  };

  // Handle mark as completed
  const handleMarkCompleted = async (stakingId) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/stakings/${stakingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'mark-completed' })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark staking as completed: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to mark staking as completed');
      }
      
      // Update local state
      setStakings(prev => 
        prev.map(s => 
          s.id === stakingId 
            ? { ...s, status: 'COMPLETED' }
            : s
        )
      );
      setFilteredStakings(prev => 
        prev.map(s => 
          s.id === stakingId 
            ? { ...s, status: 'COMPLETED' }
            : s
        )
      );
      
      success(`Staking marked as completed successfully!`);
    } catch (err) {
      console.error('Error marking staking as completed:', err);
      error(`Failed to mark staking as completed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject
  const handleReject = async (stakingId) => {
    if (!confirm('Are you sure you want to reject this staking? The staked amount will be refunded to the adminUser.')) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/stakings/${stakingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to reject staking: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to reject staking');
      }
      
      // Update local state
      setStakings(prev => 
        prev.map(s => 
          s.id === stakingId 
            ? { ...s, status: 'CANCELLED' }
            : s
        )
      );
      setFilteredStakings(prev => 
        prev.map(s => 
          s.id === stakingId 
            ? { ...s, status: 'CANCELLED' }
            : s
        )
      );
      
      success(`Staking rejected and refunded successfully!`);
    } catch (err) {
      console.error('Error rejecting staking:', err);
      error(`Failed to reject staking: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchStakings();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTiki = (amount) => {
    return `${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} TIKI`;
  };

  if (!mounted) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Staking Management</h1>
                <p className="mt-2 text-gray-600">
                  Manage user stakings and rewards
                </p>
              </div>
              <div className="flex space-x-4">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  disabled={isLoading}
                >
                  <span className="mr-2">🔄</span>
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Stakings</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.total || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.active || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.completed || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Staked</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatTiki(statistics.totalStaked || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="max-w-md">
              <input
                type="text"
                placeholder="Search by user name, email, or ID..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Stakings Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Staking Requests ({filteredStakings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {errorState ? (
                <div className="text-center py-8">
                  <div className="text-red-500 text-4xl mb-4">⚠️</div>
                  <p className="text-red-600 mb-4">{errorState}</p>
                  <Button onClick={handleRefresh} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount Staked
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reward %
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Start Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          End Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoading ? (
                        <LoadingSkeleton />
                      ) : filteredStakings.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                            No stakings found
                          </td>
                        </tr>
                      ) : (
                        filteredStakings.map((staking) => (
                          <tr key={staking.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 text-sm font-medium">
                                      {staking.user_name ? staking.user_name.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-gray-900 truncate" title={staking.user_name || 'Unknown User'}>
                                    {staking.user_name || 'Unknown User'}
                                  </div>
                                  <div className="text-gray-500 text-xs truncate" title={staking.user_email || 'No email available'}>
                                    {staking.user_email || 'No email available'}
                                  </div>
                                  <div className="text-gray-400 text-xs">
                                    ID: {staking.userId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {formatTiki(staking.amountStaked)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {staking.durationDays} Days
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {staking.rewardPercent}%
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatDate(staking.startDate)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatDate(staking.endDate)}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={staking.status} />
                            </td>
                            <td className="px-4 py-3">
                              {staking.status === 'ACTIVE' ? (
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleMarkCompleted(staking.id)}
                                    disabled={isProcessing}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Mark Completed
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReject(staking.id)}
                                    disabled={isProcessing}
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                  >
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">No actions</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';

