'use client';

import { useState, useEffect } from 'react';
import { useToast } from './Toast';

export default function UserIdDisplay({ userId, showFull = false, className = '' }) {
  const [copied, setCopied] = useState(false);
  const [correctVonId, setCorrectVonId] = useState(userId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { success } = useToast();

  // Fetch the correct Von ID from the API
  useEffect(() => {
    const fetchCorrectVonId = async () => {
      try {
        console.log('🔍 UserIdDisplay: Fetching correct Von ID...');
        console.log('🔍 UserIdDisplay: Current userId prop:', userId);
        
        const response = await fetch('/api/user-Von-id', {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 UserIdDisplay: API response:', data);
          
          if (data.success && data.VonId) {
            console.log('✅ UserIdDisplay: Updating from', correctVonId, 'to', data.VonId);
            setCorrectVonId(data.VonId);
          } else {
            console.warn('⚠️ UserIdDisplay: API returned success:false, using fallback userId');
            // Keep using the original userId if API returns success:false
          }
        } else {
          console.warn('⚠️ UserIdDisplay: API response not ok:', response.status, '- using fallback userId');
          // Keep using the original userId if API fails
        }
      } catch (error) {
        console.warn('⚠️ UserIdDisplay: Error fetching correct Von ID:', error.message, '- using fallback userId');
        // Keep using the original userId if API fails
      }
    };

    // Only fetch if we have a userId to work with
    if (userId) {
      fetchCorrectVonId();
    }
  }, [userId]); // Add userId as dependency

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 UserIdDisplay: Force refreshing Von ID...');
      
      const response = await fetch('/api/user-Von-id', {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.VonId) {
          console.log('✅ UserIdDisplay: Refreshed Von ID:', data.VonId);
          setCorrectVonId(data.VonId);
          success('Von ID refreshed successfully!');
        }
      }
    } catch (error) {
      console.error('❌ UserIdDisplay: Error refreshing Von ID:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(correctVonId);
      setCopied(true);
      success('User ID copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy user ID:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = correctVonId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      success('User ID copied to clipboard!');
    }
  };

  if (!userId) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="text-slate-400 text-sm">Loading user ID...</div>
      </div>
    );
  }

  const displayId = showFull ? correctVonId : correctVonId?.substring(0, 8) + '...';

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 ${className}`}>
      <div className="flex-1 w-full sm:w-auto">
        <div className="text-xs text-slate-400 mb-1 font-medium">Your Von ID</div>
        <div className="font-mono text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-slate-700/50 to-slate-800/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-600/30 shadow-lg">
          {displayId}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <button
          onClick={handleCopy}
          className={`
            w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm
            ${copied 
              ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/30 shadow-lg shadow-emerald-500/25' 
              : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/30 hover:from-cyan-500/30 hover:to-blue-500/30 hover:text-cyan-200 shadow-lg shadow-cyan-500/25'
            }
          `}
          title="Copy User ID"
        >
          {copied ? (
            <div className="flex items-center justify-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Copied!</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </div>
          )}
        </button>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`
            w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm
            ${isRefreshing 
              ? 'bg-gradient-to-r from-slate-500/20 to-slate-600/20 text-slate-400 border border-slate-500/30 cursor-not-allowed' 
              : 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300 border border-orange-400/30 hover:from-orange-500/30 hover:to-red-500/30 hover:text-orange-200 shadow-lg shadow-orange-500/25'
            }
          `}
          title="Refresh Von ID"
        >
          {isRefreshing ? (
            <div className="flex items-center justify-center space-x-1">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Refreshing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
