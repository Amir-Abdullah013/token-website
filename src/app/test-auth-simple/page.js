'use client';

import { useState } from 'react';

export default function TestAuthSimple() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testSignup = async () => {
    setLoading(true);
    setResult('Testing signup...');
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Amir Abdullah',
          email: 'amirabdullah2508@gmail.com',
          password: 'password123'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Signup successful! User ID: ${data.user.id}`);
      } else {
        setResult(`❌ Signup failed: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignin = async () => {
    setLoading(true);
    setResult('Testing signin...');
    
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Signin successful! Welcome ${data.user.name}`);
      } else {
        setResult(`❌ Signin failed: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Simple Auth Test</h1>
          
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={testSignup}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Test Signup
              </button>
              
              <button
                onClick={testSignin}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Test Signin
              </button>
            </div>
            
            {result && (
              <div className={`p-4 rounded-lg ${
                result.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {result}
              </div>
            )}
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Test Instructions:</h3>
              <ol className="list-decimal list-inside text-blue-700 space-y-1">
                <li>Click "Test Signup" to create a new account</li>
                <li>Click "Test Signin" to authenticate with test credentials</li>
                <li>Check the result message above</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
