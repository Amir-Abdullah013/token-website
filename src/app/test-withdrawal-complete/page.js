'use client';

import { useState } from 'react';
import Button from '../../components/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/Card';

export default function TestWithdrawalCompletePage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('');

  const testCompleteWithdrawal = async () => {
    setLoading(true);
    setResult(null);
    setStep('Testing complete withdrawal process...');

    try {
      // Step 1: Test session
      setStep('Step 1: Checking session...');
      const sessionResponse = await fetch('/api/debug/session');
      const sessionData = await sessionResponse.json();
      console.log('Session data:', sessionData);

      if (!sessionData.success || !sessionData.session?.id) {
        throw new Error('No valid session found');
      }

      // Step 2: Test wallet creation
      setStep('Step 2: Testing wallet creation...');
      const walletResponse = await fetch('/api/test-wallet-creation', {
        method: 'POST'
      });
      const walletData = await walletResponse.json();
      console.log('Wallet data:', walletData);

      if (!walletData.success) {
        throw new Error(`Wallet creation failed: ${walletData.error}`);
      }

      // Step 3: Test withdrawal
      setStep('Step 3: Testing withdrawal...');
      const withdrawalResponse = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 10,
          binanceAddress: 'test-address-12345678901234567890'
        })
      });

      const withdrawalData = await withdrawalResponse.json();
      console.log('Withdrawal data:', withdrawalData);

      setResult({
        success: true,
        session: sessionData,
        wallet: walletData,
        withdrawal: withdrawalData,
        message: 'Complete withdrawal test successful!'
      });

    } catch (error) {
      console.error('Test failed:', error);
      setResult({
        success: false,
        error: error.message,
        step: step
      });
    } finally {
      setLoading(false);
      setStep('');
    }
  };

  const testSessionOnly = async () => {
    setLoading(true);
    setResult(null);
    setStep('Testing session only...');

    try {
      const response = await fetch('/api/debug/session');
      const data = await response.json();
      
      setResult({
        success: true,
        data: data,
        message: 'Session test completed'
      });
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
      setStep('');
    }
  };

  const testWalletOnly = async () => {
    setLoading(true);
    setResult(null);
    setStep('Testing wallet creation only...');

    try {
      const response = await fetch('/api/test-wallet-creation', {
        method: 'POST'
      });
      const data = await response.json();
      
      setResult({
        success: true,
        data: data,
        message: 'Wallet test completed'
      });
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
      setStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Complete Withdrawal Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Button onClick={testSessionOnly} disabled={loading}>
          Test Session
        </Button>
        <Button onClick={testWalletOnly} disabled={loading}>
          Test Wallet
        </Button>
        <Button onClick={testCompleteWithdrawal} disabled={loading}>
          Test Complete Flow
        </Button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{step}</p>
        </div>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>
              {result.success ? '✅ Test Successful' : '❌ Test Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.message && (
              <p className="mb-4 p-3 bg-green-100 text-green-800 rounded">
                {result.message}
              </p>
            )}
            {result.error && (
              <p className="mb-4 p-3 bg-red-100 text-red-800 rounded">
                Error: {result.error}
              </p>
            )}
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>Test Session:</strong> Check if you're properly authenticated</li>
              <li><strong>Test Wallet:</strong> Test wallet creation for your user</li>
              <li><strong>Test Complete Flow:</strong> Test the entire withdrawal process</li>
              <li>Check the browser console for detailed logs</li>
              <li>If any step fails, the error will be shown in the result</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






