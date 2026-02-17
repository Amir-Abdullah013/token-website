'use client';

import { useEffect, useRef } from 'react';

/**
 * Adsterra Ad Component
 * Renders Adsterra ads with proper script injection
 * 
 * @param {string} adKey - Your Adsterra ad key
 * @param {string} format - Ad format (iframe, etc)
 * @param {number} height - Ad height
 * @param {number} width - Ad width
 * @param {string} className - Additional CSS classes
 */
export default function AdsterraAd({ 
  adKey, 
  format = 'iframe', 
  height = 250, 
  width = 300,
  className = '',
  label = true
}) {
  const containerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!adKey || scriptLoadedRef.current || !containerRef.current) return;

    try {
      // Create options script
      const optionsScript = document.createElement('script');
      optionsScript.type = 'text/javascript';
      optionsScript.innerHTML = `
        atOptions = {
          'key' : '${adKey}',
          'format' : '${format}',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      `;
      
      // Create invoke script
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = `//www.topcreativeformat.com/${adKey}/invoke.js`;
      invokeScript.async = true;

      // Append to container
      containerRef.current.appendChild(optionsScript);
      containerRef.current.appendChild(invokeScript);
      
      scriptLoadedRef.current = true;

      // Cleanup function
      return () => {
        if (containerRef.current) {
          // Remove scripts
          const scripts = containerRef.current.querySelectorAll('script');
          scripts.forEach(script => script.remove());
          scriptLoadedRef.current = false;
        }
      };
    } catch (error) {
      console.error('Error loading Adsterra ad:', error);
    }
  }, [adKey, format, height, width]);

  if (!adKey) {
    return (
      <div className={`bg-slate-800/40 rounded-lg p-4 text-center ${className}`}>
        <p className="text-slate-400 text-sm">Ad configuration needed</p>
      </div>
    );
  }

  return (
    <div className={`adsterra-container ${className}`}>
      {label && (
        <p className="text-xs text-slate-400 text-center mb-2">Advertisement</p>
      )}
      <div 
        ref={containerRef} 
        className="adsterra-ad-slot flex items-center justify-center min-h-[100px]"
        style={{ minHeight: `${height}px`, minWidth: `${width}px` }}
      />
    </div>
  );
}
