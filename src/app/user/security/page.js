'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authHelpers } from '@/lib/supabase';;
import { Button, Card, Input, Loader, Toast } from '@/components';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [toast, setToast] = useState(null);
  
  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Session management state
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [deletingSession, setDeletingSession] = useState(null);

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
      
      // Check 2FA status (dummy implementation)
      // In a real implementation, this would check user preferences or database
      const twoFactorStatus = localStorage.getItem('twoFactorEnabled') === 'true';
      setTwoFactorEnabled(twoFactorStatus);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      setToast({
        type: 'error',
        message: 'Failed to load security settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    if (twoFactorEnabled) {
      // Disable 2FA
      setTwoFactorEnabled(false);
      localStorage.removeItem('twoFactorEnabled');
      setToast({
        type: 'success',
        message: 'Two-factor authentication has been disabled'
      });
    } else {
      // Enable 2FA - show setup
      setShowTwoFactorSetup(true);
    }
  };

  const handleTwoFactorSetup = () => {
    // Dummy implementation - in real app, this would generate QR code and verify
    if (twoFactorCode === '123456') {
      setTwoFactorEnabled(true);
      setShowTwoFactorSetup(false);
      setTwoFactorCode('');
      localStorage.setItem('twoFactorEnabled', 'true');
      setToast({
        type: 'success',
        message: 'Two-factor authentication has been enabled'
      });
    } else {
      setToast({
        type: 'error',
        message: 'Invalid verification code. Please try again.'
      });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({
        type: 'error',
        message: 'New passwords do not match'
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setToast({
        type: 'error',
        message: 'Password must be at least 8 characters long'
      });
      return;
    }

    try {
      setChangingPassword(true);
      await authHelpers.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      setToast({
        type: 'success',
        message: 'Password changed successfully'
      });
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (error) {
      console.error('Error changing password:', error);
      setToast({
        type: 'error',
        message: 'Failed to change password. Please check your current password.'
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogoutAllSessions = async () => {
    if (!confirm('Are you sure you want to log out from all devices? This will end all your active sessions.')) {
      return;
    }

    try {
      setLoggingOutAll(true);
      await authHelpers.logoutAllSessions();
      
      setToast({
        type: 'success',
        message: 'Logged out from all devices successfully'
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
    } finally {
      setLoggingOutAll(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      setDeletingSession(sessionId);
      await authHelpers.deleteSession(sessionId);
      
      // Update sessions list
      setSessions(prev => prev.filter(session => session.$id !== sessionId));
      
      setToast({
        type: 'success',
        message: 'Session ended successfully'
      });
      
    } catch (error) {
      console.error('Error deleting session:', error);
      setToast({
        type: 'error',
        message: 'Failed to end session'
      });
    } finally {
      setDeletingSession(null);
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/user/profile')}
            className="mb-4 bg-gray-600 hover:bg-gray-700 text-white"
          >
            ← Back to Profile
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account security and active sessions
          </p>
        </div>

        <div className="space-y-6">
          {/* Two-Factor Authentication */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                  <p className="text-gray-600 mt-1">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    twoFactorEnabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                  <button
                    onClick={handleTwoFactorToggle}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      twoFactorEnabled
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* 2FA Setup Modal */}
          {showTwoFactorSetup && (
            <Card className="border-blue-200 bg-blue-50">
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Setup Two-Factor Authentication</h4>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-2">
                      For demo purposes, use the code: <span className="font-mono font-bold">123456</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      In a real implementation, you would scan a QR code with an authenticator app.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Code
                    </label>
                    <Input
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleTwoFactorSetup}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Verify & Enable
                    </Button>
                    <Button
                      onClick={() => {
                        setShowTwoFactorSetup(false);
                        setTwoFactorCode('');
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Change Password */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    required
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    required
                    minLength={8}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    required
                    className="w-full"
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={changingPassword}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {changingPassword ? 'Changing Password...' : 'Change Password'}
                </Button>
              </form>
            </div>
          </Card>

          {/* Active Sessions */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
                <Button
                  onClick={handleLogoutAllSessions}
                  disabled={loggingOutAll}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {loggingOutAll ? 'Logging Out...' : 'Logout All Sessions'}
                </Button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Manage your active sessions across different devices
              </p>
              
              {sessions.length === 0 ? (
                <div className="text-center py-8">
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
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">
                            {sessionInfo.device.includes('Mobile') ? '📱' :
                             sessionInfo.device.includes('Tablet') ? '📱' :
                             sessionInfo.device.includes('Windows') ? '💻' :
                             sessionInfo.device.includes('Mac') ? '💻' :
                             '💻'}
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900">
                                {sessionInfo.device}
                              </h4>
                              {sessionInfo.isCurrent && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  Current Session
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              Last active: {sessionInfo.lastActive}
                            </p>
                          </div>
                        </div>
                        
                        {!sessionInfo.isCurrent && (
                          <Button
                            onClick={() => handleDeleteSession(session.$id)}
                            disabled={deletingSession === session.$id}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            {deletingSession === session.$id ? 'Ending...' : 'End Session'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
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










