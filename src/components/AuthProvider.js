'use client';

import { createContext, useContext } from 'react';
import { useAuth } from '../lib/auth-context';

const AuthContext = createContext();

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

export default function AuthProvider({ children }) {
  const auth = useAuth();

  // Add missing properties for compatibility
  const authWithExtras = {
    ...auth,
    configValid: true,
    error: null
  };

  return (
    <AuthContext.Provider value={authWithExtras}>
      {children}
    </AuthContext.Provider>
  );
}