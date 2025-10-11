'use client';

import { useState, useEffect } from 'react';

export const useAdminAuth = () => {
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        // Check for admin token in cookies
        const adminToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('admin-token='))
          ?.split('=')[1];

        // Check for session cookie
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('session='))
          ?.split('=')[1];

        console.log('🔍 Checking admin auth:', {
          adminToken: !!adminToken,
          sessionCookie: !!sessionCookie,
          cookies: document.cookie
        });

        // First, try to get user from localStorage (set by successful login)
        const userSession = localStorage.getItem('userSession');
        if (userSession) {
          try {
            const user = JSON.parse(userSession);
            console.log('👤 Found user session:', user);
            if (user.role === 'admin' || user.role === 'ADMIN') {
              setAdminUser(user);
              setIsAuthenticated(true);
              console.log('✅ Admin authenticated via localStorage');
              return;
            }
          } catch (e) {
            console.log('❌ Failed to parse localStorage session:', e);
          }
        }

        // If no localStorage session, try session cookie
        if (sessionCookie) {
          try {
            const session = JSON.parse(decodeURIComponent(sessionCookie));
            if (session.role === 'admin' || session.role === 'ADMIN') {
              setAdminUser(session);
              setIsAuthenticated(true);
              console.log('✅ Admin authenticated via session cookie');
              return;
            }
          } catch (e) {
            console.log('❌ Failed to parse session cookie:', e);
          }
        }

        // If we have an admin token but no session data, we need to fetch user data
        if (adminToken) {
          console.log('🔑 Admin token found, but no session data. Need to fetch user info.');
          // For now, we'll assume the user is admin if they have the token
          // In a real app, you'd verify the JWT token
          setAdminUser({ role: 'ADMIN' });
          setIsAuthenticated(true);
          console.log('✅ Admin authenticated via token');
          return;
        }

        console.log('❌ No admin authentication found');
      } catch (error) {
        console.error('Error checking admin auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
    
    // Also check when the component mounts (in case session was set by login)
    const handleStorageChange = () => {
      checkAdminAuth();
    };
    
    // Listen for storage changes (when login sets localStorage)
    window.addEventListener('storage', handleStorageChange);
    
    // Also check after a short delay to catch login completion
    const timeoutId = setTimeout(checkAdminAuth, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearTimeout(timeoutId);
    };
  }, []);

  const adminSignIn = async (email, password) => {
    try {
      setIsLoading(true);
      
      console.log('🔐 Attempting admin login for:', email);
      
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      console.log('📡 Admin login response:', {
        status: response.status,
        success: data.success,
        error: data.error
      });

      if (response.ok && data.success) {
        // Set admin user state
        setAdminUser(data.user);
        setIsAuthenticated(true);
        
        // Also set in localStorage for compatibility
        if (data.session) {
          localStorage.setItem('userSession', JSON.stringify(data.session));
        }
        
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ Admin login error:', error);
      return { success: false, error: 'Login failed: ' + error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const adminSignOut = async () => {
    try {
      // Clear admin session
      setAdminUser(null);
      setIsAuthenticated(false);
      
      // Clear cookies and localStorage
      document.cookie = 'admin-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      localStorage.removeItem('userSession');
      
      console.log('✅ Admin signed out successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Admin sign out error:', error);
      return { success: false, error: 'Sign out failed' };
    }
  };

  const refreshAuth = () => {
    console.log('🔄 Manually refreshing admin auth...');
    setIsLoading(true);
    setIsAuthenticated(false);
    setAdminUser(null);
    
    // Re-check authentication
    setTimeout(() => {
      const checkAdminAuth = () => {
        try {
          const userSession = localStorage.getItem('userSession');
          if (userSession) {
            const user = JSON.parse(userSession);
            if (user.role === 'admin' || user.role === 'ADMIN') {
              setAdminUser(user);
              setIsAuthenticated(true);
              console.log('✅ Admin auth refreshed successfully');
            }
          }
        } catch (error) {
          console.error('Error refreshing admin auth:', error);
        } finally {
          setIsLoading(false);
        }
      };
      checkAdminAuth();
    }, 100);
  };

  return {
    adminUser,
    isLoading,
    isAuthenticated,
    adminSignIn,
    adminSignOut,
    refreshAuth
  };
};
