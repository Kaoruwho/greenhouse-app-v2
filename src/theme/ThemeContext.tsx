import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeMode, ThemeColors, lightColors, darkColors } from './colors';

interface ThemeContextType {
  themeMode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  // Initialize theme from system, but store in state so toggleTheme works
  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    systemColorScheme === 'dark' ? 'dark' : 'light'
  );

  // Update theme when system theme changes (only if user hasn't manually toggled)
  useEffect(() => {
    const newTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
    setThemeModeState(newTheme);
  }, [systemColorScheme]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const toggleTheme = () => {
    setThemeModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const isDark = themeMode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        colors,
        isDark,
        toggleTheme,
        setThemeMode,
      }}
    >
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
