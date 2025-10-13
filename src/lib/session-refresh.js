/**
 * Session Refresh Utility
 * Handles session refresh and validation
 */

// Refresh session data
export const refreshSession = async () => {
  if (typeof window === 'undefined') return false;

  try {
    console.log('🔄 Refreshing session...');
    
    // Get current session data from localStorage
    const userSession = localStorage.getItem('userSession');
    const oauthSession = localStorage.getItem('oauthSession');
    
    if (!userSession && !oauthSession) {
      console.log('❌ No session data found for refresh');
      return false;
    }
    
    // Parse session data
    let sessionData = null;
    if (userSession) {
      sessionData = JSON.parse(userSession);
    } else if (oauthSession) {
      sessionData = JSON.parse(oauthSession);
    }
    
    if (!sessionData) {
      console.log('❌ Invalid session data');
      return false;
    }
    
    console.log('📊 Current session data:', {
      email: sessionData.email,
      id: sessionData.id,
      name: sessionData.name
    });
    
    // Update session cookies with fresh data
    const completeSessionData = {
      id: sessionData.id || sessionData.$id || 'mock-user-id',
      name: sessionData.name || 'User',
      email: sessionData.email || 'user@example.com',
      role: sessionData.role || 'USER',
      ...sessionData
    };
    
    // Set fresh cookies
    const cookieOptions = 'path=/; max-age=86400; SameSite=Lax; Secure';
    document.cookie = `userSession=${JSON.stringify(completeSessionData)}; ${cookieOptions}`;
    document.cookie = `session=${encodeURIComponent(JSON.stringify(completeSessionData))}; ${cookieOptions}`;
    
    console.log('✅ Session refreshed with fresh data');
    return true;
    
  } catch (error) {
    console.error('❌ Error refreshing session:', error);
    return false;
  }
};

// Validate and refresh session if needed
export const validateAndRefreshSession = async () => {
  if (typeof window === 'undefined') return false;

  try {
    console.log('🔍 Validating session...');
    
    // First, try to validate current session
    const sessionResponse = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('✅ Session is valid:', sessionData.user.email);
      return true;
    }
    
    console.log('⚠️ Session validation failed, attempting refresh...');
    
    // Try to refresh the session
    const refreshed = await refreshSession();
    if (!refreshed) {
      console.log('❌ Session refresh failed');
      return false;
    }
    
    // Validate the refreshed session
    const refreshResponse = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      console.log('✅ Session refresh successful:', refreshData.user.email);
      return true;
    } else {
      console.log('❌ Session refresh validation failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error validating and refreshing session:', error);
    return false;
  }
};

// Force session refresh
export const forceSessionRefresh = async () => {
  if (typeof window === 'undefined') return false;

  try {
    console.log('🔄 Force refreshing session...');
    
    // Clear existing cookies
    document.cookie = 'userSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'oauthSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Get fresh session data from localStorage
    const userSession = localStorage.getItem('userSession');
    const oauthSession = localStorage.getItem('oauthSession');
    
    if (!userSession && !oauthSession) {
      console.log('❌ No session data found for force refresh');
      return false;
    }
    
    // Parse and refresh session
    let sessionData = null;
    if (userSession) {
      sessionData = JSON.parse(userSession);
    } else if (oauthSession) {
      sessionData = JSON.parse(oauthSession);
    }
    
    if (!sessionData) {
      console.log('❌ Invalid session data for force refresh');
      return false;
    }
    
    // Create fresh session data
    const freshSessionData = {
      id: sessionData.id || sessionData.$id || 'mock-user-id',
      name: sessionData.name || 'User',
      email: sessionData.email || 'user@example.com',
      role: sessionData.role || 'USER',
      ...sessionData,
      refreshed: true,
      refreshedAt: new Date().toISOString()
    };
    
    // Set fresh cookies
    const cookieOptions = 'path=/; max-age=86400; SameSite=Lax; Secure';
    document.cookie = `userSession=${JSON.stringify(freshSessionData)}; ${cookieOptions}`;
    document.cookie = `session=${encodeURIComponent(JSON.stringify(freshSessionData))}; ${cookieOptions}`;
    
    console.log('✅ Force session refresh completed');
    return true;
    
  } catch (error) {
    console.error('❌ Error force refreshing session:', error);
    return false;
  }
};
