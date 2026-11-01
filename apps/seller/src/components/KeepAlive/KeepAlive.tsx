'use client';

import { useEffect } from 'react';

/**
 * KeepAlive silently pings /api/health every 3.5 minutes while the seller tab is open.
 * Keeps Neon database connections warm and prevents cold starts during administration.
 */
export function KeepAlive() {
  useEffect(() => {
    const INTERVAL_MS = 3.5 * 60 * 1000;

    const ping = () => {
      fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
      }).catch(() => {
        // Silently swallow network drops
      });
    };

    const initialTimeout = setTimeout(ping, 2000);
    const intervalId = setInterval(ping, INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        ping();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}

