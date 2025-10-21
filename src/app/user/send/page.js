'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useVon } from '@/lib/Von-context';
import { useFeeCalculator } from '@/lib/hooks/useFeeCalculator';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast, ToastContainer } from '@/components/Toast';

// Utility function to safely parse response
const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  // Check if response has any content
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0' || (!contentLength && !contentType)) {
    throw new Error('Server returned empty response');
  }
  
  if (contentType && contentType.includes('application/json')) {
    try {
      const jsonData = await response.json();
      return jsonData;
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error('Invalid JSON response from server');
    }
  } else {
    try {
      const text = await response.text();
      console.error('Non-JSON response received:', text);
      if (text.trim() === '') {
        throw new Error('Server returned empty response');
      }
      throw new Error('Server returned non-JSON response');
    } catch (error) {
      console.error('Text parsing error:', error);
      throw new Error('Failed to parse server response');
    }
  }
};

const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/30';
      case 'PENDING':
        return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-400/30';
      case 'FAILED':
        return 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border border-red-400/30';
      case 'CANCELLED':
        return 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-300 border border-slate-400/30';
      default:
        return 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-300 border border-slate-400/30';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const TransferRow = ({ transfer, type }) => {
  const { formatVon } = useVon();
  
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
      <td className="px-4 py-3 text-sm">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          type === 'sent' 
            ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border border-orange-400/30' 
            : 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/30'
        }`}>
          {type === 'sent' ? 'Sent' : 'Received'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-white">
        {type === 'sent' ? transfer.recipientVonId : transfer.senderVonId}
      </td>
      <td className="px-4 py-3 text-sm text-white font-medium">
        {formatVon(transfer.amount)} Von
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

export default function SendTokensPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const { VonBalance, formatVon, fetchUserWallet, setVonBalance } = useVon();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    recipientVonId: '',
    amount: '',
    note: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(true);

  // Calculate fee for transfer (5% fee)
  const amount = parseFloat(formData.amount) || 0;
  const feeCalculation = useFeeCalculator('transfer', amount);

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
    setIsLoadingTransfers(true);
    try {
      const response = await fetch('/api/transfer');
      
      // Parse response safely
      let data;
      try {
        data = await parseResponse(response);
      } catch (parseError) {
        console.error('Response parsing error:', parseError);
        throw new Error(parseError.message);
      }

      // Check if response indicates success
      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch transfers: ${response.status}`);
      }

      if (data.success) {
        setTransfers(data.transfers || []);
      } else {
        error(data.error || 'Failed to load transfers');
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
      error(err.message || 'Failed to load transfers');
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.recipientVonId) {
      newErrors.recipientVonId = 'Recipient Von ID is required';
    } else if (!/^Von-[A-Z0-9]{4}-[A-Z0-9]{8}$/.test(formData.recipientVonId.toUpperCase())) {
      newErrors.recipientVonId = 'Please enter a valid Von ID (format: Von-XXXX-XXXXXXXX)';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else {
      const totalRequired = parseFloat(formData.amount) + feeCalculation.fee;
      if (totalRequired > VonBalance) {
        newErrors.amount = `Insufficient Von balance. Required: ${formatVon(totalRequired)} Von (${formatVon(parseFloat(formData.amount))} + ${formatVon(feeCalculation.fee)} fee)`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setShowConfirm(true);
  };

  const confirmTransfer = async () => {
    setIsSubmitting(true);
    setShowConfirm(false);

    try {
      const response = await fetch('/api/transfer-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientVonId: formData.recipientVonId.toUpperCase(),
          amount: parseFloat(formData.amount),
          note: formData.note || null
        })
      });

      // Parse response safely
      let data;
      try {
        data = await parseResponse(response);
      } catch (parseError) {
        console.error('Response parsing error:', parseError);
        error(parseError.message);
        return;
      }

      // Check if response indicates success
      if (!response.ok) {
        error(data.error || `Transfer failed with status ${response.status}`);
        return;
      }

      if (data.success) {
        success(`🎉 Transfer successful! You sent ${formatVon(parseFloat(formData.amount))} Von to ${formData.recipientVonId}`);
        setFormData({ recipientVonId: '', amount: '', note: '' });
        
        // Update balance immediately if provided in response
        if (data.newBalance !== undefined) {
          console.log('🔄 Updating balance from transfer response:', data.newBalance);
          // Update the Von context balance directly
          setVonBalance(data.newBalance);
        }
        
        // Only refresh after successful transfer
        await fetchTransfers(); // Refresh transfers list
        await fetchUserWallet(); // Refresh user balance
      } else {
        error(data.error || 'Transfer failed');
      }
    } catch (err) {
      console.error('Error processing transfer:', err);
      error(err.message || 'Transfer failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelTransfer = () => {
    setShowConfirm(false);
  };

  if (!mounted || loading) {
    return (
      <Layout showSidebar={true}>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-6">Send Von Tokens</h1>

        {/* Premium User Balance */}
        <Card className="mb-6 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20">
          <CardHeader>
            <CardTitle className="text-amber-200">Your Von Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{formatVon(VonBalance)} Von</p>
              <p className="text-sm text-amber-300 mt-1">Available for transfer</p>
            </div>
          </CardContent>
        </Card>

        {/* Premium Send Form */}
        <Card className="mb-6 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Send Tokens to Another User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="recipientVonId" className="block text-sm font-medium text-slate-300 mb-2">
                  Recipient Von ID *
                </label>
                <Input
                  id="recipientVonId"
                  name="recipientVonId"
                  type="text"
                  value={formData.recipientVonId}
                  onChange={handleInputChange}
                  placeholder="Enter recipient's Von ID (e.g., Von-USER-12345678)"
                  className={`bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30 ${errors.recipientVonId ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.recipientVonId && (
                  <p className="mt-1 text-sm text-red-400">{errors.recipientVonId}</p>
                )}
                <p className="mt-1 text-sm text-slate-400">
                  The recipient must be registered on Von with this Von ID
                </p>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
                  Amount (Von) *
                </label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount to send"
                  className={`bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30 ${errors.amount ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-400">{errors.amount}</p>
                )}
                <p className="mt-1 text-sm text-slate-400">
                  Maximum: {formatVon(VonBalance)} Von
                </p>
                
                {/* Fee Information Display */}
                {amount > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between items-center mb-1">
                        <span>Transfer Amount:</span>
                        <span className="font-medium">{formatVon(amount)} Von</span>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span>Fee ({feeCalculation.feePercentage}%):</span>
                        <span className="font-medium text-orange-600">{formatVon(feeCalculation.fee)} Von</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-1">
                        <span className="font-medium">Total Required:</span>
                        <span className="font-bold text-blue-600">{formatVon(amount + feeCalculation.fee)} Von</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Recipient will receive: {formatVon(amount)} Von
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="note" className="block text-sm font-medium text-slate-300 mb-2">
                  Note (Optional)
                </label>
                <Input
                  id="note"
                  name="note"
                  type="text"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="Add a message (optional)"
                  className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30"
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-sm text-slate-400">
                  A short message to include with the transfer
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 border border-violet-400/30"
                disabled={isSubmitting || !formData.recipientVonId || !formData.amount}
              >
                {isSubmitting ? 'Processing...' : 'Send Tokens'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Premium Transfer History */}
        <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">Transfer History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTransfers ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              </div>
            ) : !transfers || transfers.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No transfers yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-600/30">
                  <thead className="bg-gradient-to-r from-slate-700/30 to-slate-800/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Note</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gradient-to-br from-slate-800/20 to-slate-900/20 divide-y divide-slate-600/20">
                    {transfers.map((transfer) => (
                      <TransferRow
                        key={transfer.id}
                        transfer={transfer}
                        type={transfer.senderId === user.id ? 'sent' : 'received'}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Premium Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg shadow-2xl max-w-md w-full border border-slate-600/30">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full mb-4 border border-violet-400/30">
                  <span className="text-2xl">💸</span>
                </div>
                
                <h3 className="text-lg font-semibold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent text-center mb-2">
                  Confirm Transfer
                </h3>
                
                <p className="text-slate-300 text-center mb-6">
                  You are about to send Von tokens to another user.
                </p>
                
                <div className="bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded-lg p-4 mb-6 border border-slate-600/30">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Recipient:</span>
                      <span className="font-semibold text-white">{formData.recipientVonId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount:</span>
                      <span className="font-semibold text-white">{formatVon(parseFloat(formData.amount))} Von</span>
                    </div>
                    {formData.note && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Note:</span>
                        <span className="font-semibold text-white">{formData.note}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-600/30 pt-3">
                      <div className="flex justify-between">
                        <span className="text-white font-semibold">Your Balance After:</span>
                        <span className="font-bold text-cyan-400">{formatVon(VonBalance - parseFloat(formData.amount))} Von</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={cancelTransfer}
                    variant="outline"
                    className="flex-1 bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmTransfer}
                    className="flex-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 border border-violet-400/30"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Confirm Send'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';







