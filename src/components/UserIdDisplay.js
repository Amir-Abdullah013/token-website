'use client';

import { useState } from 'react';
import { useToast } from './Toast';

export default function UserIdDisplay({ userId, showFull = false, className = '' }) {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      success('User ID copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy user ID:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = userId;
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

  const displayId = showFull ? userId : userId?.substring(0, 8) + '...';

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 ${className}`}>
      <div className="flex-1 w-full sm:w-auto">
        <div className="text-xs text-slate-400 mb-1 font-medium">Your TIKI ID</div>
        <div className="font-mono text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-slate-700/50 to-slate-800/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-600/30 shadow-lg">
          {displayId}
        </div>
      </div>
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
    </div>
  );
}
