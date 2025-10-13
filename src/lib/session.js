import { supabase } from './supabase.js';
import { cookies } from 'next/headers.js';

// Cache for development mock user to prevent repeated calls
let mockUserCache = null;
let roleCache = new Map(); // Cache for user roles

// Server-side session management
export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    
    // Check for userSession cookie first
    const userSession = cookieStore.get('userSession');
    if (userSession) {
      try {
        const userData = JSON.parse(userSession.value);
        console.log('✅ Found user session in cookie:', userData.email);
        return userData;
      } catch (error) {
        console.error('❌ Error parsing user session cookie:', error);
      }
    }
    
    // Check for session cookie (alternative session storage)
    const sessionCookie = cookieStore.get('session');
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
        console.log('✅ Found session cookie:', sessionData.email);
        return sessionData;
      } catch (error) {
        console.error('❌ Error parsing session cookie:', error);
      }
    }
    
    // Check for OAuth session cookie
    const oauthSession = cookieStore.get('oauthSession');
    if (oauthSession) {
      try {
        const oauthData = JSON.parse(oauthSession.value);
        console.log('✅ Found OAuth session:', oauthData.email);
        return oauthData;
      } catch (error) {
        console.error('❌ Error parsing OAuth session:', error);
      }
    }
    
    // For development/testing purposes, return a cached mock user only if no real session
    if (process.env.NODE_ENV === 'development') {
      if (!mockUserCache) {
        console.log('🔧 Development mode: using mock user');
        mockUserCache = {
          id: '1f1fffe0-3e3b-40cb-a8e1-3be943a186fd', // Use real user ID for testing
          name: 'Amir Abdullah',
          email: 'amirabdullah2508@gmail.com',
          user_metadata: { role: 'admin' }
        };
      }
      console.log('✅ Development mock user returned:', mockUserCache.email);
      return mockUserCache;
    }

    // Try to get user from Supabase as last resort
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('❌ No Supabase user found');
        return null;
      }
      
      console.log('✅ Found Supabase user:', user.email);
      return user;
    } catch (supabaseError) {
      console.log('❌ Supabase auth error:', supabaseError.message);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Session management error:', error);
    
    // For development/testing purposes, return a cached mock user if everything fails
    if (process.env.NODE_ENV === 'development') {
      if (!mockUserCache) {
        console.log('🔧 Fallback: using mock user for development');
        mockUserCache = {
          id: '1f1fffe0-3e3b-40cb-a8e1-3be943a186fd', // Use real user ID for testing
          name: 'Amir Abdullah',
          email: 'amirabdullah2508@gmail.com',
          user_metadata: { role: 'admin' }
        };
      }
      return mockUserCache;
    }
    
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

