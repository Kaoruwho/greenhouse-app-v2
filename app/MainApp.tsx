import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/ThemeContext';
import { isFirebaseConfigured } from '../src/config';

// Import screens
import MonitorScreen from '../src/screens/Monitor';
import AIScreen from '../src/screens/AI';
import CameraScreen from '../src/screens/Camera';
import SettingsScreen from '../src/screens/Settings';

type TabName = 'Monitor' | 'AI' | 'Camera' | 'Settings';

export default function MainApp() {
  const [activeTab, setActiveTab] = useState<TabName>('Monitor');
  const { colors, isDark, toggleTheme } = useTheme();

  const renderScreen = () => {
    switch (activeTab) {
      case 'Monitor': return <MonitorScreen />;
      case 'AI': return <AIScreen />;
      case 'Camera': return <CameraScreen />;
      case 'Settings': return <SettingsScreen />;
      default: return <MonitorScreen />;
    }
  };

  const tabs: Array<{ name: TabName; icon: any; label: string }> = [
    { name: 'Monitor', icon: 'leaf', label: 'Monitor' },
    { name: 'AI', icon: 'chatbubbles', label: 'AI' },
    { name: 'Camera', icon: 'camera', label: 'Camera' },
    { name: 'Settings', icon: 'settings', label: 'Settings' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>AI-Based Smart Mini Greenhouse</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.tabBarBackground, borderTopColor: colors.tabBarBorder }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => setActiveTab(tab.name)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.icon : `${tab.icon}-outline`}
                size={24}
                color={isActive ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.primary : colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 55,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'ios' ? 25 : 20,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
