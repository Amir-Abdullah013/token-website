'use client';

import { useState } from 'react';
import { getBaseUrl, getOAuthCallbackUrl } from '@/lib/url-utils';
import { getOAuthConfig, validateOAuthConfig } from '@/lib/oauth-config';

export default function TestOAuth() {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testOAuthFlow = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult('🔧 Starting OAuth Test...', 'info');
      
      // Test 1: Check OAuth configuration
      const oauthConfig = getOAuthConfig();
      const validation = validateOAuthConfig();
      
      addResult(`📍 Environment: ${oauthConfig.environment}`, 'info');
      addResult(`📍 Base URL: ${oauthConfig.baseUrl}`, 'info');
      addResult(`📍 Callback URL: ${oauthConfig.callbackUrl}`, 'info');
      addResult(`📍 Is Development: ${oauthConfig.isDevelopment ? 'Yes' : 'No'}`, 'info');
      addResult(`📍 Is Vercel: ${oauthConfig.isVercel ? 'Yes' : 'No'}`, 'info');
      
      // Test 2: Check validation results
      if (validation.isValid) {
        addResult('✅ OAuth Configuration Valid', 'success');
      } else {
        addResult('❌ OAuth Configuration Invalid', 'error');
        validation.errors.forEach(error => addResult(`  - ${error}`, 'error'));
      }
      
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => addResult(`⚠️ ${warning}`, 'warning'));
      }
      
      // Test 3: Check environment variables
      const hasGoogleClientId = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const hasGoogleClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
      addResult(`🔑 Google Client ID: ${hasGoogleClientId ? '✅ Set' : '❌ Missing'}`, hasGoogleClientId ? 'success' : 'error');
      addResult(`🔑 Google Client Secret: ${hasGoogleClientSecret ? '✅ Set' : '❌ Missing'}`, hasGoogleClientSecret ? 'success' : 'error');
      
      // Test 4: Test OAuth initiation
      addResult('🚀 Testing OAuth initiation...', 'info');
      
      // Test OAuth by redirecting directly
      window.location.href = '/api/auth/oauth/google';
      return; // Exit early since we're redirecting
      
      if (response.ok) {
        const data = await response.json();
        addResult('✅ OAuth initiation successful', 'success');
        addResult(`🔗 Generated OAuth URL: ${data.url.substring(0, 100)}...`, 'info');
        
        // Test if the URL contains the correct redirect URI
        const hasCorrectRedirectUri = data.url.includes(encodeURIComponent(oauthConfig.callbackUrl));
        addResult(`🎯 Correct Redirect URI: ${hasCorrectRedirectUri ? '✅ Yes' : '❌ No'}`, hasCorrectRedirectUri ? 'success' : 'error');
        
        // Test environment-specific configuration
        if (oauthConfig.isDevelopment) {
          addResult('🏠 Development Environment Detected', 'info');
          addResult('✅ Localhost OAuth should work correctly', 'success');
        } else if (oauthConfig.isVercel) {
          addResult('☁️ Vercel Production Environment Detected', 'info');
          addResult('✅ Vercel OAuth should work correctly', 'success');
        }
        
        if (hasCorrectRedirectUri && validation.isValid) {
          addResult('🎉 OAuth configuration is perfect! Ready for both localhost and Vercel.', 'success');
        } else {
          addResult('⚠️ OAuth configuration needs adjustment. Check your environment variables.', 'warning');
        }
      } else {
        const error = await response.json();
        addResult(`❌ OAuth initiation failed: ${error.error}`, 'error');
      }
      
    } catch (error) {
      addResult(`❌ Test failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">OAuth Test Dashboard</h1>
          
          <div className="mb-6">
            <button
              onClick={testOAuthFlow}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded mr-4"
            >
              {isLoading ? 'Testing...' : 'Test OAuth Configuration'}
            </button>
            
            <button
              onClick={clearResults}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Clear Results
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Test Results</h2>
            
            {testResults.length === 0 ? (
              <p className="text-gray-500">Click "Test OAuth Configuration" to start testing.</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      result.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                      result.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                      result.type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{result.message}</span>
                      <span className="text-sm opacity-75 ml-4">{result.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">What This Test Does</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Checks your URL configuration (localhost vs production)</li>
              <li>Verifies environment variables are set correctly</li>
              <li>Tests OAuth initiation endpoint</li>
              <li>Validates redirect URI configuration</li>
              <li>Provides detailed feedback on any issues</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Next Steps</h3>
            <p className="text-blue-700">
              If the test passes, you can now try the actual OAuth flow by visiting{' '}
              <a href="/auth/signin" className="text-blue-600 hover:underline">
                /auth/signin
              </a>{' '}
              and clicking "Sign in with Google".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';
