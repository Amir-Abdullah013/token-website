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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-4 py-3 text-sm text-gray-900">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-medium">
                {transfer.sender_name ? transfer.sender_name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 truncate" title={transfer.sender_name || 'Unknown User'}>
              {transfer.sender_name || 'Unknown User'}
            </div>
            <div className="text-gray-500 text-xs truncate" title={transfer.sender_email || 'No email available'}>
              {transfer.sender_email || 'No email available'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm font-medium">
                {transfer.recipient_name ? transfer.recipient_name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 truncate" title={transfer.recipient_name || 'Unknown User'}>
              {transfer.recipient_name || 'Unknown User'}
            </div>
            <div className="text-gray-500 text-xs truncate" title={transfer.recipient_email || 'No email available'}>
              {transfer.recipient_email || 'No email available'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
        {formatTiki(transfer.amount)} TIKI
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {transfer.note || '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
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
      <tr key={i} className="border-b border-gray-200 animate-pulse">
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
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
    if (mounted && !loading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else {
        fetchTransfers();
      }
    }
  }, [mounted, loading, isAuthenticated, router]);

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
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Transfer Management</h1>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Transfers</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{statistics.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatTiki(statistics.totalAmount)} TIKI</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Transfers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Transfers ({filteredTransfers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {errorState ? (
              <div className="text-center py-8">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <p className="text-red-600 mb-4">{errorState}</p>
                <Button onClick={fetchTransfers} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <LoadingSkeleton />
                    ) : filteredTransfers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                          No transfers found.
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
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';

