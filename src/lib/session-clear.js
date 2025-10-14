/**
 * Session Clearing Utility
 * Provides comprehensive session clearing for proper user switching
 */

// Clear all client-side session data
export const clearClientSession = () => {
  if (typeof window === 'undefined') return;

  try {
    // Clear localStorage completely
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('user') || 
        key.includes('session') || 
        key.includes('oauth') || 
        key.includes('auth') ||
        key.includes('supabase')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Also clear specific known keys
    localStorage.removeItem('userSession');
    localStorage.removeItem('oauthSession');
    localStorage.removeItem('session');
    localStorage.removeItem('user');
    localStorage.removeItem('auth');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear all session-related cookies
    const cookiesToClear = [
      'userSession',
      'oauthSession', 
      'session',
      'supabase.auth.token',
      'sb-access-token',
      'sb-refresh-token',
      'auth-token',
      'user-token'
    ];
    
    cookiesToClear.forEach(cookieName => {
      // Clear cookie for current domain
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      // Clear cookie for parent domain
      document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      // Clear cookie for subdomain
      const domain = window.location.hostname.split('.').slice(-2).join('.');
      if (domain !== window.location.hostname) {
        document.cookie = `${cookieName}=; path=/; domain=.${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      }
    });
    
    console.log('✅ Client session cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing client session:', error);
    return false;
  }
};

// Clear server-side session data via API
export const clearServerSession = async () => {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('✅ Server session cleared successfully');
      return true;
    } else {
      console.warn('⚠️ Server session clear failed, but continuing...');
      return false;
    }
  } catch (error) {
    console.error('❌ Error clearing server session:', error);
    return false;
  }
};

// Complete session clear (both client and server)
export const clearAllSessions = async (options = {}) => {
  console.log('🔄 Clearing all sessions...');
  const { redirect = true, redirectTo = '/auth/signin' } = options;
  
  // Clear client-side first
  const clientCleared = clearClientSession();
  
  // Clear server-side
  const serverCleared = await clearServerSession();
  
  // Optionally redirect
  if (redirect && typeof window !== 'undefined') {
    // Small delay to ensure cookies are cleared
    setTimeout(() => {
      window.location.href = redirectTo;
    }, 100);
  }
  
  return clientCleared && serverCleared;
};

// Clear session and redirect to sign in
export const logoutAndRedirect = async () => {
  await clearAllSessions();
};
