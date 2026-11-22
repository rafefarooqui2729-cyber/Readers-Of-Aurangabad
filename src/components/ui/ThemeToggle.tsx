import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';

    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem('roa-theme');
    } catch {
      // Storage can be unavailable (privacy mode / blocked cookies); fall back.
    }
    if (saved === 'dark' || saved === 'light') return saved;

    try {
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    } catch {
      // Media query unsupported — keep the light default.
    }
    return 'light';
  });

  useEffect(() => {
    // Keep DOM in sync with state on mount
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      const meta = document.getElementById('meta-theme-color');
      if (meta) meta.setAttribute('content', '#171717');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      const meta = document.getElementById('meta-theme-color');
      if (meta) meta.setAttribute('content', '#F5F4EF');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      window.localStorage.setItem('roa-theme', nextTheme);
    } catch {
      // Persisting the theme is best-effort; the in-memory toggle still works.
    }
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      const meta = document.getElementById('meta-theme-color');
      if (meta) meta.setAttribute('content', '#171717');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      const meta = document.getElementById('meta-theme-color');
      if (meta) meta.setAttribute('content', '#F5F4EF');
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      className={`rr-btn rr-btn--outline min-w-[44px] !px-3 ${className}`.trim()}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Sun className="w-4 h-4" aria-hidden="true" />
      )}
    </button>
  );
};
