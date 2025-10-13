'use client';

import { useState, useEffect } from 'react';
import { supabase, authHelpers } from './supabase.js';

// Authentication state management
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const user = await authHelpers.getCurrentUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting initial session:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authHelpers.signIn(email, password);
      return { success: true, data };
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
      const data = await authHelpers.signUp(email, password, name);
      return { success: true, data };
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
      await authHelpers.signOut();
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
      const data = await authHelpers.signInWithGoogle();
      return { success: true, data };
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
      const data = await authHelpers.signInWithGithub();
      return { success: true, data };
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
      await authHelpers.forgotPassword(email);
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (name, phone) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authHelpers.updateProfile(name, phone);
      return { success: true, data };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (newPassword) => {
    try {
      setLoading(true);
      setError(null);
      await authHelpers.changePassword(newPassword);
      return { success: true };
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
    signUp,
    signOut,
    signInWithGoogle,
    signInWithGithub,
    forgotPassword,
    updateProfile,
    changePassword
  };
};

// useAuth is already exported above
