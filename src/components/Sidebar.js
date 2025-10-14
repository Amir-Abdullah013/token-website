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
    { name: 'Dashboard', href: '/user/dashboard', icon: '📊', category: 'main' },
    { name: 'Trading', href: '/user/trade', icon: '📈', category: 'main' },
    { name: 'Deposit', href: '/user/deposit', icon: '💰', category: 'wallet' },
    { name: 'Withdraw', href: '/user/withdraw', icon: '💸', category: 'wallet' },
    { name: 'Send Tokens', href: '/user/send', icon: '📤', category: 'wallet' },
    { name: 'Staking', href: '/user/staking', icon: '🏦', category: 'earn' },
    { name: 'Transactions', href: '/user/transactions', icon: '📋', category: 'history' },
    { name: 'Profile', href: '/user/profile', icon: '👤', category: 'account' },
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
  
  // Group navigation by category
  const groupedNavigation = navigation.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  const categoryLabels = {
    main: 'Main',
    trading: 'Trading',
    wallet: 'Wallet',
    earn: 'Earn',
    history: 'History',
    account: 'Account'
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Binance-style Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900 backdrop-blur-md border-r border-gray-700/50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen
      `}>
        <div className="flex flex-col h-full overflow-y-auto">
         
          
          {/* User info with Binance style */}
          <div className="px-6 py-4 border-b border-gray-700/50">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    isAdminPage 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {isAdminPage ? 'Admin' : 'User'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
          </div>
          
          {/* Binance-style Navigation with Categories */}
          <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
            {Object.entries(groupedNavigation).map(([category, items]) => (
              <div key={category}>
                <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {categoryLabels[category] || category}
                </h3>
                <div className="space-y-1">
                  {items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                        isActive(item.href)
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                          : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                      }`}
                      onClick={() => {
                        // Close mobile sidebar when navigating
                        if (window.innerWidth < 1024) {
                          onClose();
                        }
                      }}
                    >
                      <span className="mr-3 text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                      <span className="flex-1">{item.name}</span>
                      {isActive(item.href) && (
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
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
