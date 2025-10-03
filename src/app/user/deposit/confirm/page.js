'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/auth-context';
import Layout from '../../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../../components/Card';
import Button from '../../../../components/Button';
import { useToast, ToastContainer } from '../../../../components/Toast';

export default function DepositConfirmPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // State
  const [depositData, setDepositData] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);

  // Payment gateways
  const paymentGateways = [
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Direct bank transfer to our account',
      icon: '🏦',
      processingTime: '1-2 business days',
      fee: 'Free'
    },
    {
      id: 'easypaisa',
      name: 'Easypaisa',
      description: 'Mobile wallet payment',
      icon: '📱',
      processingTime: 'Instant',
      fee: 'Free'
    },
    {
      id: 'jazzcash',
      name: 'JazzCash',
      description: 'Mobile wallet payment',
      icon: '💳',
      processingTime: 'Instant',
      fee: 'Free'
    }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
        return;
      }

      // Get deposit data from session storage
      const storedData = sessionStorage.getItem('depositData');
      if (!storedData) {
        router.push('/user/deposit');
        return;
      }

      try {
        const data = JSON.parse(storedData);
        setDepositData(data);
      } catch (err) {
        console.error('Error parsing deposit data:', err);
        router.push('/user/deposit');
      }
    }
  }, [mounted, loading, isAuthenticated, router]);

  // Handle gateway selection
  const handleGatewaySelect = (gatewayId) => {
    setSelectedGateway(gatewayId);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedGateway) {
      error('Please select a payment method');
      return;
    }

    if (!depositData) {
      error('Deposit data not found. Please try again.');
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
          type: 'deposit',
          amount: depositData.amount,
          gateway: selectedGateway
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      const transaction = await response.json();

      // Clear session storage
      sessionStorage.removeItem('depositData');

      // Show success message
      success(`Deposit request submitted successfully! Transaction ID: ${transaction.$id}`);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/user/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Error creating deposit transaction:', err);
      error('Failed to submit deposit request. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsCreatingTransaction(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    sessionStorage.removeItem('depositData');
    router.push('/user/deposit');
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

  if (!isAuthenticated || !depositData) {
    return null;
  }

  const selectedGatewayData = paymentGateways.find(gw => gw.id === selectedGateway);

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
              <h1 className="text-3xl font-bold text-gray-900">Confirm Deposit</h1>
              <p className="text-gray-600 mt-1">Review your deposit details and select payment method</p>
            </div>
          </div>
        </div>

        {/* Deposit Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Deposit Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount:</span>
                <span className="text-lg font-semibold">
                  {depositData.amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} {depositData.currency}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Processing Fee:</span>
                <span className="text-lg font-semibold text-green-600">Free</span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-gray-900">
                    {depositData.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} {depositData.currency}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                {paymentGateways.map((gateway) => (
                  <div
                    key={gateway.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      selectedGateway === gateway.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleGatewaySelect(gateway.id)}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedGateway === gateway.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedGateway === gateway.id && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{gateway.icon}</span>
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">
                                {gateway.name}
                              </h3>
                              <p className="text-sm text-gray-600">{gateway.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{gateway.fee}</p>
                            <p className="text-xs text-gray-500">{gateway.processingTime}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Gateway Details */}
              {selectedGatewayData && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">
                    Payment Instructions for {selectedGatewayData.name}
                  </h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    {selectedGatewayData.id === 'bank_transfer' && (
                      <>
                        <p>• Transfer the amount to our bank account</p>
                        <p>• Include your user ID in the reference</p>
                        <p>• Processing time: 1-2 business days</p>
                      </>
                    )}
                    {selectedGatewayData.id === 'easypaisa' && (
                      <>
                        <p>• Send payment to our Easypaisa account</p>
                        <p>• Use your user ID as reference</p>
                        <p>• Processing time: Instant</p>
                      </>
                    )}
                    {selectedGatewayData.id === 'jazzcash' && (
                      <>
                        <p>• Send payment to our JazzCash account</p>
                        <p>• Use your user ID as reference</p>
                        <p>• Processing time: Instant</p>
                      </>
                    )}
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
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting || !selectedGateway}
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
                    'Submit Deposit Request'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg text-amber-800">Important Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-amber-700">
              <div className="flex items-start">
                <span className="text-amber-500 mr-2">⚠️</span>
                <p>Your deposit request will be reviewed by our admin team before being approved.</p>
              </div>
              <div className="flex items-start">
                <span className="text-amber-500 mr-2">📧</span>
                <p>You will receive an email notification once your deposit is approved or rejected.</p>
              </div>
              <div className="flex items-start">
                <span className="text-amber-500 mr-2">⏱️</span>
                <p>Processing time depends on the payment method selected and may take 1-2 business days.</p>
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
