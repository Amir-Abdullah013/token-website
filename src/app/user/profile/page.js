'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { authHelpers } from '@/lib/supabase';;
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
  
  // Helper variables
  const isUser = user?.role === 'user';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
        return;
      }
      
      if (!isUser) {
        router.push('/admin/profile');
        return;
      }
    }
  }, [authLoading, isAuthenticated, isUser, router]);

  useEffect(() => {
    if (user) {
      // Merge user data with preferences for phone number
      const userWithPhone = {
        ...user,
        phone: user.prefs?.phone || ''
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
      await authHelpers.updateProfile(formData.name, formData.phone);
      
      // Refresh user data
      const updatedUser = await authHelpers.getCurrentUser();
      const userWithPhone = {
        ...updatedUser,
        phone: updatedUser.prefs?.phone || ''
      };
      setUserData(userWithPhone);
      
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
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

  if (authLoading || profileLoading) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !isUser) {
    return null;
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
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Login
                      </label>
                      <p className="text-sm text-gray-900">
                        {userData?.$updatedAt ? new Date(userData.$updatedAt).toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Verification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email Status</p>
                        <p className="text-xs text-gray-500">
                          {userData?.emailVerification ? 'Verified' : 'Not verified'}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        userData?.emailVerification ? 
                          'bg-green-100 text-green-800' : 
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                        {userData?.emailVerification ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        fullWidth
                        onClick={() => router.push('/auth/verify-email')}
                      >
                        Verify Email
                      </Button>
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
