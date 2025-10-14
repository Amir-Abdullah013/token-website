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
  
  // Helper variables
  const isUser = user?.role === 'user' || user?.role === 'USER';
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !redirecting) {
      if (!isAuthenticated || !user) {
        router.push('/auth/signin?redirect=/user/profile');
        return;
      }
      
      // Only redirect to admin profile if user is admin and not already redirecting
      if (isAdmin) {
        setRedirecting(true);
        router.push('/admin/profile');
        return;
      }
    }
  }, [mounted, authLoading, isAuthenticated, user, isAdmin, router, redirecting]);

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
        <div className="min-h-screen flex items-center justify-center">
          <Loader />
        </div>
      </Layout>
    );
  }

  // Show loading state if not authenticated
  if (!isAuthenticated || !user || !isUser) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to sign in...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading state if user data is not loaded
  if (!userData) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600 mt-2">Manage your account information and settings</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => router.push('/user/dashboard')}
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
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => handleTabChange('security')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        User ID
                      </label>
                      <p className="text-sm text-gray-900 font-mono break-all">
                        {userData?.$id || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Type
                      </label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
            <Card>
              <CardHeader>
                <CardTitle>Security Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">🔒</div>
                    <h3 className="font-semibold text-gray-900">Password</h3>
                    <p className="text-sm text-gray-600">Change your password</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">🔐</div>
                    <h3 className="font-semibold text-gray-900">Two-Factor Auth</h3>
                    <p className="text-sm text-gray-600">Add extra security</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">📱</div>
                    <h3 className="font-semibold text-gray-900">Active Sessions</h3>
                    <p className="text-sm text-gray-600">Manage your devices</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button
                    onClick={() => router.push('/user/security')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Manage Security Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';

