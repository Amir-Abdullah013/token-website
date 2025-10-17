'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../lib/admin-auth';
// Removed direct database import - using API calls instead;
import Layout from '../../../components/Layout';
import AdminRoute from '../../../components/AdminRoute';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
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
const TransactionRow = ({ transaction, onApprove, onReject, isProcessing, onScreenshotClick }) => {
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
              src={`/api/admin/screenshot/${transaction.id}`}
              alt="Transaction Screenshot"
              className="w-12 h-12 object-cover rounded border border-slate-600/30 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onScreenshotClick(transaction.id)}
              title="Click to view full size"
              onError={(e) => {
                console.error('Screenshot load error:', e);
                e.target.style.display = 'none';
                e.target.nextSibling.textContent = 'Error loading';
              }}
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
  
  // Deposit addresses management state
  const [depositAddresses, setDepositAddresses] = useState({ bep20: '', trc20: '' });
  const [isSavingAddresses, setIsSavingAddresses] = useState(false);
  
  // Screenshot modal state
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

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
      fetchDepositAddresses();
    }
  }, [adminUser?.id]);

  // Fetch deposit addresses
  const fetchDepositAddresses = async () => {
    try {
      const response = await fetch('/api/deposit-addresses');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDepositAddresses(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching deposit addresses:', err);
    }
  };

  // Save deposit addresses
  const saveDepositAddresses = async () => {
    try {
      setIsSavingAddresses(true);
      const response = await fetch('/api/deposit-addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(depositAddresses),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          success('Deposit addresses updated successfully');
        } else {
          error(data.error || 'Failed to update addresses');
        }
      } else {
        error('Failed to update deposit addresses');
      }
    } catch (err) {
      console.error('Error saving deposit addresses:', err);
      error('Failed to update deposit addresses');
    } finally {
      setIsSavingAddresses(false);
    }
  };

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

  // Handle screenshot click
  const handleScreenshotClick = (transactionId) => {
    setSelectedScreenshot(transactionId);
    setShowScreenshotModal(true);
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
          {/* Premium Mobile-Responsive Header */}
          <div className="mb-6 sm:mb-8">
            {/* Mobile-First Header Layout */}
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              {/* Title Section - Mobile Optimized */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
                      <span className="text-lg sm:text-xl font-bold text-white">💰</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent leading-tight">
                      Deposit Requests
                    </h1>
                    <p className="text-slate-300 text-sm sm:text-base mt-1 leading-relaxed">
                      Manage user deposit requests and transactions
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Mobile Responsive */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 sm:flex-shrink-0">
                {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
                <div className="flex space-x-2 sm:space-x-3">
                  {/* Refresh Button - Mobile Optimized */}
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    disabled={isLoading}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 py-2.5 px-4 text-sm font-medium"
                  >
                    <span className="flex items-center justify-center">
                      <span className="mr-2 text-base">
                        {isLoading ? (
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          '🔄'
                        )}
                      </span>
                      <span className="hidden sm:inline">Refresh</span>
                      <span className="sm:hidden">Refresh</span>
                    </span>
                  </Button>

                  {/* View Withdrawals Button - Mobile Optimized */}
                  <Button
                    onClick={() => router.push('/admin/withdrawals')}
                    variant="outline"
                    className="flex-1 sm:flex-none bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 hover:from-violet-500/30 hover:to-purple-500/30 hover:text-white border border-violet-400/30 transition-all duration-200 py-2.5 px-4 text-sm font-medium"
                  >
                    <span className="flex items-center justify-center">
                      <span className="mr-2 text-base">💸</span>
                      <span className="hidden sm:inline">View Withdrawals</span>
                      <span className="sm:hidden">Withdrawals</span>
                    </span>
                  </Button>
                </div>

                {/* Mobile: Additional Info */}
                <div className="sm:hidden text-center">
                  <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-lg border border-slate-600/30">
                    <span className="text-xs text-slate-400 mr-2">📊</span>
                    <span className="text-xs text-slate-300">
                      {filteredTransactions.length} requests
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: Quick Stats Bar */}
            <div className="mt-4 sm:hidden">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded-lg p-3 border border-slate-600/30">
                  <div className="text-xs text-slate-400 mb-1">Total Requests</div>
                  <div className="text-lg font-bold text-white">{filteredTransactions.length}</div>
                </div>
                <div className="bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded-lg p-3 border border-slate-600/30">
                  <div className="text-xs text-slate-400 mb-1">Pending</div>
                  <div className="text-lg font-bold text-amber-400">
                    {filteredTransactions.filter(t => t.status === 'PENDING').length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Deposit Addresses Management */}
          <Card className="mb-6 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">🏦 Manage Deposit Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    BEP20 Address (BSC Network)
                  </label>
                  <Input
                    type="text"
                    value={depositAddresses.bep20}
                    onChange={(e) => setDepositAddresses(prev => ({ ...prev, bep20: e.target.value }))}
                    placeholder="Enter BEP20 deposit address"
                    className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30"
                  />
                  <p className="text-xs text-slate-400 mt-1">BSC network address for BEP20 tokens</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    TRC20 Address (Tron Network)
                  </label>
                  <Input
                    type="text"
                    value={depositAddresses.trc20}
                    onChange={(e) => setDepositAddresses(prev => ({ ...prev, trc20: e.target.value }))}
                    placeholder="Enter TRC20 deposit address"
                    className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30"
                  />
                  <p className="text-xs text-slate-400 mt-1">Tron network address for TRC20 tokens</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={saveDepositAddresses}
                  disabled={isSavingAddresses}
                  className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg shadow-violet-500/25 border border-violet-400/30"
                >
                  {isSavingAddresses ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

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
                            onScreenshotClick={handleScreenshotClick}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Screenshot Modal */}
          <AnimatePresence>
            {showScreenshotModal && selectedScreenshot && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowScreenshotModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-slate-800 rounded-lg border border-slate-600/30 max-w-4xl max-h-[90vh] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-slate-600/30 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Transaction Screenshot</h3>
                    <Button
                      onClick={() => setShowScreenshotModal(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="p-4">
                    <img
                      src={`/api/admin/screenshot/${selectedScreenshot}`}
                      alt="Transaction Screenshot"
                      className="max-w-full max-h-[70vh] object-contain rounded border border-slate-600/30"
                      onError={(e) => {
                        console.error('Screenshot modal load error:', e);
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVycm9yIGxvYWRpbmcgaW1hZ2U8L3RleHQ+Cjwvc3ZnPg==';
                      }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toast Container */}
          <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
      </Layout>
    </AdminRoute>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';