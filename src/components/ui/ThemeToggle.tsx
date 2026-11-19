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
      if (meta) meta.setAttribute('content', '#1B2A49');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      const meta = document.getElementById('meta-theme-color');
      if (meta) meta.setAttribute('content', '#F4ECDD');
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
      if (meta) meta.setAttribute('content', '#1B2A49');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      const meta = document.getElementById('meta-theme-color');
      if (meta) meta.setAttribute('content', '#F4ECDD');
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      className={`min-h-[44px] min-w-[44px] p-2.5 rounded-[4px] border border-[#1B2A49]/30 dark:border-[#F4ECDD]/30 text-[#1B2A49] dark:text-[#F4ECDD] hover:bg-[#1B2A49]/5 dark:hover:bg-[#F4ECDD]/10 transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[#A8431F] ${className}`}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4 text-[#1B2A49]" aria-hidden="true" />
      ) : (
        <Sun className="w-4 h-4 text-[#E8B04A]" aria-hidden="true" />
      )}
    </button>
  );
};
