'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { authHelpers } from '../lib/supabase';

const AdminRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!mounted || loading) return;
      
      if (!isAuthenticated) {
        router.push('/auth/signin');
        return;
      }

      try {
        setCheckingRole(true);
        
        // Get user teams to check for admin role
        const teams = await authHelpers.getUserTeams();
        
        // Check if user has admin role in any team
        const hasAdminRole = teams.some(team => 
          team.roles && team.roles.includes('admin')
        );
        
        setIsAdmin(hasAdminRole);
        
        if (!hasAdminRole) {
          router.push('/user/dashboard');
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        router.push('/user/dashboard');
      } finally {
        setCheckingRole(false);
      }
    };

    if (user?.$id) {
      checkAdminRole();
    }
  }, [mounted, loading, isAuthenticated, user?.$id, router]);

  if (!mounted || loading || checkingRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have admin privileges to access this page.</p>
          <button
            onClick={() => router.push('/user/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;




