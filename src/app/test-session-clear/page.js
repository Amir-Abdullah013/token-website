'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { clearAllSessions } from '@/lib/session-clear';
import { switchGmailAccount, forceFreshAuth } from '@/lib/gmail-switch';
import GmailSwitchButton from '@/components/GmailSwitchButton';

// Disable prerendering for this page
export const dynamic = 'force-dynamic';
export const ssr = false;

export default function TestSessionClear() {
  const { user, signOut } = useAuth();
  const [sessionData, setSessionData] = useState(null);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    // Get current session data
    const getSessionData = () => {
      const userSession = localStorage.getItem('userSession');
      const oauthSession = localStorage.getItem('oauthSession');
      const session = localStorage.getItem('session');
      
      return {
        userSession: userSession ? JSON.parse(userSession) : null,
        oauthSession: oauthSession ? JSON.parse(oauthSession) : null,
        session: session ? JSON.parse(session) : null,
        cookies: document.cookie
      };
    };

    setSessionData(getSessionData());
  }, []);

  const testSessionClear = async () => {
    const results = [];
    
    try {
      // Test 1: Clear client session
      results.push('Testing client session clear...');
      const clientCleared = clearAllSessions();
      results.push(`Client session clear: ${clientCleared ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 2: Check if sessions are actually cleared
      setTimeout(() => {
        const userSession = localStorage.getItem('userSession');
        const oauthSession = localStorage.getItem('oauthSession');
        const session = localStorage.getItem('session');
        
        results.push(`userSession cleared: ${!userSession ? 'YES' : 'NO'}`);
        results.push(`oauthSession cleared: ${!oauthSession ? 'YES' : 'NO'}`);
        results.push(`session cleared: ${!session ? 'YES' : 'NO'}`);
        
        setTestResults([...results]);
      }, 100);
      
    } catch (error) {
      results.push(`Error: ${error.message}`);
      setTestResults([...results]);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setTestResults(prev => [...prev, 'Sign out completed']);
    } catch (error) {
      setTestResults(prev => [...prev, `Sign out error: ${error.message}`]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Session Clear Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Session Data */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Current Session Data</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">Auth Context User:</h3>
                <pre className="bg-gray-900 p-3 rounded text-sm text-gray-300 overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">Local Storage:</h3>
                <pre className="bg-gray-900 p-3 rounded text-sm text-gray-300 overflow-auto">
                  {JSON.stringify(sessionData, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Test Controls</h2>
            
            <div className="space-y-4">
              <button
                onClick={testSessionClear}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Test Session Clear
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Sign Out (Full Clear)
              </button>
              
              <GmailSwitchButton />
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="mt-6 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="text-gray-300 font-mono text-sm">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
