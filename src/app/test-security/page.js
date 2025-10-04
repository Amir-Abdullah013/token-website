'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authHelpers } from '@/lib/supabase';;
import { Button, Card, Loader, Toast } from '@/components';

export default function TestSecurityPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = await authHelpers.getCurrentUser();
      
      if (!currentUser) {
        router.push('/auth/signin');
        return;
      }

      setUser(currentUser);
      
      // Load active sessions
      const activeSessions = await authHelpers.getActiveSessions();
      setSessions(activeSessions);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      setToast({
        type: 'error',
        message: 'Failed to load user data'
      });
    } finally {
      setLoading(false);
    }
  };

  const testLogoutAllSessions = async () => {
    if (!confirm('This will log you out from all devices. Are you sure?')) {
      return;
    }

    try {
      await authHelpers.logoutAllSessions();
      setToast({
        type: 'success',
        message: 'Logged out from all sessions successfully'
      });
      
      // Redirect to sign in after a short delay
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);
      
    } catch (error) {
      console.error('Error logging out all sessions:', error);
      setToast({
        type: 'error',
        message: 'Failed to log out from all sessions'
      });
    }
  };

  const formatSessionInfo = (session) => {
    const userAgent = session.userAgent || 'Unknown device';
    const isCurrentSession = session.current;
    
    // Extract basic device info from user agent
    let deviceInfo = 'Unknown device';
    if (userAgent.includes('Mobile')) {
      deviceInfo = 'Mobile device';
    } else if (userAgent.includes('Tablet')) {
      deviceInfo = 'Tablet';
    } else if (userAgent.includes('Windows')) {
      deviceInfo = 'Windows device';
    } else if (userAgent.includes('Mac')) {
      deviceInfo = 'Mac device';
    } else if (userAgent.includes('Linux')) {
      deviceInfo = 'Linux device';
    }

    return {
      device: deviceInfo,
      isCurrent: isCurrentSession,
      lastActive: new Date(session.providerAccessTokenExpiry * 1000).toLocaleString()
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Test Security Settings</h1>
          <p className="text-gray-600 mt-2">
            Test the security settings functionality
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Info */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{user?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <p className="text-sm text-gray-900 font-mono break-all">{user?.$id || 'N/A'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Active Sessions */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
                <span className="text-sm text-gray-500">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
              </div>
              
              {sessions.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-gray-400 text-4xl mb-2">🔒</div>
                  <p className="text-gray-600">No active sessions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => {
                    const sessionInfo = formatSessionInfo(session);
                    return (
                      <div
                        key={session.$id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-lg">
                            {sessionInfo.device.includes('Mobile') ? '📱' :
                             sessionInfo.device.includes('Tablet') ? '📱' :
                             sessionInfo.device.includes('Windows') ? '💻' :
                             sessionInfo.device.includes('Mac') ? '💻' :
                             '💻'}
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {sessionInfo.device}
                              </h4>
                              {sessionInfo.isCurrent && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              Last active: {sessionInfo.lastActive}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Test Actions */}
        <div className="mt-8 space-y-4">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => router.push('/user/security')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  🔒 Security Settings
                </Button>
                
                <Button
                  onClick={() => router.push('/user/profile?tab=security')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  👤 Profile Security Tab
                </Button>
                
                <Button
                  onClick={testLogoutAllSessions}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  🚪 Logout All Sessions
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">✅ Implemented Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Two-Factor Authentication toggle (dummy)</li>
                    <li>• Change password functionality</li>
                    <li>• Active sessions display</li>
                    <li>• Logout all sessions</li>
                    <li>• Security settings page</li>
                    <li>• Profile security tab</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">🔧 Test Instructions</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Visit security settings page</li>
                    <li>• Test 2FA toggle (use code: 123456)</li>
                    <li>• Try changing password</li>
                    <li>• View active sessions</li>
                    <li>• Test logout all sessions</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <Button
            onClick={() => router.push('/user/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}










