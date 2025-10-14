'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { authHelpers } from '../../../lib/supabase';
import Layout from '../../../components/Layout';
import ProfileCard from '../../../components/ProfileCard';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Loader from '../../../components/Loader';

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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        User ID
                      </label>
                      <p className="text-sm text-white font-mono break-all bg-slate-800/30 px-3 py-2 rounded-lg border border-slate-600/30">
                        {userData?.$id || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Account Type
                      </label>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-cyan-500/50 to-blue-500/50 text-white border border-cyan-400/70 shadow-lg">
                        {userData?.role || 'user'}
                      </span>
                    </div>
                    
                  
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">Security Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-gradient-to-r from-slate-700/60 to-slate-800/60 rounded-lg border border-slate-500/40 shadow-lg hover:shadow-xl transition-all duration-200">
                    <div className="text-3xl mb-3">🔒</div>
                    <h3 className="font-semibold text-white text-lg mb-2">Password</h3>
                    <p className="text-sm text-slate-200">Change your password</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-r from-slate-700/60 to-slate-800/60 rounded-lg border border-slate-500/40 shadow-lg hover:shadow-xl transition-all duration-200">
                    <div className="text-3xl mb-3">🔐</div>
                    <h3 className="font-semibold text-white text-lg mb-2">Two-Factor Auth</h3>
                    <p className="text-sm text-slate-200">Add extra security</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-r from-slate-700/60 to-slate-800/60 rounded-lg border border-slate-500/40 shadow-lg hover:shadow-xl transition-all duration-200">
                    <div className="text-3xl mb-3">📱</div>
                    <h3 className="font-semibold text-white text-lg mb-2">Active Sessions</h3>
                    <p className="text-sm text-slate-200">Manage your devices</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button
                    onClick={() => router.push('/user/security')}
                    className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30"
                  >
                    Manage Security Settings
                  </Button>
                </div>
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

