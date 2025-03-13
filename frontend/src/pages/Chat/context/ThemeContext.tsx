import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Custom hook to use the theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Provider component for theme settings
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get saved theme preference or default to 'system'
  const getSavedMode = (): ThemeMode => {
    const savedMode = localStorage.getItem('theme-mode');
    return (savedMode as ThemeMode) || 'system';
  };
  
  const [mode, setMode] = useState<ThemeMode>(getSavedMode());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Update theme based on system preference
  const updateThemeFromSystem = () => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(mode === 'system' ? prefersDark : mode === 'dark');
  };
  
  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      updateThemeFromSystem();
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Initial update
    updateThemeFromSystem();
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [mode]);
  
  // Save theme preference when it changes
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
    updateThemeFromSystem();
    
    // Apply theme classes to the document
    if (isDarkMode) {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    }
  }, [mode, isDarkMode]);
  
  return (
    <ThemeContext.Provider value={{ mode, setMode, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 