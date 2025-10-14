'use client';

import { useState } from 'react';

export default function TestForgotPassword() {
  const [email, setEmail] = useState('test@example.com');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testForgotPassword = async () => {
    setLoading(true);
    setResult('Testing forgot password...');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ ${data.message}`);
      } else {
        setResult(`❌ ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testVerifyOtp = async () => {
    setLoading(true);
    setResult('Testing OTP verification...');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ ${data.message}`);
      } else {
        setResult(`❌ ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testResetPassword = async () => {
    setLoading(true);
    setResult('Testing password reset...');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ ${data.message}`);
      } else {
        setResult(`❌ ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testEmailConfig = async () => {
    setLoading(true);
    setResult('Testing email configuration...');

    try {
      const response = await fetch('/api/test-email', {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ ${data.message}`);
      } else {
        setResult(`❌ ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Forgot Password Test</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Test Controls */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Controls</h2>
              
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
                    OTP (6 digits)
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={testEmailConfig}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Test Email Config
                </button>

                <button
                  onClick={testForgotPassword}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Test Forgot Password
                </button>

                <button
                  onClick={testVerifyOtp}
                  disabled={loading}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Test Verify OTP
                </button>

                <button
                  onClick={testResetPassword}
                  disabled={loading}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Test Reset Password
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Results</h2>
              
              {result && (
                <div className={`p-4 rounded-lg ${
                  result.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result}
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Test Instructions:</h3>
                <ol className="list-decimal list-inside text-blue-700 space-y-1 text-sm">
                  <li>First, test email configuration</li>
                  <li>Enter a valid email address</li>
                  <li>Click "Test Forgot Password" to send OTP</li>
                  <li>Check console for the generated OTP</li>
                  <li>Enter the OTP and click "Test Verify OTP"</li>
                  <li>Enter new password and click "Test Reset Password"</li>
                </ol>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Environment Variables Needed:</h3>
                <ul className="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                  <li>SMTP_USER (Gmail address)</li>
                  <li>SMTP_PASS (Gmail app password)</li>
                  <li>SMTP_HOST (smtp.gmail.com)</li>
                  <li>SMTP_PORT (587)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';

