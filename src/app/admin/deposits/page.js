'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../lib/admin-auth';
// Removed direct database import - using API calls instead;
import Layout from '../../../components/Layout';
import AdminRoute from '../../../components/AdminRoute';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import { useToast, ToastContainer } from '../../../components/Toast';

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/30';
      case 'PENDING':
        return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-400/30';
      case 'REJECTED':
      case 'FAILED':
        return 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border border-red-400/30';
      default:
        return 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-300 border border-slate-400/30';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return '✅';
      case 'PENDING':
        return '⏳';
      case 'REJECTED':
      case 'FAILED':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      <span className="mr-1">{getStatusIcon()}</span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
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
    const symbol = currency === 'PKR' ? '₨' : currency === 'USD' ? '$' : currency;
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
                {transaction.user_name ? transaction.user_name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-white truncate" title={transaction.user_name || 'Unknown User'}>
              {transaction.user_name || 'Unknown User'}
            </div>
            <div className="text-slate-300 text-xs truncate" title={transaction.user_email || 'No email available'}>
              {transaction.user_email || 'No email available'}
            </div>
            <div className="text-slate-400 text-xs">
              ID: {transaction.userId}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-white">
        {formatAmount(transaction.amount)}
      </td>
      <td className="px-4 py-3 text-sm text-slate-300">
        {transaction.screenshot ? (
          <div className="flex items-center space-x-2">
            <img
              src={transaction.screenshot}
              alt="Transaction Screenshot"
              className="w-12 h-12 object-cover rounded border border-slate-600/30 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.open(transaction.screenshot, '_blank')}
              title="Click to view full size"
            />
            <span className="text-xs text-slate-400">Click to view</span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">No screenshot</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-slate-300">
        {transaction.gateway || 'N/A'}
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
          <div className="h-12 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded w-12"></div>
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

export default function AdminDepositsPage() {
  const { adminUser } = useAdminAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // State
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch pending deposits
  const fetchDeposits = async () => {
    try {
      setIsLoading(true);
      setErrorState(null);
      
      const response = await fetch('/api/admin/deposits');
      if (!response.ok) {
        throw new Error(`Failed to fetch deposits: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Admin deposits API response:', data);
      if (data.success) {
        console.log('🔍 Deposit requests received:', data.depositRequests);
        setTransactions(data.depositRequests || []);
        setFilteredTransactions(data.depositRequests || []);
      } else {
        throw new Error(data.error || 'Failed to load deposits');
      }
    } catch (err) {
      console.error('Error fetching deposits:', err);
      setErrorState(err.message || 'Failed to load deposits');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (adminUser?.id) {
      fetchDeposits();
    }
  }, [adminUser?.id]);

  // Handle approve
  const handleApprove = async (transactionId) => {
    if (!adminUser?.id) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/deposits/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to approve deposit: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to approve deposit');
      }
      
      // Update local state
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, status: 'APPROVED' }
            : t
        )
      );
      
      success(`Deposit approved successfully! User balance updated.`);
    } catch (err) {
      console.error('Error approving deposit:', err);
      error(`Failed to approve deposit: ${err.message}`);
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
      const response = await fetch(`/api/admin/deposits/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject', reason })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to reject deposit: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to reject deposit');
      }
      
      // Update local state
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, status: 'REJECTED' }
            : t
        )
      );
      
      success(`Deposit rejected successfully.`);
    } catch (err) {
      console.error('Error rejecting deposit:', err);
      error(`Failed to reject deposit: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredTransactions(transactions);
      return;
    }

    const filtered = transactions.filter(transaction => {
      const userName = transaction.user_name?.toLowerCase() || '';
      const userEmail = transaction.user_email?.toLowerCase() || '';
      const userId = transaction.userId?.toLowerCase() || '';
      const searchLower = term.toLowerCase();

      return userName.includes(searchLower) ||
             userEmail.includes(searchLower) ||
             userId.includes(searchLower);
    });

    setFilteredTransactions(filtered);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchDeposits();
  };

  if (!mounted) {
    return null;
  }

  return (
    <AdminRoute>
      <Layout showSidebar={true}>
        <div className="max-w-7xl mx-auto">
          {/* Premium Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Deposit Requests</h1>
                <p className="text-slate-300 mt-1">Manage user deposit requests</p>
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
                  onClick={() => router.push('/admin/withdrawals')}
                  variant="outline"
                  className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 hover:from-violet-500/30 hover:to-purple-500/30 hover:text-white border border-violet-400/30"
                >
                  View Withdrawals
                </Button>
              </div>
            </div>
          </div>

          {/* Premium Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-lg border border-amber-400/30">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-amber-200">Pending</p>
                    <p className="text-2xl font-bold text-white">
                      {filteredTransactions.filter(t => t.status === 'PENDING').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 border border-emerald-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-r from-emerald-500/30 to-green-500/30 rounded-lg border border-emerald-400/30">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-emerald-200">Total Amount</p>
                    <p className="text-2xl font-bold text-white">
                      ${filteredTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
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
                    <p className="text-2xl font-bold text-white">{filteredTransactions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Premium Search Bar */}
          <div className="mb-6">
            <div className="max-w-md">
              <input
                type="text"
                placeholder="Search by user name, email, or ID..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-md text-white placeholder-slate-300 placeholder-opacity-80 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Premium Transactions Table */}
          <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Deposit Requests ({filteredTransactions.length})
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
                          Screenshot
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Gateway
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
                          <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                            No pending deposits found
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
    </AdminRoute>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';