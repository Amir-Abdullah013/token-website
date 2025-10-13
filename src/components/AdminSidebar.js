'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const AdminSidebar = ({ user, isOpen, onClose }) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const adminNavigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊', description: 'Admin overview' },
    { name: 'Users', href: '/admin/users', icon: '👥', description: 'Manage users' },
    { name: 'Wallets', href: '/admin/wallets', icon: '💼', description: 'Wallet management' },
    { name: 'Deposits', href: '/admin/deposits', icon: '💰', description: 'Deposit requests' },
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: '💸', description: 'Withdrawal requests' },
    { name: 'Transfers', href: '/admin/transfers', icon: '📤', description: 'User transfers' },
    { name: 'Stakings', href: '/admin/stakings', icon: '🏦', description: 'Staking management' },
    { name: 'Transactions', href: '/admin/transactions', icon: '📋', description: 'All transactions' },
  ];
  
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
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-red-50">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⚙️</span>
              <h2 className="text-lg font-semibold text-red-900">Admin Panel</h2>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Admin info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="ml-3">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Admin
                  </span>
                </div>
                <p className="text-xs text-gray-500">{user?.email || 'admin@example.com'}</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-6 py-4 space-y-2 overflow-y-auto">
            {adminNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group
                  ${isActive(item.href)
                    ? 'bg-red-50 text-red-700 border-l-4 border-red-500'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                onClick={() => {
                  // Close mobile sidebar when navigating
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                title={item.description}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <div className="flex-1">
                  <div>{item.name}</div>
                  <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.description}
                  </div>
                </div>
              </Link>
            ))}
          </nav>
          
          {/* Quick Switch */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Quick Switch</p>
              <div className="flex space-x-2">
                <Link
                  href="/user/dashboard"
                  className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900"
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
                  className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-colors bg-red-50 text-red-700"
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
          
          
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;






