'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';

export default function TestWithdrawPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testWithdrawAPI = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 10,
          binanceAddress: 'test-address-12345678901234567890'
        })
      });

      const data = await response.json();
      
      setResult({
        status: response.status,
        ok: response.ok,
        data: data
      });
    } catch (error) {
      setResult({
        error: error.message,
        type: 'network_error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testSessionAPI = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/debug/session');
      const data = await response.json();
      
      setResult({
        status: response.status,
        ok: response.ok,
        data: data
      });
    } catch (error) {
      setResult({
        error: error.message,
        type: 'network_error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseAPI = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/debug/database');
      const data = await response.json();
      
      setResult({
        status: response.status,
        ok: response.ok,
        data: data
      });
    } catch (error) {
      setResult({
        error: error.message,
        type: 'network_error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Withdraw API Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Button onClick={testSessionAPI} disabled={loading}>
          Test Session API
        </Button>
        <Button onClick={testDatabaseAPI} disabled={loading}>
          Test Database API
        </Button>
        <Button onClick={testWithdrawAPI} disabled={loading}>
          Test Withdraw API
        </Button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Testing...</p>
        </div>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';







