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
    if (mounted && !loading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
        return;
      }
      loadTransactions();
      loadDepositRequests();
      loadWithdrawals();
    }
  }, [mounted, loading, isAuthenticated]);

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
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return 'bg-blue-100 text-blue-800';
      case 'WITHDRAWAL':
        return 'bg-red-100 text-red-800';
      case 'BUY':
        return 'bg-green-100 text-green-800';
      case 'SELL':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentPageTransactions = () => {
    return filteredTransactions;
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
                <p className="text-gray-600">Manage all user transactions</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => router.push('/admin/dashboard')}
                  variant="outline"
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
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-lg">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{totalTransactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-lg">✅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{completedTransactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-yellow-600 text-lg">⏳</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingTransactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-lg">💵</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <Input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAWAL">Withdrawal</option>
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={loadTransactions}
                    disabled={loadingTransactions}
                    className="w-full"
                  >
                    {loadingTransactions ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading transactions...</span>
                </div>
              ) : (
                <>
                  {getCurrentPageTransactions().length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No transactions found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transaction ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Currency
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getCurrentPageTransactions().map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {transaction.id}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {transaction.user?.name || 'Unknown User'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {transaction.user?.email || 'unknown@example.com'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                                  {transaction.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(transaction.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {transaction.currency || 'USD'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                                  {transaction.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(transaction.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewTransaction(transaction)}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateStatus(transaction)}
                                    disabled={actionLoading}
                                  >
                                    Update Status
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
                      <div className="text-sm text-gray-700">
                        Showing {((currentPage - 1) * transactionsPerPage) + 1} to {Math.min(currentPage * transactionsPerPage, totalTransactions)} of {totalTransactions} transactions
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="px-3 py-2 text-sm text-gray-700">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
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
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Transaction Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">ID:</span> {selectedTransaction.id}
                </div>
                <div>
                  <span className="font-medium">User:</span> {selectedTransaction.user?.name} ({selectedTransaction.user?.email})
                </div>
                <div>
                  <span className="font-medium">Type:</span> {selectedTransaction.type}
                </div>
                <div>
                  <span className="font-medium">Amount:</span> {formatCurrency(selectedTransaction.amount)}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {selectedTransaction.status}
                </div>
                <div>
                  <span className="font-medium">Gateway:</span> {selectedTransaction.gateway || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {formatDate(selectedTransaction.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Updated:</span> {formatDate(selectedTransaction.updatedAt)}
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setShowTransactionModal(false)}
                  variant="outline"
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
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Update Transaction Status</h3>
              <div className="space-y-4">
                <div>
                  <span className="font-medium">Transaction:</span> {selectedTransaction.id}
                </div>
                <div>
                  <span className="font-medium">Current Status:</span> {selectedTransaction.status}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={selectedTransaction.status}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => setShowStatusModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const select = document.querySelector('select');
                    handleStatusUpdate(select.value);
                  }}
                  disabled={actionLoading}
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
