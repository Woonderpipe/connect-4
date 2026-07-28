'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

const LEGACY_DARK_MODE_KEY = 'connect4_dark_mode';

export function ThemeSync() {
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const legacyDarkMode = localStorage.getItem(LEGACY_DARK_MODE_KEY);

    if (!storedTheme && legacyDarkMode !== null) {
      try {
        setTheme(JSON.parse(legacyDarkMode) ? 'dark' : 'light');
      } catch {
        // Ignore malformed legacy storage and keep the system default.
      }
    }

    localStorage.removeItem(LEGACY_DARK_MODE_KEY);
  }, [setTheme]);

  useEffect(() => {
    const themeColor = resolvedTheme === 'dark' ? '#09090b' : '#ffffff';
    let meta = document.querySelector('meta[name="theme-color"]');

    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.append(meta);
    }

    meta.setAttribute('content', themeColor);
    document.documentElement.style.colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light';
  }, [resolvedTheme]);

  return null;
}
