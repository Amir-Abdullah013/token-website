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
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/30';
      case 'pending':
        return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-400/30';
      case 'rejected':
      case 'failed':
        return 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border border-red-400/30';
      default:
        return 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-300 border border-slate-400/30';
    }
  };

  const getStatusIcon = () => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'rejected':
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      <span className="mr-1">{getStatusIcon()}</span>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

// User details component
const UserDetails = ({ user, userId }) => {
  if (!user || !user.name) {
    return (
      <div className="text-slate-400 text-sm">
        <div className="font-medium">Unknown User</div>
        <div className="text-xs">ID: {userId}</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="font-medium text-white">{user.name}</div>
      <div className="text-slate-300 text-xs">{user.email}</div>
      <div className="text-slate-400 text-xs">ID: {userId}</div>
    </div>
  );
};

// Transaction row component
const TransactionRow = ({ transaction, onApprove, onReject, isProcessing }) => {
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

  const formatAmount = (amount, currency = 'USD') => {
    const symbol = currency === 'USD' ? '$' : currency;
    return `${symbol}${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <tr className="hover:bg-slate-700/20 transition-colors duration-150">
      <td className="px-4 py-3 text-sm text-white">
        {formatDate(transaction.createdAt)}
      </td>
      <td className="px-4 py-3 text-sm text-white">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center border border-cyan-400/30">
              <span className="text-cyan-300 text-sm font-medium">
                {transaction.user?.name ? transaction.user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-white truncate" title={transaction.user?.name || 'Unknown User'}>
              {transaction.user?.name || 'Unknown User'}
            </div>
            <div className="text-slate-300 text-xs truncate" title={transaction.user?.email || 'No email available'}>
              {transaction.user?.email || 'No email available'}
            </div>
            <div className="text-slate-400 text-xs">
              ID: {transaction.userId}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-white">
        {formatAmount(transaction.amount, transaction.currency)}
      </td>
      <td className="px-4 py-3 text-sm text-slate-300">
        {transaction.binanceAddress ? (
          <div className="max-w-xs truncate" title={transaction.binanceAddress}>
            {transaction.binanceAddress}
          </div>
        ) : (
          'N/A'
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={transaction.status} />
      </td>
      <td className="px-4 py-3">
        {transaction.status === 'PENDING' ? (
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => onApprove(transaction.id)}
              disabled={isProcessing}
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30"
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(transaction.id)}
              disabled={isProcessing}
              className="bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border border-red-400/30 hover:from-red-500/30 hover:to-rose-500/30 hover:text-white"
            >
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-sm text-slate-400">No actions</span>
        )}
      </td>
    </tr>
  );
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="border-b border-slate-600/20 animate-pulse">
        <td className="px-4 py-3">
          <div className="h-4 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded w-32"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded w-24"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded w-20"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded w-16"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-6 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded-full w-20"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-8 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded w-24"></div>
        </td>
      </tr>
    ))}
  </>
);

export default function AdminWithdrawalsPage() {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // State
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('Admin Withdrawals Page: Component mounted');
    setMounted(true);
  }, []);

  // Fetch pending withdrawals
  const fetchWithdrawals = async () => {
    try {
      setIsDataLoading(true);
      setErrorState(null);
      
      const response = await fetch('/api/admin/withdrawals');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch withdrawals: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const withdrawals = data.withdrawals || [];
        setTransactions(withdrawals);
        setFilteredTransactions(withdrawals);
      } else {
        throw new Error(data.error || 'Failed to load withdrawals');
      }
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
      setErrorState(err.message || 'Failed to load withdrawals');
    } finally {
      setIsDataLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (mounted && adminUser?.id) {
      console.log('Admin Withdrawals Page: Starting to fetch withdrawals for user:', adminUser.id);
      fetchWithdrawals();
    }
  }, [mounted, adminUser?.id]);

  // Handle approve
  const handleApprove = async (transactionId) => {
    if (!adminUser?.id) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve withdrawal');
      }

      // Update local state
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, status: 'APPROVED' }
            : t
        )
      );
      
      success(`Withdrawal approved successfully!`);
    } catch (err) {
      console.error('Error approving withdrawal:', err);
      error(`Failed to approve withdrawal: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject
  const handleReject = async (transactionId) => {
    if (!adminUser?.id) return;
    
    const reason = prompt('Please enter reason for rejection (optional):');
    if (reason === null) return; // User cancelled
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject', reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject withdrawal');
      }

      // Update local state
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, status: 'REJECTED' }
            : t
        )
      );
      
      success(`Withdrawal rejected successfully.`);
    } catch (err) {
      console.error('Error rejecting withdrawal:', err);
      error(`Failed to reject withdrawal: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchWithdrawals();
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredTransactions(transactions);
      return;
    }

    const filtered = transactions.filter(transaction => {
      const userName = transaction.user?.name?.toLowerCase() || '';
      const userEmail = transaction.user?.email?.toLowerCase() || '';
      const userId = transaction.userId?.toLowerCase() || '';
      const searchLower = term.toLowerCase();

      return userName.includes(searchLower) || 
             userEmail.includes(searchLower) || 
             userId.includes(searchLower);
    });

    setFilteredTransactions(filtered);
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-300 mb-4">Please sign in to access this page.</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-md hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/25 border border-cyan-400/30"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-400 via-pink-400 to-red-400 bg-clip-text text-transparent">Withdrawal Requests</h1>
              <p className="text-slate-300 mt-1">Manage user withdrawal requests</p>
              <p className="text-sm text-emerald-400 mt-1">✅ Page loaded successfully</p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={isLoading}
                className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
              >
                <span className="mr-2">🔄</span>
                Refresh
              </Button>
              <Button
                onClick={() => router.push('/admin/transactions')}
                variant="outline"
                className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 hover:from-violet-500/30 hover:to-purple-500/30 hover:text-white border border-violet-400/30"
              >
                View All Transactions
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-lg border border-amber-400/30">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-amber-200">Pending</p>
                  <p className="text-2xl font-bold text-white">
                    {transactions.filter(t => t.status === 'PENDING').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/20 via-rose-500/20 to-pink-500/20 border border-red-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-red-500/30 to-rose-500/30 rounded-lg border border-red-400/30">
                  <span className="text-2xl">💸</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-200">Total Amount</p>
                  <p className="text-2xl font-bold text-white">
                    ${transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-lg border border-cyan-400/30">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-cyan-200">Total Requests</p>
                  <p className="text-2xl font-bold text-white">{transactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 border border-emerald-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-emerald-500/30 to-green-500/30 rounded-lg border border-emerald-400/30">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-emerald-200">Unique Users</p>
                  <p className="text-2xl font-bold text-white">
                    {new Set(transactions.map(t => t.userId)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Premium Search Bar */}
        <Card className="mb-6 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by user name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-md text-white placeholder-slate-300 placeholder-opacity-80 focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400"
                />
              </div>
              <div className="text-sm text-slate-300">
                {filteredTransactions.length} of {transactions.length} requests
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Transactions Table */}
        <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
              Withdrawal Requests ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {errorState ? (
              <div className="text-center py-8">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <p className="text-red-400 mb-4">{errorState}</p>
                <Button onClick={handleRefresh} variant="outline" className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30">
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-600/30">
                  <thead className="bg-gradient-to-r from-slate-700/30 to-slate-800/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Binance Address
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gradient-to-br from-slate-800/20 to-slate-900/20 divide-y divide-slate-600/20">
                    {isLoading ? (
                      <LoadingSkeleton />
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                          {searchTerm ? 'No withdrawal requests match your search' : 'No withdrawal requests found'}
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TransactionRow
                          key={transaction.id}
                          transaction={transaction}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          isProcessing={isProcessing}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';
