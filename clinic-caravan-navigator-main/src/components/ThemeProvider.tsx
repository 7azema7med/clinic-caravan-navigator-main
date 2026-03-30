import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── ThemeProvider ──
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="medical-theme">
      {children}
    </NextThemesProvider>
  );
};

// ── ThemeToggle ──
export const ThemeToggle: React.FC<{ variant?: 'header' | 'default' }> = ({ variant = 'default' }) => {
  const [theme, setThemeState] = useState<string>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('medical-theme') || 'light';
    setThemeState(saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    localStorage.setItem('medical-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  if (!mounted) return null;

  if (variant === 'header') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="text-[hsl(var(--header-fg))] hover:bg-white/10 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  );
};

export default ThemeProvider;
