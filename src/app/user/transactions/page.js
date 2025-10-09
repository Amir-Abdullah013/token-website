'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useToast, ToastContainer } from '../../../components/Toast';

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'failed':
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

// Transaction type badge component
const TypeBadge = ({ type }) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'deposit':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'withdraw':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'buy':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sell':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'deposit':
        return '💰';
      case 'withdraw':
        return '💸';
      case 'buy':
        return '📈';
      case 'sell':
        return '📉';
      default:
        return '❓';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeStyles()}`}>
      <span className="mr-1">{getTypeIcon()}</span>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
};

// Transaction row component
const TransactionRow = ({ transaction }) => {
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

  const formatAmount = (amount, currency = 'PKR') => {
    const symbol = currency === 'PKR' ? '₨' : currency === 'USD' ? '$' : currency;
    return `${symbol}${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-4 py-3 text-sm text-gray-900">
        {formatDate(transaction.createdAt)}
      </td>
      <td className="px-4 py-3">
        <TypeBadge type={transaction.type} />
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {formatAmount(transaction.amount)}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={transaction.status} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {transaction.gateway || 'N/A'}
      </td>
    </tr>
  );
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="border-b border-gray-200 animate-pulse">
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </td>
      </tr>
    ))}
  </>
);

export default function TransactionsPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // State
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalTransactions, setTotalTransactions] = useState(0);
  
  // Filters
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      }
    }
  }, [mounted, loading, isAuthenticated, router]);

  // Fetch transactions
  const fetchTransactions = async (page = 1, filter = 'all', reset = false) => {
    if (!user?.$id) return;
    
    try {
      setIsLoading(true);
      setFetchError(null);

      // Fetch transactions from API
      const response = await fetch(`/api/transactions?userId=${user.id}&filter=${filter}&page=${page}&limit=${ITEMS_PER_PAGE}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const responseData = await response.json();
      
      // Handle the new API response structure
      const transactionsData = responseData.transactions || responseData;
      const total = responseData.total || transactionsData.length;
      const hasMore = responseData.hasMore || false;

      if (reset) {
        setTransactions(transactionsData);
      } else {
        setTransactions(prev => [...prev, ...transactionsData]);
      }
      
      setHasMore(hasMore);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setFetchError('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user?.$id) {
      fetchTransactions(1, selectedFilter, true);
    }
  }, [user?.$id, selectedFilter]);

  // Handle filter change
  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setCurrentPage(1);
    setHasMore(true);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchTransactions(currentPage + 1, selectedFilter, false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setCurrentPage(1);
    setHasMore(true);
    fetchTransactions(1, selectedFilter, true);
  };

  // Filter transactions by search term
  const filteredTransactions = (transactions || []).filter(transaction => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.type.toLowerCase().includes(searchLower) ||
      transaction.status.toLowerCase().includes(searchLower) ||
      transaction.gateway?.toLowerCase().includes(searchLower) ||
      transaction.amount.toString().includes(searchTerm)
    );
  });

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
              <p className="text-gray-600 mt-1">View all your transactions</p>
            </div>
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

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Type Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Type
                </label>
                <select
                  value={selectedFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Transactions</option>
                  <option value="deposit">Deposits</option>
                  <option value="withdraw">Withdrawals</option>
                  <option value="buy">Buy Orders</option>
                  <option value="sell">Sell Orders</option>
                </select>
              </div>

              {/* Search */}
              <div className="flex-1">
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
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Transactions ({filteredTransactions.length} of {totalTransactions})
            </CardTitle>
          </CardHeader>
          <CardContent>
              {fetchError ? (
              <div className="text-center py-8">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <p className="text-red-600 mb-4">{fetchError}</p>
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
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gateway
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading && transactions.length === 0 ? (
                      <LoadingSkeleton />
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((transaction, index) => (
                        <TransactionRow key={transaction.id || transaction.$id || `transaction-${index}`} transaction={transaction} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Load More Button */}
            {hasMore && !isLoading && (
              <div className="mt-6 text-center">
                <Button
                  onClick={handleLoadMore}
                  variant="outline"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}

            {/* Loading indicator for load more */}
            {isLoading && transactions.length > 0 && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Loading more transactions...
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {transactions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-lg font-bold text-gray-900">{transactions.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-lg font-bold text-green-600">
                    {transactions.filter(t => t.status === 'completed').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-lg font-bold text-yellow-600">
                    {transactions.filter(t => t.status === 'pending').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-lg font-bold text-red-600">
                    {transactions.filter(t => t.status === 'failed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </Layout>
  );
}
