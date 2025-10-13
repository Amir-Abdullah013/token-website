/**
 * Session Synchronization Utility
 * Ensures client-side session data is available to server-side API routes
 */

// Client-side session synchronization
export const syncSessionToServer = async () => {
  if (typeof window === 'undefined') return false;

  try {
    // Get session data from localStorage
    const userSession = localStorage.getItem('userSession');
    const oauthSession = localStorage.getItem('oauthSession');
    
    let sessionData = null;
    
    if (userSession) {
      sessionData = JSON.parse(userSession);
      console.log('🔄 Syncing user session to server:', sessionData.email);
    } else if (oauthSession) {
      sessionData = JSON.parse(oauthSession);
      console.log('🔄 Syncing OAuth session to server:', sessionData.email);
    }
    
    if (sessionData) {
      // Ensure we have all required fields
      const completeSessionData = {
        id: sessionData.id || sessionData.$id || 'mock-user-id',
        name: sessionData.name || 'User',
        email: sessionData.email || 'user@example.com',
        role: sessionData.role || 'USER',
        ...sessionData
      };
      
      // Set multiple cookie formats for maximum compatibility
      const cookieOptions = 'path=/; max-age=86400; SameSite=Lax; Secure';
      
      // Primary session cookie
      document.cookie = `userSession=${JSON.stringify(completeSessionData)}; ${cookieOptions}`;
      
      // Alternative session cookie
      document.cookie = `session=${encodeURIComponent(JSON.stringify(completeSessionData))}; ${cookieOptions}`;
      
      // OAuth session cookie if applicable
      if (oauthSession) {
        document.cookie = `oauthSession=${JSON.stringify(completeSessionData)}; ${cookieOptions}`;
      }
      
      console.log('✅ Session synced to server successfully');
      return true;
    }
    
    console.log('⚠️ No session data found in localStorage');
    return false;
  } catch (error) {
    console.error('❌ Error syncing session to server:', error);
    return false;
  }
};

// Check if session is valid and sync if needed
export const ensureSessionSync = async () => {
  if (typeof window === 'undefined') return false;

  try {
    // Check if we have session data in localStorage
    const userSession = localStorage.getItem('userSession');
    const oauthSession = localStorage.getItem('oauthSession');
    
    if (!userSession && !oauthSession) {
      console.log('❌ No session data found in localStorage');
      return false;
    }
    
    console.log('🔄 Found session data, syncing to server...');
    
    // Sync session to server
    const synced = await syncSessionToServer();
    
    if (synced) {
      console.log('✅ Session synced to server successfully');
      
      // Verify the session is working by making a test request
      try {
        const testResponse = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('✅ Session verification successful:', testData.user.email);
          return true;
        } else {
          console.warn('⚠️ Session verification failed:', testResponse.status);
          return false;
        }
      } catch (testError) {
        console.warn('⚠️ Session verification error:', testError.message);
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error ensuring session sync:', error);
    return false;
  }
};

// Clear server-side session cookies
export const clearServerSession = () => {
  if (typeof window === 'undefined') return;

  try {
    // Clear all session-related cookies
    document.cookie = 'userSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'oauthSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    console.log('✅ Server session cookies cleared');
  } catch (error) {
    console.error('❌ Error clearing server session:', error);
  }
};

// Auto-sync session on page load
export const autoSyncSession = () => {
  if (typeof window === 'undefined') return;

  // Sync session immediately
  ensureSessionSync();
  
  // Also sync on storage changes (when login completes)
  const handleStorageChange = (e) => {
    if (e.key === 'userSession' || e.key === 'oauthSession') {
      console.log('🔄 Storage change detected, syncing session...');
      setTimeout(ensureSessionSync, 100); // Small delay to ensure data is written
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};
