import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'high-contrast';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('nyayasarthi-theme') as Theme) || 'dark';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('nyayasarthi-theme', newTheme);
  };

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('high-contrast');
    else setTheme('dark');
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'light', 'high-contrast');
    root.classList.add(theme);
    
    // Update body background color based on theme
    if (theme === 'light') {
      root.style.backgroundColor = '#f8fafc';
      root.style.color = '#1e293b';
    } else if (theme === 'high-contrast') {
      root.style.backgroundColor = '#000000';
      root.style.color = '#ffffff';
    } else {
      root.style.backgroundColor = '#070b14';
      root.style.color = '#cbd5e1';
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
