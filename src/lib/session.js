import { supabase } from './supabase.js';
import { cookies } from 'next/headers';

// Cache for development mock user to prevent repeated calls
let mockUserCache = null;
let roleCache = new Map(); // Cache for user roles

// Server-side session management
export async function getServerSession() {
  try {
    // Check for actual user session first (OAuth or regular auth)
    const cookieStore = await cookies();
    const userSession = cookieStore.get('userSession');
    
    if (userSession) {
      try {
        const userData = JSON.parse(userSession.value);
        console.log('Found user session:', userData);
        return userData;
      } catch (error) {
        console.error('Error parsing user session:', error);
      }
    }
    
    // For development/testing purposes, return a cached mock user only if no real session
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

// Get user role from session - SIMPLIFIED VERSION
export async function getUserRole(user) {
  if (!user) return 'USER';

  // Check cache first
  const cacheKey = user.id || user.email || 'mock-user';
  if (roleCache.has(cacheKey)) {
    return roleCache.get(cacheKey);
  }

  try {
    // ALWAYS check database first - this is the source of truth
    const { databaseHelpers } = await import('./database.js');
    const dbUser = await databaseHelpers.user.getUserByEmail(user.email);
    
    if (dbUser && dbUser.role) {
      const role = dbUser.role.toUpperCase(); // Ensure uppercase
      roleCache.set(cacheKey, role);
      console.log(`✅ Database role found: ${user.email} -> ${role}`);
      return role;
    }
    
    // If no database user found, don't create one automatically
    // This prevents creating users for OAuth sessions that shouldn't exist
    if (!dbUser) {
      console.log(`⚠️ No database user found for ${user.email}, using default USER role`);
      roleCache.set(cacheKey, 'USER');
      return 'USER';
    }
    
    // Fallback to USER if everything fails
    roleCache.set(cacheKey, 'USER');
    return 'USER';
    
  } catch (error) {
    console.error('❌ Error getting user role:', error);
    // On error, default to USER role
    roleCache.set(cacheKey, 'USER');
    return 'USER';
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

