'use client';

import { useEffect } from 'react';

export default function RedirectDashboard() {
  useEffect(() => {
    console.log('Direct redirect to dashboard');
    // Force redirect to dashboard
    window.location.href = '/user/dashboard';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Redirecting to Dashboard...</h2>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => window.location.href = '/user/dashboard'}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}




