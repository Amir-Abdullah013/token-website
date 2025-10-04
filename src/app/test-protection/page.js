import { getServerSession, getUserRole } from '../../lib/session';
import { redirect } from 'next/navigation';

export default async function TestProtectionPage() {
  const user = await getServerSession();
  const role = await getUserRole(user);

  if (!user) {
    redirect('/auth/signin?redirect=/test-protection');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Route Protection Test</h1>
        <div className="space-y-2">
          <p><strong>User:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {role}</p>
          <p><strong>User ID:</strong> {user.$id}</p>
        </div>
        <div className="mt-6">
          <a 
            href="/user/dashboard" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to User Dashboard
          </a>
        </div>
        {role === 'admin' && (
          <div className="mt-4">
            <a 
              href="/admin/dashboard" 
              className="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Go to Admin Dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  );
}













