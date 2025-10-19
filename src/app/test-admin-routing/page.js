'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';

export default function TestAdminRoutingPage() {
  const router = useRouter();
  const [testResults, setTestResults] = useState({});

  const testRoute = async (route, testName) => {
    try {
      const response = await fetch(route);
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          status: response.status,
          ok: response.ok,
          url: route
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          error: error.message,
          url: route
        }
      }));
    }
  };

  const testAllRoutes = async () => {
    await testRoute('/api/admin/withdrawals', 'Admin Withdrawals API');
    await testRoute('/api/auth/check-role', 'Check Role API');
    await testRoute('/api/debug/session', 'Session Debug API');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Routing Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Button onClick={() => router.push('/admin/withdrawals')}>
          Go to Admin Withdrawals
        </Button>
        <Button onClick={() => router.push('/admin/dashboard')}>
          Go to Admin Dashboard
        </Button>
        <Button onClick={() => router.push('/admin/transactions')}>
          Go to Admin Transactions
        </Button>
        <Button onClick={testAllRoutes}>
          Test All API Routes
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
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';







