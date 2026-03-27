import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { AppProvider } from '../src/context/AppContext';
import MainApp from './MainApp';

function AppContent() {
  const { isDark } = useTheme();
  
  return (
    <>
      <StatusBar 
        style={isDark ? 'light' : 'dark'} 
        backgroundColor={isDark ? '#000000' : '#ffffff'} 
      />
      <MainApp />
    </>
  );
}

export default function Index() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
