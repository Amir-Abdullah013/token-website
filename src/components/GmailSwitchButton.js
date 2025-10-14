'use client';

import { useState } from 'react';
import { switchGmailAccount, forceFreshAuth } from '@/lib/gmail-switch';

export default function GmailSwitchButton({ className = '' }) {
  const [loading, setLoading] = useState(false);

  const handleSwitchAccount = async () => {
    try {
      setLoading(true);
      await switchGmailAccount();
    } catch (error) {
      console.error('Error switching account:', error);
      setLoading(false);
    }
  };

  const handleForceRefresh = async () => {
    try {
      setLoading(true);
      await forceFreshAuth();
    } catch (error) {
      console.error('Error forcing refresh:', error);
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        onClick={handleSwitchAccount}
        disabled={loading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Switching...' : 'Switch Gmail Account'}
      </button>
      
      <button
        onClick={handleForceRefresh}
        disabled={loading}
        className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Refreshing...' : 'Force Fresh Login'}
      </button>
    </div>
  );
}

