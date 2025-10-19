'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/admin-auth';
import Layout from './Layout';

const AdminRoute = ({ children }) => {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      // If admin is not authenticated, redirect to admin login
      if (!isAuthenticated) {
        router.push('/admin');
        return;
      }

      // If admin is authenticated, allow access
      if (isAuthenticated && adminUser) {
        setIsChecking(false);
        return;
      }

      // Default case - still checking
      setIsChecking(true);
    }
  }, [mounted, isLoading, isAuthenticated, adminUser, router]);

  // Show loading while checking authentication
  if (!mounted || isLoading || isChecking) {
    return (
      <Layout showSidebar={false}>
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying admin access...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // If we reach here, user is authenticated and is admin
  return <>{children}</>;
};

export default AdminRoute;