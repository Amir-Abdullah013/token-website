'use client';

import { useState } from 'react';
import Button from '../../components/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/Card';

export default function TestAdminWithdrawalsPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAdminWithdrawalsAPI = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-admin-withdrawals');
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

  const testAdminWithdrawalsPage = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/withdrawals');
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

  const testSession = async () => {
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Withdrawals Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Button onClick={testSession} disabled={loading}>
          Test Session
        </Button>
        <Button onClick={testAdminWithdrawalsAPI} disabled={loading}>
          Test Admin API
        </Button>
        <Button onClick={testAdminWithdrawalsPage} disabled={loading}>
          Test Admin Page
        </Button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Testing...</p>
        </div>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>
              {result.ok ? '✅ Test Successful' : '❌ Test Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p><strong>Status:</strong> {result.status}</p>
              <p><strong>Success:</strong> {result.ok ? 'Yes' : 'No'}</p>
            </div>
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
              <li><strong>Test Admin API:</strong> Test the admin withdrawals API endpoint</li>
              <li><strong>Test Admin Page:</strong> Test the actual admin withdrawals page API</li>
              <li>Check the browser console for detailed logs</li>
              <li>If any test fails, check the error message for details</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

