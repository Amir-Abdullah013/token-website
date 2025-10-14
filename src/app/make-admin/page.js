'use client';

import { useState } from 'react';

export default function MakeAdminPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const makeUserAdmin = async () => {
    if (!email) {
      setMessage('❌ Please enter an email address');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/update-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          role: 'ADMIN'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setEmail(''); // Clear the form
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Make User Admin</h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={makeUserAdmin}
              disabled={loading || !email}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Making Admin...' : 'Make Admin'}
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mt-6 p-4 rounded-md ${
              message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">How to Use:</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-2">
              <li>Enter the email address of the user you want to make admin</li>
              <li>Click "Make Admin" button</li>
              <li>That user can now access <code className="bg-blue-100 px-1 rounded">/admin/dashboard</code></li>
              <li>The user must be signed in to access the admin panel</li>
            </ol>
          </div>

          {/* Quick Access Links */}
          <div className="mt-6 flex gap-4">
            <a 
              href="/admin/dashboard" 
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Go to Admin Dashboard
            </a>
            <a 
              href="/debug-user-role" 
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Debug User Role
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';














