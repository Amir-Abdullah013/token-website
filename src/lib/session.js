import { supabase } from './supabase.js';
import { cookies } from 'next/headers';

// Cache for development mock user to prevent repeated calls
let mockUserCache = null;
let roleCache = new Map(); // Cache for user roles

// Server-side session management
export async function getServerSession() {
  try {
    // For development/testing purposes, return a cached mock user
    if (process.env.NODE_ENV === 'development') {
      if (!mockUserCache) {
        console.log('Development mode: using mock user');
        mockUserCache = {
          id: 'mock-user-id',
          name: 'Test User',
          email: 'test@example.com',
          user_metadata: { role: 'user' }
        };
      }
      return mockUserCache;
    }

    // Get user from Supabase
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    // For development/testing purposes, return a cached mock user if Supabase is not configured
    if (process.env.NODE_ENV === 'development') {
      if (!mockUserCache) {
        console.log('Supabase not configured, using mock user for development');
        mockUserCache = {
          id: 'mock-user-id',
          name: 'Test User',
          email: 'test@example.com',
          user_metadata: { role: 'user' }
        };
      }
      return mockUserCache;
    }
    
    // Session is invalid or expired
    return null;
  }
}

// Get user role from session
export async function getUserRole(user) {
  if (!user) return null;

  // Check cache first
  const cacheKey = user.id || 'mock-user';
  if (roleCache.has(cacheKey)) {
    return roleCache.get(cacheKey);
  }

  try {
    // In development mode, return cached role for mock user
    if (process.env.NODE_ENV === 'development' && user.id === 'mock-user-id') {
      const role = 'user';
      roleCache.set(cacheKey, role);
      return role;
    }

    // Skip API calls in development mode
    if (process.env.NODE_ENV === 'development') {
      const role = 'user';
      roleCache.set(cacheKey, role);
      return role;
    }

    // Check user metadata for role
    if (user.user_metadata && user.user_metadata.role) {
      roleCache.set(cacheKey, user.user_metadata.role);
      return user.user_metadata.role;
    }
    
    // Check app_metadata for role
    if (user.app_metadata && user.app_metadata.role) {
      roleCache.set(cacheKey, user.app_metadata.role);
      return user.app_metadata.role;
    }
    
    const role = 'user';
    roleCache.set(cacheKey, role);
    return role;
  } catch (error) {
    console.error('Error getting user role in session:', error);
    const role = 'user';
    roleCache.set(cacheKey, role);
    return role;
  }
}

// Check if user is authenticated
export async function isAuthenticated() {
  const user = await getServerSession();
  return !!user;
}

// Check if user is admin
export async function isAdmin() {
  const user = await getServerSession();
  if (!user) return false;
  
  const role = await getUserRole(user);
  return role === 'admin';
}

// Get redirect path based on user role
export async function getRedirectPath() {
  const user = await getServerSession();
  if (!user) return '/auth/signin';
  
  const role = await getUserRole(user);
  return role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
}

