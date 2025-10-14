'use client';

import { useState } from 'react';

export default function TestSignInErrors() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testSignIn = async () => {
    setLoading(true);
    setResult('Testing sign-in...');

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Sign-in successful! User: ${data.user.name}`);
      } else {
        setResult(`❌ Error: ${data.error}${data.errorCode ? ` (Code: ${data.errorCode})` : ''}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCases = [
    {
      name: 'Non-existent User',
      email: 'nonexistent@example.com',
      password: 'anypassword',
      description: 'Should show "No account found" error with signup link'
    },
    {
      name: 'Wrong Password',
      email: 'test@example.com',
      password: 'wrongpassword',
      description: 'Should show "Incorrect password" error with forgot password link'
    },
    {
      name: 'Valid Credentials',
      email: 'test@example.com',
      password: 'password123',
      description: 'Should sign in successfully'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Sign-In Error Handling Test</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual Test */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Manual Test</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter password"
                  />
                </div>

                <button
                  onClick={testSignIn}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test Sign-In'}
                </button>
              </div>
            </div>

            {/* Quick Test Cases */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Test Cases</h2>
              
              <div className="space-y-3">
                {testCases.map((testCase, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-800">{testCase.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{testCase.description}</p>
                    <button
                      onClick={() => {
                        setEmail(testCase.email);
                        setPassword(testCase.password);
                        testSignIn();
                      }}
                      disabled={loading}
                      className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
                    >
                      Test This Case
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="mt-6 p-4 rounded-lg ${
              result.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <p>{result}</p>
            </div>
          )}

          {/* Error Handling Features */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Error Handling Features:</h3>
            <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
              <li><strong>USER_NOT_FOUND:</strong> Shows "No account found" with signup link</li>
              <li><strong>INVALID_PASSWORD:</strong> Shows "Incorrect password" with forgot password link</li>
              <li><strong>Network Errors:</strong> Shows generic network error message</li>
              <li><strong>Validation Errors:</strong> Shows specific field validation errors</li>
            </ul>
          </div>

          {/* Test Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Test Instructions:</h3>
            <ol className="list-decimal list-inside text-yellow-700 space-y-1 text-sm">
              <li>Try signing in with a non-existent email (should show "No account found" error)</li>
              <li>Try signing in with wrong password (should show "Incorrect password" error)</li>
              <li>Try signing in with valid credentials (should succeed)</li>
              <li>Check that error messages include helpful action links</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';

