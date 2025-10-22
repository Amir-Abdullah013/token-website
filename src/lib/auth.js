'use client';

import { useState, useEffect } from 'react';

// Authentication state management
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get initial session from localStorage
    const getInitialSession = async () => {
      try {
        // Check for existing user session in localStorage
        const userSession = localStorage.getItem('userSession');
        if (userSession) {
          try {
            const userData = JSON.parse(userSession);
            console.log('Found user session in localStorage:', userData);
            
            // Validate the session data
            if (userData.email && (userData.name || userData.email)) {
              setUser(userData);
              console.log('User authenticated from localStorage:', userData.email);
            } else {
              console.warn('Invalid user session data, clearing...');
              localStorage.removeItem('userSession');
            }
          } catch (error) {
            console.error('Error parsing user session:', error);
            localStorage.removeItem('userSession');
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();
  }, []);

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the OTP sign-in API
      const response = await fetch('/api/auth/signin-with-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.requiresOTP) {
          // OTP required - return this info to the UI
          return { 
            success: true, 
            requiresOTP: true, 
            message: data.message,
            otpId: data.otpId 
          };
        } else if (data.otpFallback) {
          // OTP service failed, but sign-in succeeded
          localStorage.setItem('userSession', JSON.stringify(data.user));
          setUser(data.user);
          return { success: true, user: data.user };
        }
      } else {
        throw new Error(data.error || 'Sign in failed');
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/verify-signin-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('userSession', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        throw new Error(data.error || 'OTP verification failed');
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, name) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, message: data.message };
      } else {
        throw new Error(data.error || 'Sign up failed');
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear localStorage
      localStorage.removeItem('userSession');
      localStorage.removeItem('oauthSession');
      
      setUser(null);
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Redirect to Google OAuth
      window.location.href = '/api/auth/oauth/google';
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGithub = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Redirect to GitHub OAuth
      window.location.href = '/api/auth/oauth/github';
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, message: data.message };
      } else {
        throw new Error(data.error || 'Password reset failed');
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    configValid: true,
    error,
    signIn,
    verifyOTP,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithGithub,
    forgotPassword
  };
};

// useAuth is already exported above
