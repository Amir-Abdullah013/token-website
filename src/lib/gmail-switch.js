/**
 * Gmail Account Switching Utility
 * Handles proper switching between different Gmail accounts
 */

import { clearAllSessions } from './session-clear';

// Force clear all sessions and redirect to Google OAuth
export const switchGmailAccount = async () => {
  try {
    console.log('🔄 Switching Gmail account...');
    
    // Clear all existing sessions without redirect
    await clearAllSessions({ redirect: false });
    
    // Clear any cached user data
    if (typeof window !== 'undefined') {
      // Clear all localStorage items that might contain user data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('user') || 
          key.includes('session') || 
          key.includes('oauth') || 
          key.includes('auth') ||
          key.includes('supabase') ||
          key.includes('google')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    }
    
    // Redirect to Google OAuth with fresh state
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const googleOAuthUrl = `${baseUrl}/api/auth/oauth/google?switch=true&t=${Date.now()}`;
    
    console.log('✅ Redirecting to Google OAuth for account switch');
    window.location.href = googleOAuthUrl;
    
    return true;
  } catch (error) {
    console.error('❌ Error switching Gmail account:', error);
    return false;
  }
};

// Clear session and force fresh authentication
export const forceFreshAuth = async () => {
  try {
    console.log('🔄 Forcing fresh authentication...');
    
    // Clear everything
    await clearAllSessions();
    
    // Clear browser cache if possible
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
    
    // Redirect to sign in page
    window.location.href = '/auth/signin?fresh=true';
    
    return true;
  } catch (error) {
    console.error('❌ Error forcing fresh auth:', error);
    return false;
  }
};
