'use client';

import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const SafeLayout = ({ children, showSidebar = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={null} onSignOut={() => {}} />
      
      <div className="flex">
        {/* Sidebar - only show if showSidebar is true */}
        {showSidebar && (
          <Sidebar 
            user={null} 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
          />
        )}
        
        {/* Main content */}
        <main className={`
          flex-1 min-h-screen
          ${showSidebar ? 'lg:ml-64' : ''}
        `}>
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile sidebar toggle button - only show if sidebar should be shown */}
      {showSidebar && (
        <button
          onClick={toggleSidebar}
          className="lg:hidden fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-30"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SafeLayout;














