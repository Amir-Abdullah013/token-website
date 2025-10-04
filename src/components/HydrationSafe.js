'use client';

import { useEffect, useState } from 'react';

export default function HydrationSafe({ children, fallback = null }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Use a small delay to ensure all browser extensions have finished modifying the DOM
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!isHydrated) {
    return fallback;
  }

  return children;
}
