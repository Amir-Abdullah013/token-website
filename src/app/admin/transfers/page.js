'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../lib/admin-auth';
import { useTiki } from '../../../lib/tiki-context';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useToast, ToastContainer } from '../../../components/Toast';

const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-gradient-to-r from-emerald-500/40 to-green-500/40 text-white border border-emerald-400/60';
      case 'PENDING':
        return 'bg-gradient-to-r from-amber-500/40 to-orange-500/40 text-white border border-amber-400/60';
      case 'FAILED':
        return 'bg-gradient-to-r from-red-500/40 to-rose-500/40 text-white border border-red-400/60';
      case 'CANCELLED':
        return 'bg-gradient-to-r from-slate-500/40 to-gray-500/40 text-white border border-slate-400/60';
      default:
        return 'bg-gradient-to-r from-slate-500/40 to-gray-500/40 text-white border border-slate-400/60';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const TransferRow = ({ transfer }) => {
  const { formatTiki } = useTiki();
  
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

  return (
    <tr className="hover:bg-slate-700/20 transition-colors duration-150">
      <td className="px-4 py-3 text-sm text-white">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full flex items-center justify-center">
              <span className="text-cyan-200 text-sm font-medium">
                {transfer.sender_name ? transfer.sender_name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-white truncate" title={transfer.sender_name || 'Unknown User'}>
              {transfer.sender_name || 'Unknown User'}
            </div>
            <div className="text-slate-300 text-xs truncate" title={transfer.sender_email || 'No email available'}>
              {transfer.sender_email || 'No email available'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-white">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500/30 to-green-500/30 rounded-full flex items-center justify-center">
              <span className="text-emerald-200 text-sm font-medium">
                {transfer.recipient_name ? transfer.recipient_name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-white truncate" title={transfer.recipient_name || 'Unknown User'}>
              {transfer.recipient_name || 'Unknown User'}
            </div>
            <div className="text-slate-300 text-xs truncate" title={transfer.recipient_email || 'No email available'}>
              {transfer.recipient_email || 'No email available'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-white font-medium">
        {formatTiki(transfer.amount)} TIKI
      </td>
      <td className="px-4 py-3 text-sm text-slate-300">
        {transfer.note || '—'}
      </td>
      <td className="px-4 py-3 text-sm text-slate-300">
        {formatDate(transfer.createdAt)}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={transfer.status} />
      </td>
    </tr>
  );
};

const LoadingSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="border-b border-slate-600/20 animate-pulse">
        <td className="px-4 py-3"><div className="h-4 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded w-24"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded w-24"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded w-20"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded w-16"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded w-20"></div></td>
        <td className="px-4 py-3"><div className="h-6 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded-full w-20"></div></td>
      </tr>
    ))}
  </>
);

export default function AdminTransfersPage() {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const { formatTiki } = useTiki();

  const [mounted, setMounted] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [filteredTransfers, setFilteredTransfers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else {
        fetchTransfers();
      }
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  const fetchTransfers = async () => {
    setIsDataLoading(true);
    setErrorState(null);
    try {
      const response = await fetch('/api/admin/transfers');
      if (!response.ok) {
        throw new Error(`Failed to fetch transfers: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setTransfers(data.transfers || []);
        setFilteredTransfers(data.transfers || []);
        setStatistics(data.statistics || statistics);
      } else {
        throw new Error(data.error || 'Failed to load transfers');
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setErrorState(err.message || 'Failed to load transfers');
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredTransfers(transfers);
      return;
    }

    const filtered = transfers.filter(transfer => {
      const senderName = transfer.sender_name?.toLowerCase() || '';
      const senderEmail = transfer.sender_email?.toLowerCase() || '';
      const recipientName = transfer.recipient_name?.toLowerCase() || '';
      const recipientEmail = transfer.recipient_email?.toLowerCase() || '';
      const searchLower = term.toLowerCase();

      return senderName.includes(searchLower) ||
             senderEmail.includes(searchLower) ||
             recipientName.includes(searchLower) ||
             recipientEmail.includes(searchLower);
    });

    setFilteredTransfers(filtered);
  };

  if (!mounted || isLoading) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading admin transfers...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-6">Transfer Management</h1>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-cyan-200">Total Transfers</p>
                  <p className="text-2xl font-bold text-white">{statistics.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 border border-emerald-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-emerald-500/30 to-green-500/30 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-emerald-200">Completed</p>
                  <p className="text-2xl font-bold text-white">{statistics.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-lg">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-amber-200">Pending</p>
                  <p className="text-2xl font-bold text-white">{statistics.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-indigo-500/20 border border-violet-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-violet-500/30 to-purple-500/30 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-violet-200">Total Amount</p>
                  <p className="text-2xl font-bold text-white">{formatTiki(statistics.totalAmount)} TIKI</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="max-w-md">
            <Input
              type="text"
              placeholder="Search by sender, recipient, or email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-md text-white placeholder-slate-300 placeholder-opacity-80 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Transfers Table */}
        <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">All Transfers ({filteredTransfers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {errorState ? (
              <div className="text-center py-8">
                <div className="text-red-400 text-4xl mb-4">⚠️</div>
                <p className="text-red-300 mb-4">{errorState}</p>
                <Button onClick={fetchTransfers} variant="outline" className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30">
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-600/30">
                  <thead className="bg-gradient-to-r from-slate-700/30 to-slate-800/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Sender</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Recipient</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Note</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gradient-to-br from-slate-800/20 to-slate-900/20 divide-y divide-slate-600/20">
                    {isLoading ? (
                      <LoadingSkeleton />
                    ) : filteredTransfers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center">
                          <div className="text-slate-400 text-4xl mb-4">💸</div>
                          <h3 className="text-lg font-medium text-white mb-2">No Transfers Found</h3>
                          <p className="text-slate-300">No transfers match your search criteria.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredTransfers.map((transfer) => (
                        <TransferRow
                          key={transfer.id}
                          transfer={transfer}
                        />
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

