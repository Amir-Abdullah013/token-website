'use client';

import { useState, useEffect } from 'react';

const HydrationTest = () => {
  const [mounted, setMounted] = useState(false);
  const [clientTime, setClientTime] = useState(null);

  useEffect(() => {
    setMounted(true);
    setClientTime(new Date().toLocaleTimeString());
  }, []);

  if (!mounted) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Loading hydration test...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <p className="text-green-800">
        ✅ Hydration test passed! Client time: {clientTime}
      </p>
    </div>
  );
};

export default HydrationTest;


