'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../lib/admin-auth';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useToast, ToastContainer } from '../../../components/Toast';

export default function AdminTransactionsPage() {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // State management
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [completedTransactions, setCompletedTransactions] = useState(0);
  const [pendingTransactions, setPendingTransactions] = useState(0);
  const [failedTransactions, setFailedTransactions] = useState(0);
  const [transactionsPerPage] = useState(10);

  // Deposit management state
  const [depositRequests, setDepositRequests] = useState([]);
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [depositStats, setDepositStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalApprovedAmount: 0
  });

  // Withdrawal management state
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [withdrawalStats, setWithdrawalStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0,
    totalCompletedAmount: 0
  });

  // Transaction management state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
        return;
      }
      loadTransactions();
      loadDepositRequests();
      loadWithdrawals();
    }
  }, [mounted, isLoading, isAuthenticated]);

  // Reload transactions when filters change
  useEffect(() => {
    if (mounted && isAuthenticated) {
      loadTransactions();
    }
  }, [searchTerm, selectedType, selectedStatus, currentPage]);

  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: transactionsPerPage.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      
      const response = await fetch(`/api/admin/transactions?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Transactions data from API:', data.transactions?.map(t => ({ id: t.id, type: t.type, status: t.status, amount: t.amount })));
        setTransactions(data.transactions || []);
        setFilteredTransactions(data.transactions || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalTransactions(data.pagination?.total || 0);
        
        // Update statistics
        if (data.statistics) {
          setTotalAmount(data.statistics.totalAmount || 0);
          setCompletedTransactions(data.statistics.completedTransactions || 0);
          setPendingTransactions(data.statistics.pendingTransactions || 0);
          setFailedTransactions(data.statistics.failedTransactions || 0);
        }
      } else {
        const errorData = await response.json();
        console.error('Error loading transactions:', errorData.error);
        error('Failed to load transactions: ' + (errorData.error || 'Unknown error'));
        setTransactions([]);
        setFilteredTransactions([]);
        setTotalPages(1);
        setTotalTransactions(0);
        setTotalAmount(0);
        setCompletedTransactions(0);
        setPendingTransactions(0);
        setFailedTransactions(0);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      error('Failed to load transactions');
      setTransactions([]);
      setFilteredTransactions([]);
      setTotalPages(1);
      setTotalTransactions(0);
      setTotalAmount(0);
      setCompletedTransactions(0);
      setPendingTransactions(0);
      setFailedTransactions(0);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadDepositRequests = async () => {
    try {
      setLoadingDeposits(true);
      
      const response = await fetch('/api/admin/deposits');
      
      if (response.ok) {
        const data = await response.json();
        setDepositRequests(data.depositRequests || []);
        setDepositStats(data.statistics || {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          totalApprovedAmount: 0
        });
      } else {
        const errorData = await response.json();
        error('Failed to load deposit requests: ' + (errorData.error || 'Unknown error'));
        setDepositRequests([]);
      }
    } catch (err) {
      console.error('Error loading deposit requests:', err);
      error('Failed to load deposit requests');
      setDepositRequests([]);
    } finally {
      setLoadingDeposits(false);
    }
  };

  const loadWithdrawals = async () => {
    try {
      setLoadingWithdrawals(true);
      
      const response = await fetch('/api/admin/withdrawals');
      
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals || []);
        setWithdrawalStats(data.statistics || {
          total: 0,
          pending: 0,
          completed: 0,
          failed: 0,
          totalCompletedAmount: 0
        });
      } else {
        const errorData = await response.json();
        error('Failed to load withdrawals: ' + (errorData.error || 'Unknown error'));
        setWithdrawals([]);
      }
    } catch (err) {
      console.error('Error loading withdrawals:', err);
      error('Failed to load withdrawals');
      setWithdrawals([]);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleUpdateStatus = (transaction) => {
    setSelectedTransaction(transaction);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedTransaction) return;
    
    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/admin/transactions/${selectedTransaction.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Transaction status update successful:', data);
        success(`Transaction status updated to ${newStatus}`);
        
        // Update the transaction in local state immediately for better UX
        setTransactions(prevTransactions => 
          prevTransactions.map(t => 
            t.id === selectedTransaction.id 
              ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
              : t
          )
        );
        setFilteredTransactions(prevFiltered => 
          prevFiltered.map(t => 
            t.id === selectedTransaction.id 
              ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
              : t
          )
        );
        
        // Also reload from server to ensure consistency
        setTimeout(() => {
          console.log('🔄 Reloading transactions from server...');
          loadTransactions();
        }, 1000);
      } else {
        const errorData = await response.json();
        console.error('Status update error:', errorData);
        error(`Failed to update transaction status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error updating transaction status:', err);
      error('Failed to update transaction status');
    } finally {
      setActionLoading(false);
      setShowStatusModal(false);
      setSelectedTransaction(null);
    }
  };

  const handleApproveDeposit = async (depositId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/deposits/${depositId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (response.ok) {
        success('Deposit request approved successfully');
        loadDepositRequests(); // Reload data to reflect changes
      } else {
        const errorData = await response.json();
        error(`Failed to approve deposit: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error approving deposit:', err);
      error('Failed to approve deposit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDeposit = async (depositId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/deposits/${depositId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (response.ok) {
        success('Deposit request rejected successfully');
        loadDepositRequests(); // Reload data to reflect changes
      } else {
        const errorData = await response.json();
        error(`Failed to reject deposit: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error rejecting deposit:', err);
      error('Failed to reject deposit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (response.ok) {
        success('Withdrawal request approved successfully');
        loadWithdrawals(); // Reload data to reflect changes
      } else {
        const errorData = await response.json();
        error(`Failed to approve withdrawal: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error approving withdrawal:', err);
      error('Failed to approve withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (response.ok) {
        success('Withdrawal request rejected successfully');
        loadWithdrawals(); // Reload data to reflect changes
      } else {
        const errorData = await response.json();
        error(`Failed to reject withdrawal: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error rejecting withdrawal:', err);
      error('Failed to reject withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-gradient-to-r from-emerald-500/40 to-green-500/40 text-white border border-emerald-400/60';
      case 'PENDING':
        return 'bg-gradient-to-r from-amber-500/40 to-orange-500/40 text-white border border-amber-400/60';
      case 'FAILED':
        return 'bg-gradient-to-r from-red-500/40 to-rose-500/40 text-white border border-red-400/60';
      default:
        return 'bg-gradient-to-r from-slate-500/40 to-gray-500/40 text-white border border-slate-400/60';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return 'bg-gradient-to-r from-cyan-500/40 to-blue-500/40 text-white border border-cyan-400/60';
      case 'WITHDRAWAL':
        return 'bg-gradient-to-r from-red-500/40 to-rose-500/40 text-white border border-red-400/60';
      case 'BUY':
        return 'bg-gradient-to-r from-emerald-500/40 to-green-500/40 text-white border border-emerald-400/60';
      case 'SELL':
        return 'bg-gradient-to-r from-amber-500/40 to-orange-500/40 text-white border border-amber-400/60';
      default:
        return 'bg-gradient-to-r from-slate-500/40 to-gray-500/40 text-white border border-slate-400/60';
    }
  };

  const getCurrentPageTransactions = () => {
    return filteredTransactions;
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm shadow-xl border-b border-slate-600/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Transaction Management</h1>
                <p className="text-slate-300">Manage all user transactions</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => router.push('/admin/dashboard')}
                  variant="outline"
                  className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-cyan-200 text-lg">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-cyan-200">Total Transactions</p>
                    <p className="text-2xl font-bold text-white">{totalTransactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 border border-emerald-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500/30 to-green-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-emerald-200 text-lg">✅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-emerald-200">Completed</p>
                    <p className="text-2xl font-bold text-white">{completedTransactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-amber-200 text-lg">⏳</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-amber-200">Pending</p>
                    <p className="text-2xl font-bold text-white">{pendingTransactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-indigo-500/20 border border-violet-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-violet-500/30 to-purple-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-violet-200 text-lg">💵</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-violet-200">Total Amount</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Search
                  </label>
                  <Input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Transaction Type
                  </label>
                  <div className="relative">
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all duration-200 hover:border-slate-400/50 appearance-none cursor-pointer"
                    >
                      <option value="all" className="bg-slate-800 text-white py-2">All Transaction Types</option>
                      <option value="DEPOSIT" className="bg-slate-800 text-white py-2">💰 Deposit</option>
                      <option value="WITHDRAWAL" className="bg-slate-800 text-white py-2">💸 Withdrawal</option>
                      <option value="BUY" className="bg-slate-800 text-white py-2">📈 Buy TIKI</option>
                      <option value="SELL" className="bg-slate-800 text-white py-2">📉 Sell TIKI</option>
                      <option value="TRANSFER" className="bg-slate-800 text-white py-2">🔄 Transfer</option>
                      <option value="STAKE" className="bg-slate-800 text-white py-2">🔒 Stake</option>
                      <option value="UNSTAKE" className="bg-slate-800 text-white py-2">🔓 Unstake</option>
                      <option value="REWARD" className="bg-slate-800 text-white py-2">🎁 Reward</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Transaction Status
                  </label>
                  <div className="relative">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all duration-200 hover:border-slate-400/50 appearance-none cursor-pointer"
                    >
                      <option value="all" className="bg-slate-800 text-white py-2">All Status</option>
                      <option value="COMPLETED" className="bg-slate-800 text-white py-2">✅ Completed</option>
                      <option value="PENDING" className="bg-slate-800 text-white py-2">⏳ Pending</option>
                      <option value="FAILED" className="bg-slate-800 text-white py-2">❌ Failed</option>
                      <option value="CANCELLED" className="bg-slate-800 text-white py-2">🚫 Cancelled</option>
                      <option value="PROCESSING" className="bg-slate-800 text-white py-2">⚙️ Processing</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={loadTransactions}
                    disabled={loadingTransactions}
                    className="w-full bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                  >
                    {loadingTransactions ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  <span className="ml-2 text-slate-300">Loading transactions...</span>
                </div>
              ) : (
                <>
                  {getCurrentPageTransactions().length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-slate-400 text-4xl mb-4">💳</div>
                      <h3 className="text-lg font-medium text-white mb-2">No Transactions Found</h3>
                      <p className="text-slate-300">No transactions match your search criteria.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-600/30">
                        <thead className="bg-gradient-to-r from-slate-700/30 to-slate-800/30">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              Transaction ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              Currency
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-gradient-to-br from-slate-800/20 to-slate-900/20 divide-y divide-slate-600/20">
                          {getCurrentPageTransactions().map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-slate-700/20 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-white">
                                  {transaction.id}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-white">
                                    {transaction.user?.name || 'Unknown User'}
                                  </div>
                                  <div className="text-sm text-slate-300">
                                    {transaction.user?.email || 'unknown@example.com'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                                  {transaction.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                                {formatCurrency(transaction.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {transaction.currency || 'USD'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                                  {transaction.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                {formatDate(transaction.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewTransaction(transaction)}
                                    className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 hover:text-cyan-200 border border-cyan-400/30"
                                  >
                                    View
                                  </Button>
                                 
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-slate-300">
                        Showing {((currentPage - 1) * transactionsPerPage) + 1} to {Math.min(currentPage * transactionsPerPage, totalTransactions)} of {totalTransactions} transactions
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                        >
                          Previous
                        </Button>
                        <span className="px-3 py-2 text-sm text-slate-300">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transaction Details Modal */}
        {showTransactionModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-slate-800/90 via-slate-700/90 to-slate-800/90 backdrop-blur-sm rounded-lg p-6 max-w-md w-full mx-4 border border-slate-600/30 shadow-xl">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">Transaction Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-slate-300">ID:</span> <span className="text-white">{selectedTransaction.id}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-300">User:</span> <span className="text-white">{selectedTransaction.user?.name} ({selectedTransaction.user?.email})</span>
                </div>
                <div>
                  <span className="font-medium text-slate-300">Type:</span> <span className="text-white">{selectedTransaction.type}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-300">Amount:</span> <span className="text-white">{formatCurrency(selectedTransaction.amount)}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-300">Status:</span> <span className="text-white">{selectedTransaction.status}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-300">Gateway:</span> <span className="text-white">{selectedTransaction.gateway || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-300">Created:</span> <span className="text-white">{formatDate(selectedTransaction.createdAt)}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-300">Updated:</span> <span className="text-white">{formatDate(selectedTransaction.updatedAt)}</span>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setShowTransactionModal(false)}
                  variant="outline"
                  className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {showStatusModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-slate-800/90 via-slate-700/90 to-slate-800/90 backdrop-blur-sm rounded-lg p-6 max-w-md w-full mx-4 border border-slate-600/30 shadow-xl">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-4">Update Transaction Status</h3>
              <div className="space-y-4">
                <div>
                  <span className="font-medium text-slate-300">Transaction:</span> <span className="text-white">{selectedTransaction.id}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-300">Current Status:</span> <span className="text-white">{selectedTransaction.status}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    New Status
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400"
                    defaultValue={selectedTransaction.status}
                  >
                    <option value="PENDING" className="bg-slate-800 text-white">Pending</option>
                    <option value="COMPLETED" className="bg-slate-800 text-white">Completed</option>
                    <option value="FAILED" className="bg-slate-800 text-white">Failed</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => setShowStatusModal(false)}
                  variant="outline"
                  className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const select = document.querySelector('select');
                    handleStatusUpdate(select.value);
                  }}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30"
                >
                  {actionLoading ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';

