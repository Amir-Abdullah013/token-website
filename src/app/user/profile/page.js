'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { authHelpers } from '../../../lib/supabase';
import Layout from '../../../components/Layout';
import ProfileCard from '../../../components/ProfileCard';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import Loader from '../../../components/Loader';

// Password Change Form Component
const PasswordChangeForm = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Here you would implement the actual password change logic
      // For now, we'll just simulate a success
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-400/30 rounded-lg">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 rounded-lg">
          <p className="text-sm text-emerald-300">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="currentPassword" className="text-sm font-semibold text-slate-200 mb-3 flex items-center">
            <span className="mr-2">🔒</span>
            Current Password
          </label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            required
            placeholder="Enter your current password"
            className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="text-sm font-semibold text-slate-200 mb-3 flex items-center">
            <span className="mr-2">🔑</span>
            New Password
          </label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            required
            placeholder="Enter your new password"
            minLength={8}
            className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
          />
          <p className="text-xs text-slate-400 mt-2">
            Password must be at least 8 characters long
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-200 mb-3 flex items-center">
            <span className="mr-2">🔐</span>
            Confirm New Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            required
            placeholder="Confirm your new password"
            minLength={8}
            className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
          />
        </div>

        <div className="flex space-x-3">
          <Button 
            type="submit" 
            variant="primary"
            loading={loading}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30"
          >
            Update Password
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => {
              setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              });
              setError(null);
              setSuccess(null);
            }}
            disabled={loading}
            className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border border-slate-400/30"
          >
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
};

export default function UserProfile() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profileLoading, setProfileLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [mounted, setMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [redirectTimeout, setRedirectTimeout] = useState(null);
  
  // Helper variables
  const isUser = user?.role === 'user' || user?.role === 'USER';
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading) {
      if (!isAuthenticated || !user) {
        router.push('/auth/signin?redirect=/user/profile');
      }
    }
  }, [mounted, authLoading, isAuthenticated, user, router]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [redirectTimeout]);

  useEffect(() => {
    if (user) {
      // Merge user data with preferences for phone number
      const userWithPhone = {
        ...user,
        phone: user.phone || user.prefs?.phone || '',
        emailVerification: user.emailVerification || user.email_verified || false,
        $id: user.$id || user.id,
        $createdAt: user.$createdAt || user.created_at,
        $updatedAt: user.$updatedAt || user.updated_at
      };
      setUserData(userWithPhone);
    } else {
      // Clear user data if no user
      setUserData(null);
    }
  }, [user]);

  useEffect(() => {
    // Check for tab parameter in URL
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'security'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleProfileUpdate = async (formData) => {
    setProfileLoading(true);
    try {
      // Update profile using the improved function
      const updatedUser = await authHelpers.updateProfile(formData.name, formData.phone);
      
      if (updatedUser) {
        // Update local user data
        const userWithPhone = {
          ...updatedUser,
          phone: updatedUser.phone || updatedUser.prefs?.phone || '',
          emailVerification: updatedUser.emailVerification || updatedUser.email_verified || false,
          $id: updatedUser.$id || updatedUser.id,
          $createdAt: updatedUser.$createdAt || updatedUser.created_at,
          $updatedAt: updatedUser.$updatedAt || updatedUser.updated_at
        };
        setUserData(userWithPhone);
      }
      
    } catch (error) {
      console.error('Profile update error:', error);
      throw new Error(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const url = new URL(window.location);
    url.searchParams.set('tab', tab);
    router.push(url.pathname + url.search);
  };

  // Show loading state while checking authentication
  if (!mounted || authLoading || profileLoading) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <Loader />
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

  // Show loading state if user data is not loaded (but only if we have a user)
  if (user && !userData) {
    // Fallback: set userData if it's not set but we have a user
    if (user && !userData) {
      const userWithPhone = {
        ...user,
        phone: user.phone || user.prefs?.phone || '',
        emailVerification: user.emailVerification || user.email_verified || false,
        $id: user.$id || user.id,
        $createdAt: user.$createdAt || user.created_at,
        $updatedAt: user.$updatedAt || user.updated_at
      };
      setUserData(userWithPhone);
    }
    
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Profile</h1>
                <p className="text-slate-300 mt-2">Manage your account information and settings</p>
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

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => handleTabChange('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-500'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => handleTabChange('security')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'security'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-500'
              }`}
            >
              Security Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Profile Section */}
            <div className="lg:col-span-2">
              <ProfileCard
                user={userData}
                onUpdate={handleProfileUpdate}
                isEditable={true}
                showPasswordChange={false}
              />
            </div>

            {/* Additional Information */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Account Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-semibold text-slate-100 mb-3 flex items-center">
                        <span className="mr-2">🆔</span>
                        User ID
                      </label>
                      <div className="bg-slate-800/40 px-4 py-3 rounded-lg border border-slate-600/40 shadow-lg">
                        <p className="text-sm text-white font-mono break-all">
                          {userData?.$id || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold text-slate-100 mb-3 flex items-center">
                        <span className="mr-2">👤</span>
                        Account Type
                      </label>
                      <div className="bg-slate-800/40 px-4 py-3 rounded-lg border border-slate-600/40 shadow-lg">
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-cyan-500/60 to-blue-500/60 text-white border border-cyan-400/70 shadow-lg shadow-cyan-500/25">
                          <span className="mr-2">🔑</span>
                          {userData?.role || 'user'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-100 mb-3 flex items-center">
                        <span className="mr-2">📧</span>
                        Email Status
                      </label>
                      <div className="bg-slate-800/40 px-4 py-3 rounded-lg border border-slate-600/40 shadow-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-200">
                            {userData?.email || 'N/A'}
                          </span>
                          
                        </div>
                      </div>
                    </div>

                    <div>
                      
                      
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            

            {/* Password Change Section */}
            <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <PasswordChangeForm />
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';

