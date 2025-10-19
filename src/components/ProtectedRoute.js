'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Loader from './Loader';

const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  requireAdmin = false,
  redirectTo = '/auth/signin' 
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Helper variables
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  const isUser = user?.role === 'user' || user?.role === 'USER';
  const configValid = true; // Assume config is always valid for now

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading || !configValid) return;

    // Check if authentication is required
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Check if admin access is required
    if (requireAdmin && !isAdmin) {
      router.push('/user/dashboard');
      return;
    }

    // Redirect authenticated users away from auth pages
    if (!requireAuth && isAuthenticated) {
      const redirectPath = isAdmin ? '/admin/dashboard' : '/user/dashboard';
      router.push(redirectPath);
      return;
    }
  }, [mounted, user, loading, isAuthenticated, isAdmin, requireAuth, requireAdmin, redirectTo, router, configValid]);

  // Don't render until mounted to prevent SSR issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  // Show loading while checking authentication or configuration
  if (loading || !configValid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text={!configValid ? "Configuring..." : "Loading..."} />
      </div>
    );
  }

  // Don't render children if redirecting
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  if (!requireAuth && isAuthenticated) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
