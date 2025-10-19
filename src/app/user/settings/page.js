'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { ToastContainer, useToast } from '@/components/Toast';

export default function SettingsPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { toasts, removeToast } = useToast();

  // Settings state
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Profile settings
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    timezone: ''
  });

  // Security settings
  const [securityData, setSecurityData] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
    loginAlerts: true
  });

  // Notification settings
  const [notificationData, setNotificationData] = useState({
    priceAlerts: true,
    tradeNotifications: true,
    depositNotifications: true,
    withdrawalNotifications: true,
    marketingEmails: false,
    securityAlerts: true
  });

  // Password change form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordErrors, setPasswordErrors] = useState({});

  // Initialize component
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      router.push('/auth/signin?redirect=/user/settings');
    }
  }, [mounted, loading, isAuthenticated, router]);

  // Load user data
  useEffect(() => {
    if (user?.id) {
      // Initialize with actual user data
      setProfileData({
        name: user.name || (user.email ? user.email.split('@')[0] : ''),
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
        timezone: user.timezone || 'UTC'
      });
      // Then try to load from database
      loadUserSettings();
    }
  }, [user?.id]);

  // Load user settings from database
  const loadUserSettings = async () => {
    try {
      const response = await fetch(`/api/user/settings?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setProfileData(data.settings.profile);
          setSecurityData(data.settings.security);
          setNotificationData(data.settings.notifications);
        }
      } else {
        // Fallback to user data from auth context
        console.log('API failed, using fallback data from auth context');
        setProfileData({
          name: user.name || (user.email ? user.email.split('@')[0] : ''),
          email: user.email || '',
          phone: user.phone || '',
          country: user.country || '',
          timezone: user.timezone || 'UTC'
        });
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      // Fallback to user data from auth context
      console.log('Error occurred, using fallback data from auth context');
      setProfileData({
        name: user.name || (user.email ? user.email.split('@')[0] : ''),
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
        timezone: user.timezone || 'UTC'
      });
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSaveStatus('');

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          settingsType: 'profile',
          data: profileData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSaveStatus('Profile updated successfully!');
        // Reload settings to get updated data
        await loadUserSettings();
      } else {
        setSaveStatus(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveStatus('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle security update
  const handleSecurityUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSaveStatus('');

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          settingsType: 'security',
          data: securityData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSaveStatus('Security settings updated successfully!');
        // Reload settings to get updated data
        await loadUserSettings();
      } else {
        setSaveStatus(result.error || 'Failed to update security settings');
      }
    } catch (error) {
      console.error('Error updating security settings:', error);
      setSaveStatus('Failed to update security settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle notification update
  const handleNotificationUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSaveStatus('');

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          settingsType: 'notifications',
          data: notificationData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSaveStatus('Notification settings updated successfully!');
        // Reload settings to get updated data
        await loadUserSettings();
      } else {
        setSaveStatus(result.error || 'Failed to update notification settings');
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setSaveStatus('Failed to update notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate password form
  const validatePasswordForm = () => {
    const errors = {};

    // Current password validation
    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    }

    // New password validation
    if (!passwordData.newPassword.trim()) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Check if new password is different from current
    if (passwordData.currentPassword && passwordData.newPassword && 
        passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setIsLoading(true);
    setSaveStatus('');

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSaveStatus('Password changed successfully!');
        // Clear the form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordErrors({});
      } else {
        setSaveStatus(result.error || 'Failed to change password');
        if (result.fieldErrors) {
          setPasswordErrors(result.fieldErrors);
        }
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setSaveStatus('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (!mounted || loading) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading settings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading state if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Redirecting to sign in...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm shadow-xl border-b border-slate-600/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Settings</h1>
                <p className="text-slate-300 mt-2">Manage your account preferences and security</p>
              </div>
               <Button 
                 variant="outline"
                 onClick={() => router.push('/user/dashboard')}
                 className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
               >
                 Back to Dashboard
               </Button>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm border-b border-slate-600/30">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Settings</h1>
                <p className="text-xs text-slate-300">Account preferences</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-cyan-200">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-500'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                  activeTab === 'security'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-500'
                }`}
              >
                Security
              </button>
              
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Information */}
              <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Full Name
                        </label>
                        <Input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          placeholder="Enter your full name"
                          className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Email Address
                        </label>
                        <Input
                          type="email"
                          value={profileData.email}
                          disabled
                          className="bg-gradient-to-r from-slate-700/30 to-slate-800/30 border border-slate-500/20 text-slate-400"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Email cannot be changed. Contact support if needed.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Phone Number
                        </label>
                        <Input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          placeholder="Enter your phone number"
                          className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        
                      </div>
                    </div>
                     <div className="flex justify-end">
                       <Button 
                         type="submit" 
                         loading={isLoading}
                         className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30"
                       >
                         Save Changes
                       </Button>
                     </div>
                  </form>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Account Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        User ID
                      </label>
                      <p className="text-sm text-white font-mono break-all">
                        {user?.$id || user?.id || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Account Type
                      </label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-cyan-500/40 to-blue-500/40 text-white border border-cyan-400/60">
                        {user?.role || 'user'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Password Change */}
              <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Current Password
                      </label>
                      <Input
                        type="password"
                        placeholder="Enter your current password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className={`bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 ${passwordErrors.currentPassword ? 'border-red-400 focus:ring-red-400/50 focus:border-red-400' : ''}`}
                        required
                      />
                      {passwordErrors.currentPassword && (
                        <p className="text-xs text-red-400 mt-1">{passwordErrors.currentPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        New Password
                      </label>
                      <Input
                        type="password"
                        placeholder="Enter your new password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className={`bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 ${passwordErrors.newPassword ? 'border-red-400 focus:ring-red-400/50 focus:border-red-400' : ''}`}
                        required
                        minLength={8}
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Password must be at least 8 characters long with uppercase, lowercase, and number
                      </p>
                      {passwordErrors.newPassword && (
                        <p className="text-xs text-red-400 mt-1">{passwordErrors.newPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Confirm New Password
                      </label>
                      <Input
                        type="password"
                        placeholder="Confirm your new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className={`bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 ${passwordErrors.confirmPassword ? 'border-red-400 focus:ring-red-400/50 focus:border-red-400' : ''}`}
                        required
                        minLength={8}
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="text-xs text-red-400 mt-1">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>
                     <div className="flex justify-end">
                       <Button 
                         type="submit" 
                         loading={isLoading}
                         className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30"
                       >
                         Change Password
                       </Button>
                     </div>
                  </form>
                </CardContent>
              </Card>

              
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Trading Notifications */}
             
            </div>
          )}

          {/* Save Status */}
          {saveStatus && (
            <div className={`p-4 rounded-lg backdrop-blur-sm shadow-lg ${
              saveStatus.includes('successfully') 
                ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 text-emerald-200' 
                : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-400/30 text-red-200'
            }`}>
              {saveStatus}
            </div>
          )}
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';

