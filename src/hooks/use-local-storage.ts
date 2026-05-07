'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook that syncs state to localStorage.
 * On mount, loads from localStorage. On change, saves back.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Guard to prevent re-entrancy from our own event
  const selfUpdate = useRef(false);

  // Sync to localStorage on change + broadcast to other hooks in the same tab
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      selfUpdate.current = true;
      window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key } }));
      selfUpdate.current = false;
    } catch {
      // localStorage full or unavailable
    }
  }, [key, value]);

  // Listen for updates from other useLocalStorage hooks in the same tab
  useEffect(() => {
    const handler = (e: Event) => {
      if (selfUpdate.current) return; // ignore our own event
      const detail = (e as CustomEvent).detail;
      if (detail?.key !== key) return;
      try {
        const stored = localStorage.getItem(key);
        if (stored !== null) {
          setValue(JSON.parse(stored) as T);
        }
      } catch {}
    };
    window.addEventListener('local-storage-sync', handler);
    return () => window.removeEventListener('local-storage-sync', handler);
  }, [key]);

  return [value, setValue];
}

/**
 * Get the current auth session from localStorage.
 */
export function getAuthSession(): { userId: string; username: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const session = localStorage.getItem('poketeam_session');
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
}

export function setAuthSession(session: { userId: string; username: string } | null) {
  if (typeof window === 'undefined') return;
  if (session) {
    localStorage.setItem('poketeam_session', JSON.stringify(session));
  } else {
    localStorage.removeItem('poketeam_session');
  }
}
