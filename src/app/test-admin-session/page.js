'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestAdminSession() {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = () => {
      try {
        // Check localStorage for session data
        const userSession = localStorage.getItem('userSession');
        const oauthSession = localStorage.getItem('oauthSession');
        
        if (userSession) {
          const userData = JSON.parse(userSession);
          setSessionData({
            source: 'localStorage',
            user: userData
          });
        } else if (oauthSession) {
          const oauthData = JSON.parse(oauthSession);
          setSessionData({
            source: 'OAuth localStorage',
            oauth: oauthData
          });
        } else {
          setSessionData({
            source: 'No session found',
            message: 'No session data in localStorage'
          });
        }
      } catch (error) {
        setSessionData({
          source: 'Error',
          error: error.message
        });
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const testAdminDashboard = () => {
    // Set a mock admin session for testing
    const mockAdminSession = {
      id: 'mock-admin-id',
      email: 'amirabdullah2508@gmail.com',
      name: 'Amir Abdullah',
      role: 'ADMIN',
      emailVerified: true
    };

    localStorage.setItem('userSession', JSON.stringify(mockAdminSession));
    
    // Also set in cookies for server-side access
    document.cookie = `userSession=${JSON.stringify(mockAdminSession)}; path=/; max-age=86400; SameSite=Lax`;
    
    console.log('Mock admin session set:', mockAdminSession);
    alert('Mock admin session set! Now try accessing the admin dashboard.');
  };

  const clearSession = () => {
    localStorage.removeItem('userSession');
    localStorage.removeItem('oauthSession');
    document.cookie = 'userSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'oauthSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setSessionData(null);
    alert('Session cleared!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading session data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Session Test</h1>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Current Session Data</h2>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(sessionData, null, 2)}
              </pre>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={testAdminDashboard}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Set Mock Admin Session
              </button>
              
              <button
                onClick={clearSession}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Clear Session
              </button>
              
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Test Admin Dashboard
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside text-yellow-700 space-y-1">
                <li>Click "Set Mock Admin Session" to set your admin email in the session</li>
                <li>Click "Test Admin Dashboard" to try accessing the admin dashboard</li>
                <li>If it works, the session handling is fixed!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
