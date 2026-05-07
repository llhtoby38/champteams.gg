'use client';

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'poketeam_theme';
const EVENT = 'poketeam-theme-change';

function applyThemeClass(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'light';
}

/**
 * Theme hook — manages light/dark preference with localStorage sync.
 * The .dark class is applied to <html> before hydration via an inline script in layout.tsx.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());

  // Apply theme class whenever theme changes
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  // Cross-instance sync: listen for other hook instances updating the theme
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Theme | undefined;
      if (detail === 'light' || detail === 'dark') {
        setThemeState(detail);
      }
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const setTheme = useCallback((value: Theme) => {
    setThemeState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
