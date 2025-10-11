'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';
import MobileNavigation from './MobileNavigation';
import TikiStatusBar from './TikiStatusBar';
import { useAuth } from '../lib/auth-context';

const Layout = ({ children, showSidebar = false }) => {
  const { user, loading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  // Determine if we're on an admin page
  const isAdminPage = pathname.startsWith('/admin');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar user={user} onSignOut={handleSignOut} />
      
      {/* Tiki Status Bar - Shows current balances and price */}
      {user && <TikiStatusBar />}

      <div className="flex flex-1">
        {/* Sidebar (desktop fixed width, mobile toggled) */}
        {showSidebar && user && (
          <aside className="hidden lg:flex lg:w-64 flex-shrink-0 border-r bg-white lg:sticky lg:top-0 lg:h-screen">
            {isAdminPage ? (
              <AdminSidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
            ) : (
              <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
            )}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      {showSidebar && user && (
        <MobileNavigation user={user} />
      )}
    </div>
  );
};

export default Layout;
