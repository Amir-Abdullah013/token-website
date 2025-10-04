'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authHelpers } from './supabase';
import { config, validateConfig } from './config';
import { useLogout } from './useLogout';

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
    
    // Only run auth check on client side after component mounts
    const initializeAuth = () => {
      console.log('Initializing authentication...');
      
      // First, check for existing user session in localStorage
      const userSession = localStorage.getItem('userSession');
      if (userSession) {
        try {
          const userData = JSON.parse(userSession);
          console.log('Found user session in localStorage:', userData);
          
          // Validate the session data
          if (userData.email && userData.name) {
            setUser(userData);
            setConfigValid(true);
            setLoading(false);
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
            setUser(userData);
            setConfigValid(true);
            setLoading(false);
            return;
          }
          
          // If no user session found, check if we're on dashboard with OAuth params
          const urlParams = new URLSearchParams(window.location.search);
          const oauthSuccess = urlParams.get('oauth') === 'success';
          const userEmail = urlParams.get('userEmail');
          const userName = urlParams.get('userName');
          const userId = urlParams.get('userId');
          const userPicture = urlParams.get('userPicture');
          
          if (oauthSuccess && userEmail) {
            console.log('Found OAuth URL parameters, creating user session');
            const userData = {
              $id: userId || oauthData.session,
              id: userId || oauthData.session,
              email: userEmail,
              name: userName || 'OAuth User',
              picture: userPicture,
              provider: oauthData.provider,
              role: 'USER',
              emailVerified: true
            };
            
            // Store the user session
            localStorage.setItem('userSession', JSON.stringify(userData));
            setUser(userData);
            setConfigValid(true);
            setLoading(false);
            return;
          }
          
          // Fallback: create basic user object if no user session found
          setUser({
            $id: oauthData.session,
            name: 'OAuth User',
            email: 'oauth@example.com',
            role: 'user',
            provider: oauthData.provider
          });
          setConfigValid(true);
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error parsing OAuth session:', error);
          localStorage.removeItem('oauthSession');
        }
      }
      
      // If no session found, check for real authentication
      console.log('No session found, checking real authentication...');
      
      // Validate configuration first
      const validation = validateConfig();
      setConfigValid(validation.isValid);
      
      if (!validation.isValid) {
        console.error('Configuration validation failed:', validation.errors);
        setError('Configuration error: ' + validation.errors.join(', '));
        setLoading(false);
        return;
      }
      
      checkAuth();
    };

    // Use requestAnimationFrame to ensure DOM is ready
    if (typeof window !== 'undefined') {
      requestAnimationFrame(initializeAuth);
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
      // Check if user is in admin team
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
        // Store user session in localStorage
        localStorage.setItem('userSession', JSON.stringify(data.user));
        setUser(data.user);
        console.log('Sign in successful, user session stored:', data.user);
        return { success: true, user: data.user };
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
      
      // Clear all session data from localStorage
      localStorage.removeItem('userSession');
      localStorage.removeItem('oauthSession');
      
      // Clear user state
      setUser(null);
      
      // Call logout function if available
      if (logoutFn) {
        await logoutFn();
      }
      
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
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user'
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

