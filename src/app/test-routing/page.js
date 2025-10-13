'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../../components/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/Card';

export default function TestRoutingPage() {
  const router = useRouter();
  const [testResults, setTestResults] = useState({});

  const testNavigation = (route, testName) => {
    try {
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          status: 'success',
          route: route,
          message: `Navigating to ${route}`
        }
      }));
      router.push(route);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          status: 'error',
          route: route,
          error: error.message
        }
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Routing Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Button onClick={() => testNavigation('/admin/withdrawals', 'Admin Withdrawals')}>
          Test Admin Withdrawals
        </Button>
        <Button onClick={() => testNavigation('/admin/dashboard', 'Admin Dashboard')}>
          Test Admin Dashboard
        </Button>
        <Button onClick={() => testNavigation('/admin/transactions', 'Admin Transactions')}>
          Test Admin Transactions
        </Button>
        <Button onClick={() => testNavigation('/user/dashboard', 'User Dashboard')}>
          Test User Dashboard
        </Button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click "Test Admin Withdrawals" to navigate to the admin withdrawals page</li>
              <li>If it redirects to user dashboard, there's an authentication issue</li>
              <li>If it shows the withdrawals page, the routing is working correctly</li>
              <li>Check the browser console for any error messages</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}







