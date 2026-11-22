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
      if (meta) meta.setAttribute('content', '#24262D');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      const meta = document.getElementById('meta-theme-color');
      if (meta) meta.setAttribute('content', '#F7F3EB');
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
      if (meta) meta.setAttribute('content', '#24262D');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      const meta = document.getElementById('meta-theme-color');
      if (meta) meta.setAttribute('content', '#F7F3EB');
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      className={`min-h-[44px] min-w-[44px] p-2.5 rounded-none border-2 border-[#24262D] dark:border-[#F7F3EB]/35 text-[#24262D] dark:text-[#F7F3EB] bg-[#FFFDF8] dark:bg-[#24262D] shadow-[var(--mh20-shadow-sm)] dark:shadow-[var(--mh20-shadow-sm)] hover:bg-[#C7EFDE] hover:text-[#24262D] transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F47B49] ${className}`}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Sun className="w-4 h-4" aria-hidden="true" />
      )}
    </button>
  );
};
