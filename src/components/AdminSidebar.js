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
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊', description: 'Admin overview', category: 'overview' },
    { name: 'Users', href: '/admin/users', icon: '👥', description: 'Manage users', category: 'management' },
    { name: 'Deposits', href: '/admin/deposits', icon: '💰', description: 'Deposit requests', category: 'financial' },
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: '💸', description: 'Withdrawal requests', category: 'financial' },
    { name: 'Transfers', href: '/admin/transfers', icon: '📤', description: 'User transfers', category: 'financial' },
    { name: 'Stakings', href: '/admin/stakings', icon: '🏦', description: 'Staking management', category: 'financial' },
    { name: 'Transactions', href: '/admin/transactions', icon: '📋', description: 'All transactions', category: 'reports' },
  ];
  
  const isActive = (href) => pathname === href;
  
  if (!mounted) {
    return null;
  }
  
  return (
    <>
      {/* Premium Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/80 to-slate-900/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Premium Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-800/95 backdrop-blur-sm border-r border-slate-600/30 shadow-2xl shadow-slate-900/50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen
      `}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Premium Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-600/30 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-indigo-500/20">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⚙️</span>
              <h2 className="text-lg font-semibold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Admin Panel</h2>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Premium Admin info */}
          <div className="px-6 py-4 border-b border-slate-600/30">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center border border-cyan-400/30 shadow-lg shadow-cyan-500/25">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="ml-3">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-400/30">
                    Admin
                  </span>
                </div>
                <p className="text-xs text-slate-400">{user?.email || 'admin@example.com'}</p>
              </div>
            </div>
          </div>
          
          {/* Premium Navigation */}
          <nav className="flex-1 px-6 py-4 space-y-2 overflow-y-auto">
            {adminNavigation.map((item) => {
              const getCategoryColors = (category) => {
                switch (category) {
                  case 'overview':
                    return {
                      active: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-l-4 border-cyan-400',
                      inactive: 'text-slate-300 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-500/10 hover:text-cyan-200'
                    };
                  case 'management':
                    return {
                      active: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border-l-4 border-emerald-400',
                      inactive: 'text-slate-300 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-green-500/10 hover:text-emerald-200'
                    };
                  case 'financial':
                    return {
                      active: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-l-4 border-amber-400',
                      inactive: 'text-slate-300 hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10 hover:text-amber-200'
                    };
                  case 'reports':
                    return {
                      active: 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border-l-4 border-violet-400',
                      inactive: 'text-slate-300 hover:bg-gradient-to-r hover:from-violet-500/10 hover:to-purple-500/10 hover:text-violet-200'
                    };
                  default:
                    return {
                      active: 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-300 border-l-4 border-slate-400',
                      inactive: 'text-slate-300 hover:bg-gradient-to-r hover:from-slate-500/10 hover:to-gray-500/10 hover:text-slate-200'
                    };
                }
              };

              const colors = getCategoryColors(item.category);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 group
                    ${isActive(item.href) ? colors.active : colors.inactive}
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
                    <div className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
          
          {/* Premium Quick Switch */}
          <div className="px-6 py-4 border-t border-slate-600/30">
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Quick Switch</p>
              <div className="flex space-x-2">
                <Link
                  href="/user/dashboard"
                  className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-all duration-300 text-slate-300 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-200 border border-slate-600/30 hover:border-cyan-400/30"
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
                  className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-all duration-300 bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-400/30 hover:from-violet-500/30 hover:to-purple-500/30 hover:text-violet-200"
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






