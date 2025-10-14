'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authHelpers } from './supabase';
import { config, validateConfig } from './config';
import { useLogout } from './useLogout';
import { autoSyncSession, ensureSessionSync } from './session-sync';
import { clearAllSessions } from './session-clear';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a default context instead of throwing an error
    // This prevents SSR issues and allows graceful fallbacks
    return {
      user: null,
      loading: true,
      error: null,
      configValid: false,
      signIn: async () => ({ success: false, error: 'Auth not available' }),
      signUp: async () => ({ success: false, error: 'Auth not available' }),
      signOut: async () => ({ success: false, error: 'Auth not available' }),
      forgotPassword: async () => ({ success: false, error: 'Auth not available' }),
      verifyEmail: async () => ({ success: false, error: 'Auth not available' }),
      signInWithGoogle: async () => ({ success: false, error: 'Auth not available' }),
      signInWithGithub: async () => ({ success: false, error: 'Auth not available' }),
      signInWithTwitter: async () => ({ success: false, error: 'Auth not available' }),
      isAuthenticated: false,
      isAdmin: false,
      isUser: false
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [configValid, setConfigValid] = useState(false);
  const { logout: logoutFn, loading: logoutLoading } = useLogout();

  useEffect(() => {
    setMounted(true);
    
    // Initialize session synchronization
    const cleanup = autoSyncSession();
    
    // Only run auth check on client side after component mounts
    const initializeAuth = () => {
      console.log('Initializing authentication...');
      
      // First, check for existing user session in localStorage
      const userSession = localStorage.getItem('userSession');
      if (userSession) {
        try {
          const userData = JSON.parse(userSession);
          console.log('Found user session in localStorage:', userData);
          
          // Validate the session data - be more lenient for OAuth users
          if (userData.email && (userData.name || userData.email)) {
            // Use the actual user data from session without hardcoded fallbacks
            const correctedUserData = {
              ...userData,
              name: userData.name || 'User',
              email: userData.email, // Use actual email from session
              id: userData.id || userData.$id || 'user-id',
              createdAt: userData.createdAt || new Date().toISOString()
            };
            
            setUser(correctedUserData);
            setConfigValid(true);
            setLoading(false);
            console.log('User authenticated from localStorage:', correctedUserData.email);
            
            // Sync session to server
            ensureSessionSync();
            return;
          } else {
            console.warn('Invalid user session data, clearing...');
            localStorage.removeItem('userSession');
            localStorage.removeItem('oauthSession');
          }
        } catch (error) {
          console.error('Error parsing user session:', error);
          localStorage.removeItem('userSession');
          localStorage.removeItem('oauthSession');
        }
      }

      // Check for OAuth session (but userSession should already be set by dashboard)
      const oauthSession = localStorage.getItem('oauthSession');
      if (oauthSession) {
        try {
          const oauthData = JSON.parse(oauthSession);
          console.log('Found OAuth session:', oauthData);
          
          // Check if we already have user session data (set by dashboard)
          const userSession = localStorage.getItem('userSession');
          if (userSession) {
            const userData = JSON.parse(userSession);
            console.log('Found OAuth user session:', userData);
            
            // Ensure we have the correct user data
          const correctedUserData = {
            ...userData,
            name: userData.name || (userData.email ? userData.email.split('@')[0] : 'User'),
            email: userData.email,
            id: userData.id || userData.$id || 'user-id',
            status: userData.status || 'active',
            createdAt: userData.createdAt || new Date().toISOString()
          };
            
            // Check if user account is deactivated
            if (correctedUserData.status === 'inactive') {
              console.warn('User account is deactivated, signing out');
              setUser(null);
              setError('Your account is currently on hold. Please contact support for assistance.');
              setLoading(false);
              return;
            }
            
            setUser(correctedUserData);
            setConfigValid(true);
            setLoading(false);
            console.log('User authenticated from OAuth session:', correctedUserData.email);
            
            // Sync session to server
            ensureSessionSync();
            return;
          }
          
          // OAuth session found but no user session - this shouldn't happen
          // as the oauth-success page should have set both
          console.warn('OAuth session found but no user session - clearing OAuth session');
          localStorage.removeItem('oauthSession');
        } catch (error) {
          console.error('Error parsing OAuth session:', error);
          localStorage.removeItem('oauthSession');
        }
      }
      
      // If no session found, mark unauthenticated
      console.log('No session found, setting as not authenticated');
      setUser(null);
      setConfigValid(true);
      setLoading(false);
    };

    // Use requestAnimationFrame to ensure DOM is ready
    if (typeof window !== 'undefined') {
      // Add small delay to ensure session data is properly loaded
      setTimeout(() => {
        requestAnimationFrame(initializeAuth);
      }, 50);
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      console.log('Checking authentication...');
      const currentUser = await authHelpers.getCurrentUser();
      if (currentUser) {
        // Get user role from teams or custom attributes
        const userRole = await getUserRole(currentUser);
        setUser({ ...currentUser, role: userRole });
        console.log('Auth check: User authenticated', { name: currentUser.name, email: currentUser.email, role: userRole });
      } else {
        setUser(null);
        console.log('Auth check: No user found');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // For development/testing purposes, set a mock user if Appwrite is not configured
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: using mock user for client-side');
        setUser({
          $id: 'mock-user-id',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user'
        });
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = async (user) => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return 'user';
    }
    
    try {
      // First check if user already has role in localStorage session
      const userSession = localStorage.getItem('userSession');
      if (userSession) {
        const userData = JSON.parse(userSession);
        if (userData.role) {
          return userData.role;
        }
      }
      
      // Check if user is in admin team (legacy support)
      const teams = await authHelpers.getUserTeams();
      
      // Ensure teams is an array
      if (Array.isArray(teams)) {
        const adminTeam = teams.find(team => team.name === 'admin');
        
        if (adminTeam) {
          return 'admin';
        }
      }
      
      // Check custom role attribute if stored in user preferences
      if (user.prefs && user.prefs.role) {
        return user.prefs.role;
      }
      
      return 'user';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'user';
    }
  };

  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      // Always use real authentication - no mock signin
      console.log('Attempting to sign in user:', email);
      
      // Call the API route for authentication
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle database connection errors gracefully
        if (response.status === 503) {
          throw new Error('Database is currently unavailable. Please try again later.');
        }
        throw new Error(data.error || 'Sign in failed');
      }

      if (data.success && data.user) {
        // Ensure role is properly set in user data
        const userWithRole = {
          ...data.user,
          role: data.user.role || 'user'
        };
        
        // Store user session in localStorage
        localStorage.setItem('userSession', JSON.stringify(userWithRole));
        setUser(userWithRole);
        console.log('Sign in successful, user session stored:', userWithRole);
        
        // Return success with redirect information
        return { 
          success: true, 
          user: userWithRole,
          redirectTo: userWithRole.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'
        };
      } else {
        throw new Error(data.error || 'Sign in failed');
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email, password, name) => {
    try {
      setError(null);
      setLoading(true);
      
      // Call the API route for user registration
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle database connection errors gracefully
        if (response.status === 503) {
          throw new Error('Database is currently unavailable. Please try again later.');
        }
        throw new Error(data.error || 'Sign up failed');
      }

      return { 
        success: true, 
        message: data.message || 'Account created successfully! Please check your email to verify your account.' 
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      
      // Use comprehensive session clearing
      await clearAllSessions();
      
      // Clear user state
      setUser(null);
      setConfigValid(false);
      
      console.log('User signed out successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const forgotPassword = async (email) => {
    try {
      setError(null);
      setLoading(true);
      
      await authHelpers.forgotPassword(email);
      
      return { 
        success: true, 
        message: 'Password reset email sent! Please check your inbox.' 
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (userId, secret) => {
    try {
      setError(null);
      setLoading(true);
      
      await authHelpers.verifyEmail(userId, secret);
      
      return { 
        success: true, 
        message: 'Email verified successfully! You can now sign in.' 
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error) => {
    if (error.message) {
      // Handle specific Appwrite errors
      if (error.message.includes('Invalid credentials')) {
        return 'Invalid email or password';
      }
      if (error.message.includes('User already exists')) {
        return 'An account with this email already exists';
      }
      if (error.message.includes('Invalid email')) {
        return 'Please enter a valid email address';
      }
      if (error.message.includes('Password must be at least 8 characters')) {
        return 'Password must be at least 8 characters long';
      }
      return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Development mode: initiating real Google OAuth');
      const result = await authHelpers.signInWithGoogle();
      
      if (result?.success && result?.user) {
        // Update user state with OAuth user data
        setUser(result.user);
        console.log('Google OAuth successful, user updated:', result.user);
        return { success: true, user: result.user };
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const signInWithGithub = async () => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Development mode: initiating real GitHub OAuth');
      const result = await authHelpers.signInWithGithub();
      
      if (result?.success && result?.user) {
        // Update user state with OAuth user data
        setUser(result.user);
        console.log('GitHub OAuth successful, user updated:', result.user);
        return { success: true, user: result.user };
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const signInWithTwitter = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // In development mode, use real Twitter OAuth instead of simulation
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: initiating real Twitter OAuth');
        // Use real Twitter OAuth flow
        await authHelpers.signInWithTwitter();
        return { success: true };
      }
      
      await authHelpers.signInWithTwitter();
      // The OAuth flow will redirect, so we don't need to handle the response here
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    loading: loading || !mounted || logoutLoading,
    error,
    configValid,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    verifyEmail,
    signInWithGoogle,
    signInWithGithub,
    signInWithTwitter,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'ADMIN',
    isUser: user?.role === 'user' || user?.role === 'USER'
  };

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

