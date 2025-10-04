'use client';

import { useState } from 'react';

export default function SetupDatabase() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const setupDatabase = async () => {
    setStatus('loading');
    setMessage('Setting up database...');

    try {
      const response = await fetch('/api/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.error);
      }
    } catch (error) {
      console.error('Database setup error:', error);
      setStatus('error');
      setMessage('Failed to setup database. Please check your connection.');
    }
  };

  const testDatabase = async () => {
    setStatus('loading');
    setMessage('Testing database connection...');

    try {
      const response = await fetch('/api/test-database', {
        method: 'GET',
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.error);
      }
    } catch (error) {
      console.error('Database test error:', error);
      setStatus('error');
      setMessage('Failed to test database connection.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Database Setup</h1>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Database Status</h2>
              <div className={`p-3 rounded-lg ${
                status === 'success' ? 'bg-green-100 text-green-800' :
                status === 'error' ? 'bg-red-100 text-red-800' :
                status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                <div className="font-semibold">Status: {status}</div>
                {message && <div className="text-sm mt-1">{message}</div>}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={setupDatabase}
                disabled={status === 'loading'}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Setup Database
              </button>

              <button
                onClick={testDatabase}
                disabled={status === 'loading'}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test Database
              </button>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Instructions</h3>
              <ol className="list-decimal list-inside text-yellow-700 space-y-1">
                <li>Click "Setup Database" to initialize the database schema</li>
                <li>Click "Test Database" to verify the connection works</li>
                <li>Make sure your DATABASE_URL is properly configured</li>
                <li>Check the console for any error messages</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}