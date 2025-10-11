'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = ({ user, isOpen, onClose }) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Determine if we're on an admin page
  const isAdminPage = pathname.startsWith('/admin');
  
  const userNavigation = [
    { name: 'Dashboard', href: '/user/dashboard', icon: '📊' },
    { name: 'Deposit', href: '/user/deposit', icon: '💰' },
    { name: 'Withdraw', href: '/user/withdraw', icon: '💸' },
    { name: 'Send Tokens', href: '/user/send', icon: '📤' },
    { name: 'Staking', href: '/user/staking', icon: '🏦' },
    { name: 'Buy/Sell', href: '/user/trade', icon: '🔄' },
    { name: 'Transactions', href: '/user/transactions', icon: '📋' },
    { name: 'Profile', href: '/user/profile', icon: '👤' },
  ];
  
  const adminNavigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { name: 'Users', href: '/admin/users', icon: '👥' },
    { name: 'Wallets', href: '/admin/wallets', icon: '💼' },
    { name: 'Deposits', href: '/admin/deposits', icon: '💰' },
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: '💸' },
    { name: 'Transfers', href: '/admin/transfers', icon: '📤' },
    { name: 'Stakings', href: '/admin/stakings', icon: '🏦' },
    { name: 'Transactions', href: '/admin/transactions', icon: '📋' },
  ];
  
  // Use admin navigation if we're on admin pages, otherwise use user navigation
  const navigation = isAdminPage ? adminNavigation : userNavigation;
  
  const isActive = (href) => pathname === href;
  
  if (!mounted) {
    return null;
  }
  
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen
      `}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isAdminPage ? 'Admin Panel' : 'User Dashboard'}
            </h2>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="ml-3">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    isAdminPage 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isAdminPage ? 'Admin' : 'User'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-6 py-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive(item.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                onClick={() => {
                  // Close mobile sidebar when navigating
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
          
          {/* Admin Quick Switch */}
          {user?.role === 'admin' && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Quick Switch</p>
                <div className="flex space-x-2">
                  <Link
                    href="/user/dashboard"
                    className={`flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      !isAdminPage
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                  >
                    <span className="mr-2">👤</span>
                    User View
                  </Link>
                  <Link
                    href="/admin/dashboard"
                    className={`flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      isAdminPage
                        ? 'bg-red-50 text-red-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                  >
                    <span className="mr-2">⚙️</span>
                    Admin View
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {/* Footer */}
          
        </div>
      </div>
    </>
  );
};

export default Sidebar;
