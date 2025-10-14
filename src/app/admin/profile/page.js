'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../lib/admin-auth';
import { authHelpers } from '@/lib/supabase';;
import Layout from '../../../components/Layout';
import ProfileCard from '../../../components/ProfileCard';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Loader from '../../../components/Loader';

export default function AdminProfile() {
  const { adminUser, isLoading: authLoading, isAuthenticated, isAdmin } = useAdminAuth();
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!authLoading && !redirecting) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
        return;
      }
      
      // Only redirect to user profile if user is not admin and not already redirecting
      if (!isAdmin) {
        setRedirecting(true);
        router.push('/user/profile');
        return;
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, router, redirecting]);

  useEffect(() => {
    if (adminUser) {
      // Merge user data with preferences for phone number
      const userWithPhone = {
        ...adminUser,
        phone: adminUser.prefs?.phone || ''
      };
      setUserData(userWithPhone);
    }
  }, [adminUser]);

  const handlePasswordChange = async (currentPassword, newPassword) => {
    setProfileLoading(true);
    try {
      await authHelpers.changePassword(currentPassword, newPassword);
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    } finally {
      setProfileLoading(false);
    }
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

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <Layout showSidebar={true}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>
              <p className="text-gray-600 mt-2">Manage your administrator account</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => router.push('/admin/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Section */}
          <div className="lg:col-span-2">
            <ProfileCard
              user={userData}
              onUpdate={null} // Admin profile is view-only for now
              onPasswordChange={handlePasswordChange}
              isEditable={false} // Admin profile is view-only
              showPasswordChange={true}
            />
          </div>

          {/* Additional Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Administrator Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin ID
                    </label>
                    <p className="text-sm text-gray-900 font-mono break-all">
                      {userData?.$id || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role Level
                    </label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Administrator
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Created
                    </label>
                    <p className="text-sm text-gray-900">
                      {userData?.$createdAt ? new Date(userData.$createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email Verification</p>
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
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Admin Privileges</p>
                      <p className="text-xs text-gray-500">Full system access</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Active
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

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    fullWidth
                    onClick={() => router.push('/admin/dashboard')}
                  >
                    Admin Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    fullWidth
                    onClick={() => router.push('/admin/users')}
                  >
                    Manage Users
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    fullWidth
                    onClick={() => router.push('/admin/settings')}
                  >
                    System Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';












