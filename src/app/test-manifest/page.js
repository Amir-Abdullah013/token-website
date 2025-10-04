'use client';

import { useState } from 'react';

export default function TestManifest() {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testManifest = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult('🔧 Testing Manifest Configuration...', 'info');
      
      // Test 1: Check if manifest.json exists
      addResult('📍 Testing manifest.json availability...', 'info');
      
      const manifestResponse = await fetch('/manifest.json');
      if (manifestResponse.ok) {
        addResult('✅ Manifest.json is accessible', 'success');
        
        const manifest = await manifestResponse.json();
        addResult(`📋 App Name: ${manifest.name}`, 'info');
        addResult(`📋 Short Name: ${manifest.short_name}`, 'info');
        addResult(`📋 Theme Color: ${manifest.theme_color}`, 'info');
        addResult(`📋 Background Color: ${manifest.background_color}`, 'info');
        addResult(`📋 Display Mode: ${manifest.display}`, 'info');
        
        // Check icons
        if (manifest.icons && manifest.icons.length > 0) {
          addResult(`✅ Icons configured: ${manifest.icons.length} icons`, 'success');
        } else {
          addResult('⚠️ No icons configured', 'warning');
        }
        
        // Check shortcuts
        if (manifest.shortcuts && manifest.shortcuts.length > 0) {
          addResult(`✅ Shortcuts configured: ${manifest.shortcuts.length} shortcuts`, 'success');
        } else {
          addResult('ℹ️ No shortcuts configured', 'info');
        }
        
      } else {
        addResult(`❌ Manifest.json not accessible: ${manifestResponse.status} ${manifestResponse.statusText}`, 'error');
      }
      
      // Test 2: Check manifest route
      addResult('📍 Testing manifest route...', 'info');
      
      const routeResponse = await fetch('/manifest');
      if (routeResponse.ok) {
        addResult('✅ Manifest route is working', 'success');
      } else {
        addResult(`❌ Manifest route failed: ${routeResponse.status} ${routeResponse.statusText}`, 'error');
      }
      
      // Test 3: Check Content-Type header
      addResult('📍 Testing Content-Type header...', 'info');
      
      const headersResponse = await fetch('/manifest.json', { method: 'HEAD' });
      const contentType = headersResponse.headers.get('content-type');
      
      if (contentType && contentType.includes('application/manifest+json')) {
        addResult('✅ Correct Content-Type header', 'success');
      } else {
        addResult(`⚠️ Content-Type: ${contentType || 'Not set'}`, 'warning');
      }
      
      // Test 4: Check CORS headers
      addResult('📍 Testing CORS headers...', 'info');
      
      const corsHeaders = headersResponse.headers.get('access-control-allow-origin');
      if (corsHeaders) {
        addResult('✅ CORS headers configured', 'success');
      } else {
        addResult('⚠️ CORS headers not configured', 'warning');
      }
      
      // Test 5: Check cache headers
      addResult('📍 Testing cache headers...', 'info');
      
      const cacheControl = headersResponse.headers.get('cache-control');
      if (cacheControl) {
        addResult(`✅ Cache headers: ${cacheControl}`, 'success');
      } else {
        addResult('⚠️ Cache headers not configured', 'warning');
      }
      
      // Test 6: Check if icons exist
      addResult('📍 Testing icon availability...', 'info');
      
      const iconTests = [
        { name: '192x192', url: '/icon-192x192.png' },
        { name: '512x512', url: '/icon-512x512.png' },
        { name: '144x144', url: '/icon-144x144.png' },
        { name: '96x96', url: '/icon-96x96.png' }
      ];
      
      for (const icon of iconTests) {
        try {
          const iconResponse = await fetch(icon.url, { method: 'HEAD' });
          if (iconResponse.ok) {
            addResult(`✅ Icon ${icon.name} is accessible`, 'success');
          } else {
            addResult(`❌ Icon ${icon.name} not found: ${iconResponse.status}`, 'error');
          }
        } catch (error) {
          addResult(`❌ Icon ${icon.name} error: ${error.message}`, 'error');
        }
      }
      
      // Final assessment
      const errorCount = testResults.filter(r => r.type === 'error').length;
      const warningCount = testResults.filter(r => r.type === 'warning').length;
      
      if (errorCount === 0 && warningCount === 0) {
        addResult('🎉 All manifest tests passed! Your PWA is properly configured.', 'success');
      } else if (errorCount === 0) {
        addResult('✅ Manifest is working with some warnings. Check the details above.', 'success');
      } else {
        addResult('❌ Manifest has issues. Please fix the errors above.', 'error');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Manifest Test Dashboard</h1>
          
          <div className="mb-6">
            <button
              onClick={testManifest}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded mr-4"
            >
              {isLoading ? 'Testing...' : 'Test Manifest Configuration'}
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
              <p className="text-gray-500">Click "Test Manifest Configuration" to start testing.</p>
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
              <li>Checks if manifest.json is accessible and properly formatted</li>
              <li>Verifies Content-Type headers are correct</li>
              <li>Tests CORS and cache headers</li>
              <li>Validates icon files are available</li>
              <li>Provides detailed feedback on PWA configuration</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Next Steps</h3>
            <p className="text-blue-700">
              If the test passes, your manifest.json should be working correctly and the 401 error should be resolved.
              You can also check the browser's developer tools to see if the manifest is being loaded properly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
