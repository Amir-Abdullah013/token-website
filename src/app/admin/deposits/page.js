'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
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
      <td className="px-4 py-3 text-sm text-gray-900">
        {transaction.userId}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {formatAmount(transaction.amount)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {transaction.gateway || 'N/A'}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={transaction.status} />
      </td>
      <td className="px-4 py-3">
        {transaction.status === 'pending' ? (
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => onApprove(transaction.$id)}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(transaction.$id)}
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
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
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

export default function AdminDepositsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // State
  const [transactions, setTransactions] = useState([]);
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
      setError(null);
      
      const deposits = await databaseHelpers.admin.getPendingTransactions('deposit');
      setTransactions(deposits);
    } catch (err) {
      console.error('Error fetching deposits:', err);
      setError('Failed to load deposits');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user?.$id) {
      fetchDeposits();
    }
  }, [user?.$id]);

  // Handle approve
  const handleApprove = async (transactionId) => {
    if (!user?.$id) return;
    
    setIsProcessing(true);
    try {
      const result = await databaseHelpers.admin.approveTransaction(transactionId, user.id);
      
      // Update local state
      setTransactions(prev => 
        prev.map(t => 
          t.$id === transactionId 
            ? { ...t, status: 'completed' }
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
    if (!user?.$id) return;
    
    const reason = prompt('Please enter reason for rejection (optional):');
    if (reason === null) return; // User cancelled
    
    setIsProcessing(true);
    try {
      const result = await databaseHelpers.admin.rejectTransaction(transactionId, user.id, reason);
      
      // Update local state
      setTransactions(prev => 
        prev.map(t => 
          t.$id === transactionId 
            ? { ...t, status: 'failed' }
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
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Deposit Requests</h1>
                <p className="text-gray-600 mt-1">Manage user deposit requests</p>
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
                <Button
                  onClick={() => router.push('/admin/withdrawals')}
                  variant="outline"
                >
                  View Withdrawals
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {transactions.filter(t => t.status === 'pending').length}
                    </p>
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
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₨{transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Deposit Requests ({transactions.length})
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
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gateway
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
                      ) : transactions.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                            No pending deposits found
                          </td>
                        </tr>
                      ) : (
                        transactions.map((transaction) => (
                          <TransactionRow
                            key={transaction.$id}
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
