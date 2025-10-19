'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/admin-auth';
import { useAuth } from '@/lib/auth-context';
import Layout from '@/components/Layout';
import ProfileCard from '@/components/ProfileCard';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import Loader from '@/components/Loader';

export default function AdminProfile() {
  const { adminUser, isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [redirectTimeout, setRedirectTimeout] = useState(null);

  const isAdminRole = !!(adminUser && typeof adminUser.role === 'string' && ['admin', 'administrator'].includes(adminUser.role.toLowerCase()));

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      }
    }
  }, [authLoading, isAuthenticated, router]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [redirectTimeout]);

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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <Loader />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
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

  // Wait until we can reliably determine admin state
  if (isAuthenticated && !isAdminRole && !adminUser) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <Loader />
        </div>
      </Layout>
    );
  }

  // Non-admins viewing admin profile: show access message instead of implying redirect
  if (isAuthenticated && !isAdminRole) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm rounded-lg p-6 border border-slate-600/30 shadow-xl">
            <h2 className="text-xl font-semibold mb-2 bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">Access restricted</h2>
            <p className="text-slate-300 mb-4">This page is only available to administrators.</p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/user/profile')}
              className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
            >
              Go to your profile
            </Button>
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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Admin Profile</h1>
                <p className="text-slate-300 mt-2">Manage your administrator account</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => router.push('/admin/dashboard')}
                className="bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30"
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
            <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Administrator Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Admin ID
                    </label>
                    <p className="text-sm text-white font-mono break-all bg-slate-800/30 px-3 py-2 rounded-lg border border-slate-600/30">
                      {userData?.$id || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Role Level
                    </label>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-red-500/50 to-rose-500/50 text-white border border-red-400/70 shadow-lg">
                      Administrator
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Last Login
                    </label>
                    <p className="text-sm text-white bg-slate-800/30 px-3 py-2 rounded-lg border border-slate-600/30">
                      {userData?.$updatedAt ? new Date(userData.$updatedAt).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Account Created
                    </label>
                    <p className="text-sm text-white bg-slate-800/30 px-3 py-2 rounded-lg border border-slate-600/30">
                      {userData?.$createdAt ? new Date(userData.$createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>


            <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    fullWidth
                    onClick={() => router.push('/admin/dashboard')}
                    className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 hover:text-cyan-200 border border-cyan-400/30"
                  >
                    Admin Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    fullWidth
                    onClick={() => router.push('/admin/users')}
                    className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 hover:from-emerald-500/30 hover:to-green-500/30 hover:text-emerald-200 border border-emerald-400/30"
                  >
                    Manage Users
                  </Button>
                  
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';












