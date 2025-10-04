'use client';

import { useEffect, useState } from 'react';

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    const measurePerformance = () => {
      if (typeof window === 'undefined') return;

      // Get performance metrics
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      const metrics = {
        // Page load metrics
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        
        // Resource metrics
        totalResources: performance.getEntriesByType('resource').length,
        totalSize: performance.getEntriesByType('resource').reduce((total, entry) => total + (entry.transferSize || 0), 0),
        
        // Memory usage (if available)
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null,
        
        // Connection info
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        } : null
      };

      setMetrics(metrics);

      // Log performance issues
      if (metrics.domContentLoaded > 3000) {
        console.warn('Slow DOM content loaded:', metrics.domContentLoaded + 'ms');
      }
      
      if (metrics.firstContentfulPaint > 2000) {
        console.warn('Slow first contentful paint:', metrics.firstContentfulPaint + 'ms');
      }
      
      if (metrics.totalSize > 5 * 1024 * 1024) { // 5MB
        console.warn('Large page size:', Math.round(metrics.totalSize / 1024 / 1024) + 'MB');
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }

    // Cleanup
    return () => {
      window.removeEventListener('load', measurePerformance);
    };
  }, []);

  // Don't render anything in production
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono max-w-xs">
      <div className="font-bold mb-2">Performance Metrics</div>
      {metrics ? (
        <div className="space-y-1">
          <div>DOM Load: {Math.round(metrics.domContentLoaded)}ms</div>
          <div>Page Load: {Math.round(metrics.loadComplete)}ms</div>
          <div>FCP: {Math.round(metrics.firstContentfulPaint)}ms</div>
          <div>Resources: {metrics.totalResources}</div>
          <div>Size: {Math.round(metrics.totalSize / 1024)}KB</div>
          {metrics.memory && (
            <div>Memory: {Math.round(metrics.memory.used / 1024 / 1024)}MB</div>
          )}
          {metrics.connection && (
            <div>Connection: {metrics.connection.effectiveType}</div>
          )}
        </div>
      ) : (
        <div>Loading metrics...</div>
      )}
    </div>
  );
}









