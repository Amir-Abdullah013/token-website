'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from './ProtectedRoute';

const ClientOnlyRoute = ({ children, ...props }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute {...props}>
      {children}
    </ProtectedRoute>
  );
};

export default ClientOnlyRoute;










