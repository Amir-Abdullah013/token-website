'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import { useToast, ToastContainer } from '@/components/Toast';

export default function WithdrawConfirmPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // State
  const [withdrawData, setWithdrawData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
        return;
      }

      // Get withdrawal data from session storage
      const storedData = sessionStorage.getItem('withdrawData');
      if (!storedData) {
        router.push('/user/withdraw');
        return;
      }

      try {
        const data = JSON.parse(storedData);
        setWithdrawData(data);
      } catch (err) {
        console.error('Error parsing withdrawal data:', err);
        router.push('/user/withdraw');
      }
    }
  }, [mounted, loading, isAuthenticated, router]);

  // Fetch current wallet data
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user?.$id) return;
      
      try {
        setIsLoadingWallet(true);
        
        // Fetch wallet data from API
        const response = await fetch(`/api/wallet?userId=${user.$id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch wallet data');
        }
        
        const data = await response.json();
        setWalletData(data.wallet);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        error('Failed to load wallet information');
      } finally {
        setIsLoadingWallet(false);
      }
    };

    if (user?.$id) {
      fetchWalletData();
    }
  }, [user?.$id, error]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!withdrawData) {
      error('Withdrawal data not found. Please try again.');
      return;
    }

    if (!walletData) {
      error('Wallet information not available. Please try again.');
      return;
    }

    // Double-check balance before creating transaction
    if (withdrawData.amount > walletData.balance) {
      error('Insufficient balance. Please check your current balance.');
      return;
    }

    setIsSubmitting(true);
    setIsCreatingTransaction(true);

    try {
      // Create transaction via API
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          type: 'withdraw',
          amount: withdrawData.amount,
          gateway: 'bank_transfer'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      const transaction = await response.json();

      // Clear session storage
      sessionStorage.removeItem('withdrawData');

      // Show success message
      success(`Withdrawal request submitted successfully! Transaction ID: ${transaction.$id}`);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/user/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Error creating withdrawal transaction:', err);
      error('Failed to submit withdrawal request. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsCreatingTransaction(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    sessionStorage.removeItem('withdrawData');
    router.push('/user/withdraw');
  };

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

  if (!isAuthenticated || !withdrawData) {
    return null;
  }

  const currentBalance = walletData?.balance || 0;
  const remainingBalance = currentBalance - withdrawData.amount;

  return (
    <Layout showSidebar={true}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="mr-4"
            >
              ← Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Confirm Withdrawal</h1>
              <p className="text-gray-600 mt-1">Review your withdrawal details</p>
            </div>
          </div>
        </div>

        {/* Current Balance */}
        {isLoadingWallet ? (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-48"></div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Available Balance</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentBalance.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} {withdrawData.currency}
                </h2>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Withdrawal Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Withdrawal Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount to Withdraw:</span>
                <span className="text-lg font-semibold text-red-600">
                  -{withdrawData.amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} {withdrawData.currency}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Processing Fee:</span>
                <span className="text-lg font-semibold text-green-600">Free</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Remaining Balance:</span>
                <span className="text-lg font-semibold">
                  {remainingBalance.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} {withdrawData.currency}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total Withdrawal:</span>
                  <span className="text-xl font-bold text-red-600">
                    {withdrawData.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} {withdrawData.currency}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Method */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Withdrawal Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <span className="text-2xl">🏦</span>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">Bank Transfer</h3>
                <p className="text-sm text-gray-600">Funds will be transferred to your registered bank account</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Confirm Withdrawal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Important Notice */}
              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-amber-800 mb-2">
                  Important Notice
                </h3>
                <div className="text-sm text-amber-700 space-y-1">
                  <p>• Your withdrawal request will be reviewed by our admin team</p>
                  <p>• Processing time: 1-2 business days</p>
                  <p>• You will receive email notifications about the status</p>
                  <p>• Ensure your bank account details are up to date</p>
                </div>
              </div>

              {/* Balance Check Warning */}
              {remainingBalance < 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">⚠️</span>
                    <p className="text-sm text-red-700">
                      Warning: This withdrawal would result in a negative balance. Please check your amount.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={isSubmitting || isLoadingWallet || remainingBalance < 0}
                >
                  {isSubmitting ? (
                    <>
                      {isCreatingTransaction ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating Transaction...
                        </>
                      ) : (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      )}
                    </>
                  ) : (
                    'Submit Withdrawal Request'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Withdrawal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="text-amber-500 mr-2">📧</span>
                <p>You will receive email notifications when your withdrawal is approved or rejected.</p>
              </div>
              <div className="flex items-start">
                <span className="text-amber-500 mr-2">⏱️</span>
                <p>Processing time depends on your bank and may take 1-2 business days.</p>
              </div>
              <div className="flex items-start">
                <span className="text-amber-500 mr-2">🔒</span>
                <p>All withdrawal requests are reviewed for security and compliance purposes.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';






