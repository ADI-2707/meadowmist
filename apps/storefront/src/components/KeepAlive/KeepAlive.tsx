'use client';

import { useEffect } from 'react';

/**
 * KeepAlive silently pings /api/health every 3.5 minutes while the browser tab is open.
 * This guarantees serverless database warm state during client demos and active sessions.
 */
export default function KeepAlive() {
  useEffect(() => {
    // Ping every 3.5 minutes (210,000 ms) - safely within Neon's 5-minute idle threshold
    const INTERVAL_MS = 3.5 * 60 * 1000;

    const ping = () => {
      fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
      }).catch(() => {
        // Silently swallow any transient offline/network drops
      });
    };

    // Ping once shortly after mount (delayed by 2 seconds to not compete with initial page render)
    const initialTimeout = setTimeout(ping, 2000);
    const intervalId = setInterval(ping, INTERVAL_MS);

    // Ping when user switches back to this tab
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
