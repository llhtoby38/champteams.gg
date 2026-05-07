'use client';

import { useEffect } from 'react';

// Pings the server every 10 minutes to prevent Render cold starts.
export function KeepAlive() {
  useEffect(() => {
    const ping = () => fetch('/api/ping').catch(() => {});
    // Ping immediately on mount, then every 10 minutes
    ping();
    const id = setInterval(ping, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return null;
}
