'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
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

const TransferRow = ({ transfer, type }) => {
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
      <td className="px-4 py-3 text-sm">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          type === 'sent' 
            ? 'bg-orange-100 text-orange-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {type === 'sent' ? 'Sent' : 'Received'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {type === 'sent' ? transfer.recipientEmail : transfer.senderEmail}
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

export default function SendTokensPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const { tikiBalance, formatTiki, fetchUserWallet } = useTiki();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    recipientEmail: '',
    amount: '',
    note: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(true);

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
      if (!response.ok) {
        throw new Error(`Failed to fetch transfers: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setTransfers(data.transfers.all);
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

    if (!formData.recipientEmail) {
      newErrors.recipientEmail = 'Recipient email is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(formData.recipientEmail)) {
      newErrors.recipientEmail = 'Please enter a valid Gmail address';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (parseFloat(formData.amount) > tikiBalance) {
      newErrors.amount = 'Insufficient TIKI balance';
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
      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: formData.recipientEmail,
          amount: parseFloat(formData.amount),
          note: formData.note || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        success(`🎉 Transfer successful! You sent ${formatTiki(parseFloat(formData.amount))} TIKI to ${formData.recipientEmail}`);
        setFormData({ recipientEmail: '', amount: '', note: '' });
        fetchTransfers(); // Refresh transfers list
        fetchUserWallet(); // Refresh user balance
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Send TIKI Tokens</h1>

        {/* User Balance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your TIKI Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{formatTiki(tikiBalance)} TIKI</p>
              <p className="text-sm text-gray-500 mt-1">Available for transfer</p>
            </div>
          </CardContent>
        </Card>

        {/* Send Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Send Tokens to Another User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Gmail Address *
                </label>
                <Input
                  id="recipientEmail"
                  name="recipientEmail"
                  type="email"
                  value={formData.recipientEmail}
                  onChange={handleInputChange}
                  placeholder="Enter recipient's Gmail address"
                  className={errors.recipientEmail ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {errors.recipientEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.recipientEmail}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  The recipient must be registered on Tiki with this Gmail address
                </p>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (TIKI) *
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
                  className={errors.amount ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Maximum: {formatTiki(tikiBalance)} TIKI
                </p>
              </div>

              <div>
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                  Note (Optional)
                </label>
                <Input
                  id="note"
                  name="note"
                  type="text"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="Add a message (optional)"
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-sm text-gray-500">
                  A short message to include with the transfer
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting || !formData.recipientEmail || !formData.amount}
              >
                {isSubmitting ? 'Processing...' : 'Send Tokens'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Transfer History */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTransfers ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : transfers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No transfers yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
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

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
                  <span className="text-2xl">💸</span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Confirm Transfer
                </h3>
                
                <p className="text-gray-600 text-center mb-6">
                  You are about to send TIKI tokens to another user.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recipient:</span>
                      <span className="font-semibold text-gray-900">{formData.recipientEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold text-gray-900">{formatTiki(parseFloat(formData.amount))} TIKI</span>
                    </div>
                    {formData.note && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Note:</span>
                        <span className="font-semibold text-gray-900">{formData.note}</span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-900 font-semibold">Your Balance After:</span>
                        <span className="font-bold text-blue-600">{formatTiki(tikiBalance - parseFloat(formData.amount))} TIKI</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={cancelTransfer}
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmTransfer}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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






