'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast } from '@/components/Toast';

const TRANSACTION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'ADD', label: 'Add' },
  { value: 'REMOVE', label: 'Remove' },
  { value: 'TRANSFER_OUT', label: 'Transfer Out' },
  { value: 'STAKING_REWARD', label: 'Staking Reward' },
  { value: 'MANUAL_ADJUST', label: 'Manual Adjust' }
];

export default function AdminReserveHistoryPage() {
  const { toasts, removeToast, showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentReserve, setCurrentReserve] = useState(0);

  // Filters
  const [transactionType, setTransactionType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userId, setUserId] = useState('');
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);

  // Fetch data
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (transactionType) params.append('transactionType', transactionType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (userId) params.append('userId', userId);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetch(`/api/admin/reserve-history?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setHistory(data.data.history);
        setStats(data.data.stats);
        setCurrentReserve(data.data.currentReserve);
      } else {
        showToast('error', data.error || 'Failed to load history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      showToast('error', 'Failed to load reserve history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [offset, limit]);

  const handleFilter = () => {
    setOffset(0);
    fetchHistory();
  };

  const handleReset = () => {
    setTransactionType('');
    setStartDate('');
    setEndDate('');
    setUserId('');
    setOffset(0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
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

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'ADD':
        return 'text-green-500';
      case 'REMOVE':
      case 'TRANSFER_OUT':
      case 'STAKING_REWARD':
        return 'text-red-500';
      case 'MANUAL_ADJUST':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getTransactionTypeBadge = (type) => {
    switch (type) {
      case 'ADD':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'REMOVE':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'TRANSFER_OUT':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'STAKING_REWARD':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'MANUAL_ADJUST':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Admin Reserve History
            </h1>
            <p className="text-slate-300 mt-2">
              Complete history of all admin reserve token movements
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-400">Current Reserve</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(currentReserve)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-400">Total Transactions</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {stats.totalTransactions.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-400">Total Added</div>
                  <div className="text-2xl font-bold text-green-400 mt-1">
                    +{formatCurrency(stats.totalAdded)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-400">Total Removed</div>
                  <div className="text-2xl font-bold text-red-400 mt-1">
                    -{formatCurrency(stats.totalRemoved)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 mb-6">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Transaction Type
                  </label>
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    className="w-full px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  >
                    {TRANSACTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value} className="bg-slate-800">
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    User ID (Optional)
                  </label>
                  <Input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter user ID"
                    className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <Button
                  onClick={handleFilter}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                >
                  Apply Filters
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50"
                >
                  Reset
                </Button>
                <Button
                  onClick={fetchHistory}
                  variant="outline"
                  className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50"
                >
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* History Table */}
          <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                  <p className="text-slate-300">Loading history...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">No history found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-600/30">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Type</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Purpose</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">User</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Admin</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Reserve Before</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Reserve After</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((item) => (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border-b border-slate-600/20 hover:bg-slate-700/20 transition-colors"
                          >
                            <td className="py-3 px-4 text-sm text-slate-300">
                              {formatDate(item.createdAt)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getTransactionTypeBadge(
                                  item.transactionType
                                )}`}
                              >
                                {item.transactionType.replace('_', ' ')}
                              </span>
                            </td>
                            <td
                              className={`py-3 px-4 text-sm font-semibold text-right ${getTransactionTypeColor(
                                item.transactionType
                              )}`}
                            >
                              {item.amount > 0 ? '+' : ''}
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-400 max-w-xs truncate" title={item.purpose}>
                              {item.purpose || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-300">
                              {item.userName || item.userEmail || (item.userId ? `User ${item.userId.substring(0, 8)}...` : 'N/A')}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-300">
                              {item.adminName || item.adminEmail || (item.adminId === 'SYSTEM' ? 'System' : item.adminId)}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-400 text-right">
                              {formatCurrency(item.reserveBefore)}
                            </td>
                            <td className="py-3 px-4 text-sm text-white font-medium text-right">
                              {formatCurrency(item.reserveAfter)}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-600/30">
                    <div className="text-sm text-slate-400">
                      Showing {offset + 1} to {offset + history.length} of {stats?.totalTransactions || 0} transactions
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                        disabled={offset === 0}
                        variant="outline"
                        className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() => setOffset(offset + limit)}
                        disabled={history.length < limit}
                        variant="outline"
                        className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}


