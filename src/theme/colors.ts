export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  tabBarBackground: string;
  tabBarBorder: string;
}

export const lightColors: ThemeColors = {
  background: '#F5F5F5',
  backgroundSecondary: '#FFFFFF',
  cardBackground: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#666666',
  textMuted: '#999999',
  primary: '#4CAF50',
  primaryLight: '#E8F5E9',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  border: '#E0E0E0',
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E0E0E0',
};

export const darkColors: ThemeColors = {
  background: '#121212',
  backgroundSecondary: '#1E1E1E',
  cardBackground: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#666666',
  primary: '#81C784',
  primaryLight: '#1B3317',
  success: '#81C784',
  warning: '#FFB74D',
  error: '#E57373',
  border: '#333333',
  tabBarBackground: '#1E1E1E',
  tabBarBorder: '#333333',
};

export const animations = {
  fast: 150,
  normal: 300,
  slow: 500,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
