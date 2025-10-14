'use client';

import { useAuth } from '../../lib/auth-context';
import { useAuthContext } from '../../components/AuthProvider';

export default function TestAuthContext() {
  const authFromContext = useAuth();
  const authFromProvider = useAuthContext();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Auth Context Test
          </h1>
          
          <div className="space-y-6">
            {/* Test Results */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Auth Context Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-medium text-green-900 mb-2">✅ useAuth Hook</h3>
                  <p className="text-sm text-green-700">
                    Status: {authFromContext.loading ? 'Loading...' : 'Ready'}
                  </p>
                  <p className="text-sm text-green-700">
                    Authenticated: {authFromContext.isAuthenticated ? 'Yes' : 'No'}
                  </p>
                  <p className="text-sm text-green-700">
                    User: {authFromContext.user ? 'Present' : 'None'}
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-medium text-blue-900 mb-2">✅ useAuthContext Hook</h3>
                  <p className="text-sm text-blue-700">
                    Status: {authFromProvider.loading ? 'Loading...' : 'Ready'}
                  </p>
                  <p className="text-sm text-blue-700">
                    Authenticated: {authFromProvider.isAuthenticated ? 'Yes' : 'No'}
                  </p>
                  <p className="text-sm text-blue-700">
                    User: {authFromProvider.user ? 'Present' : 'None'}
                  </p>
                </div>
              </div>
            </div>

            {/* User Information */}
            {authFromContext.user && (
              <div className="border rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">User Information</h2>
                <div className="bg-gray-50 p-4 rounded">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(authFromContext.user, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Test Instructions */}
            <div className="border rounded-lg p-4 bg-yellow-50">
              <h2 className="text-xl font-semibold mb-4 text-yellow-900">Test Instructions</h2>
              <div className="space-y-2 text-sm">
                <p><strong>✅ If you see this page without errors:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>The AuthProvider context is working correctly</li>
                  <li>Both useAuth and useAuthContext hooks are functional</li>
                  <li>The UserProfile component should now work without errors</li>
                </ul>
                
                <p className="mt-4"><strong>❌ If you see errors:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Check that AuthProvider is wrapping your components</li>
                  <li>Verify the import paths are correct</li>
                  <li>Make sure the auth-context.js file exists</li>
                </ul>
              </div>
            </div>

            {/* Navigation */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h2 className="text-xl font-semibold mb-4 text-blue-900">Test Navigation</h2>
              <div className="space-x-4">
                <a 
                  href="/user/profile" 
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Test User Profile
                </a>
                <a 
                  href="/user/dashboard" 
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Test Dashboard
                </a>
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

