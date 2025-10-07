'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function useLogout() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const logout = async () => {
    try {
      setLoading(true);
      
      // Call the logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear any client-side auth state
        if (typeof window !== 'undefined') {
          // Clear localStorage/sessionStorage if needed
          localStorage.removeItem('user');
          sessionStorage.clear();
        }
        
        // Redirect to home page
        router.push('/');
        router.refresh(); // Refresh to clear any cached data
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to home
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading };
}

















