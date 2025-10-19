import { getServerSession } from '@/lib/session';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default async function DebugUserDeposit() {
  const session = await getServerSession();
  
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">No Session Found</h1>
          <p>Please sign in first to debug user deposit issues.</p>
        </div>
      </div>
    );
  }

  let dbUser = null;
  let userExists = false;
  let error = null;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const userData = await response.json();
      dbUser = userData.user;
      userExists = !!dbUser;
    } else {
      error = 'Failed to fetch user data';
    }
  } catch (err) {
    error = err.message;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">User Deposit Debug</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Information</h2>
          <div className="space-y-2">
            <p><strong>User ID:</strong> {session.id}</p>
            <p><strong>Email:</strong> {session.email}</p>
            <p><strong>Name:</strong> {session.name || 'N/A'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Database User Check</h2>
          {error ? (
            <div className="text-red-600">
              <p><strong>Error:</strong> {error}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p><strong>User Exists:</strong> {userExists ? '✅ Yes' : '❌ No'}</p>
              {dbUser ? (
                <div>
                  <p><strong>Database ID:</strong> {dbUser.id}</p>
                  <p><strong>Database Email:</strong> {dbUser.email}</p>
                  <p><strong>Database Name:</strong> {dbUser.name}</p>
                  <p><strong>Database Role:</strong> {dbUser.role}</p>
                  <p><strong>Email Verified:</strong> {dbUser.emailVerified ? 'Yes' : 'No'}</p>
                </div>
              ) : (
                <div className="text-red-600">
                  <p>User not found in database. This is likely the cause of the deposit error.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {!userExists && !error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">Fix Suggestion</h3>
            <p className="text-yellow-700 mb-4">
              The user exists in the session but not in the database. This is causing the foreign key constraint error.
            </p>
            <div className="space-y-2">
              <p><strong>Solution:</strong> Create the user in the database with the following information:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                <li>ID: {session.id}</li>
                <li>Email: {session.email}</li>
                <li>Name: {session.name || 'User'}</li>
                <li>Role: USER (or ADMIN if needed)</li>
              </ul>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Next Steps</h3>
          <div className="space-y-2 text-blue-700">
            <p>1. If user doesn't exist, create them in the database</p>
            <p>2. Ensure the user ID matches between session and database</p>
            <p>3. Test the deposit functionality again</p>
          </div>
        </div>
      </div>
    </div>
  );
}
