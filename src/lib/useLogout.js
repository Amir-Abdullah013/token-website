'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearAllSessions } from './session-clear';

export function useLogout() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const logout = async () => {
    try {
      setLoading(true);
      
      // Use comprehensive session clearing
      await clearAllSessions();
      
      console.log('✅ Logout completed successfully');
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





























