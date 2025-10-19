'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { NotificationBell } from './index';
import Image from "next/image";

const Navbar = ({ user, onSignOut }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const userMenuRef = useRef(null);
  const [userMenuPosition, setUserMenuPosition] = useState({ top: 0, right: 0 });
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate dropdown position when menu opens
  useEffect(() => {
    if (isUserMenuOpen && userMenuRef.current) {
      const rect = userMenuRef.current.getBoundingClientRect();
      setUserMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right - window.scrollX
      });
    }
  }, [isUserMenuOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);
  
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/#features' },
  ];
  
  // Mobile hamburger menu navigation for users
  const userMobileNavigation = [
    { name: 'User Dashboard', href: '/user/dashboard', icon: '📊' },
    { name: 'Referrals', href: '/user/referrals', icon: '👥' },
    { name: 'Staking', href: '/user/staking', icon: '🏦' },
    { name: 'Transactions', href: '/user/transactions', icon: '📋' },
    { name: 'Notifications', href: '/user/notifications', icon: '🔔' },
    { name: 'Profile', href: '/user/profile', icon: '👤' },
    { name: 'Settings', href: '/user/settings', icon: '⚙️' },
  ];
  
  // Mobile hamburger menu navigation for admins
  const adminMobileNavigation = [
    { name: 'Admin Dashboard', href: '/admin/dashboard', icon: '📊' },
    { name: 'Fees', href: '/admin/fees', icon: '💰' },
    { name: 'Fees Settings', href: '/admin/fees/settings', icon: '⚙️' },
    { name: 'Transactions', href: '/admin/transactions', icon: '📋' },
    { name: 'Manage Notifications', href: '/admin/notifications', icon: '🔔' },
    { name: 'Admin Profile', href: '/admin/profile', icon: '👤' },
  ];
  
  if (!mounted) {
    return (
      <nav className="bg-black/30 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <div className="flex items-center space-x-3">
                <Image
          src="/logo.png"   // ✅ Path from /public folder
          alt="Website Logo"
          width={40}         // adjust as needed
          height={40}
          className="rounded-md"
          priority           // ensures fast load
        />
                  <span className="text-2xl font-bold text-white">TokenApp</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }
  
  return (
    <nav className="bg-black/30 backdrop-blur-md border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="flex items-center space-x-3">
              <Image
          src="/logo.png"   // ✅ Path from /public folder
          alt="Website Logo"
          width={40}         // adjust as needed
          height={40}
          className="rounded-md"
          priority           // ensures fast load
        />
                <Image
          src="/logo-text.png"   // ✅ Path from /public folder
          alt="Website Logo"
          width={60}         // adjust as needed
          height={40}
          className="rounded-md"
          priority           // ensures fast load
        />
              </div>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/10"
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* User menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Notification Bell */}
                <NotificationBell />
                
                {/* User profile dropdown */}
                <div className="relative">
                  <button 
                    ref={userMenuRef}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:bg-white/10 p-2 transition-colors"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <svg className="ml-2 h-4 w-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown menu - Portal-based with maximum z-index */}
                  {isUserMenuOpen && mounted && createPortal(
                    <>
                      {/* Backdrop with maximum z-index */}
                      <div 
                        className="fixed inset-0 z-[999998]"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🔓 Backdrop clicked - closing menu');
                          setIsUserMenuOpen(false);
                        }}
                      />
                      
                      {/* Dropdown content with maximum z-index */}
                      <div 
                        className="fixed w-48 bg-black/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-700 z-[999999]"
                        style={{
                          top: userMenuPosition.top,
                          right: userMenuPosition.right
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🔓 Dropdown content clicked - preventing close');
                        }}
                      >
                        <div className="py-1">
                          <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                            <div className="font-medium text-white">{user.name}</div>
                            <div className="text-xs text-gray-400">{user.email}</div>
                          </div>
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🔓 Desktop sign out button clicked');
                              try {
                                await onSignOut();
                                console.log('✅ Desktop sign out completed');
                                setIsUserMenuOpen(false);
                              } catch (error) {
                                console.error('❌ Desktop sign out error:', error);
                              }
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>,
                    document.body
                  )}
                </div>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  href="/auth/signin"
                  className="text-white hover:text-blue-300 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-gray-600 hover:border-blue-400"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/90 backdrop-blur-md border-t border-gray-700">
            {user ? (
              <>
                <div className="px-3 py-2 text-sm text-gray-400">
                  <div className="font-medium text-white">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  {(() => {
                    // Admin detection with multiple checks
                    const isAdmin = user?.role === 'admin' || 
                                   user?.role === 'ADMIN' || 
                                   user?.isAdmin === true ||
                                   user?.role === 'Admin';
                    
                    return isAdmin ? adminMobileNavigation : userMobileNavigation;
                  })().map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-gray-300 hover:text-white px-3 py-2 rounded-lg text-base font-medium hover:bg-white/10 transition-colors flex items-center space-x-3"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
                <button
                  onClick={async () => {
                    console.log('🔓 Mobile sign out button clicked');
                    try {
                      await onSignOut();
                      console.log('✅ Mobile sign out completed');
                      setIsMenuOpen(false);
                    } catch (error) {
                      console.error('❌ Mobile sign out error:', error);
                    }
                  }}
                  className="text-gray-300 hover:text-white block w-full text-left px-3 py-2 rounded-lg text-base font-medium hover:bg-white/10 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <Link
                    href="/auth/signin"
                    className="text-white hover:text-blue-300 block px-3 py-2 rounded-lg text-base font-semibold border border-gray-600 hover:border-blue-400 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 block px-3 py-2 rounded-lg text-base font-medium mt-2 transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
