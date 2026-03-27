import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from './src/context/AppContext';
import { isFirebaseConfigured } from './src/config';

// Import screens
import MonitorScreen from './src/screens/Monitor';
import AIScreen from './src/screens/AI';
import CameraScreen from './src/screens/Camera';
import SettingsScreen from './src/screens/Settings';

type TabName = 'Monitor' | 'AI' | 'Camera' | 'Settings';

function SetupScreen() {
  return (
    <ScrollView style={styles.setupContainer} contentContainerStyle={styles.setupContent}>
      <View style={styles.setupCard}>
        <Ionicons name="leaf-outline" size={64} color="#4CAF50" />
        <Text style={styles.setupTitle}>Welcome to Greenhouse App</Text>
        <Text style={styles.setupSubtitle}>AI-Based Smart Mini Greenhouse</Text>

        <View style={styles.infoBox}>
          <Ionicons name="warning" size={24} color="#FF9800" />
          <Text style={styles.infoText}>
            Firebase is not configured yet. Please follow the setup instructions.
          </Text>
        </View>

        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>Setup Steps:</Text>
          
          <View style={styles.step}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>
              Open{' '}
              <Text style={styles.code}>src/config/index.ts</Text>
            </Text>
          </View>

          <View style={styles.step}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>
              Add your Firebase config from{' '}
              <Text style={styles.link} onPress={() => Linking.openURL('https://console.firebase.google.com/')}>
                Firebase Console
              </Text>
            </Text>
          </View>

          <View style={styles.step}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>
              Add your Groq API key from{' '}
              <Text style={styles.link} onPress={() => Linking.openURL('https://console.groq.com/')}>
                Groq Console
              </Text>
            </Text>
          </View>

          <View style={styles.step}>
            <Text style={styles.stepNumber}>4</Text>
            <Text style={styles.stepText}>
              Set up your Firebase Realtime Database structure (see README.md)
            </Text>
          </View>

          <View style={styles.step}>
            <Text style={styles.stepNumber}>5</Text>
            <Text style={styles.stepText}>
              Restart the app
            </Text>
          </View>
        </View>

        <View style={styles.demoDataBox}>
          <Text style={styles.demoDataTitle}>📝 Quick Test (Optional)</Text>
          <Text style={styles.demoDataText}>
            Add this to your Firebase Realtime Database to test:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{`{
  "sensors": {
    "temperature": 25,
    "humidity": 65,
    "soilMoisture": {
      "pot1": 70,
      "pot2": 65,
      "pot3": 68
    },
    "timestamp": ${Date.now()}
  },
  "actuators": {
    "fan": false,
    "pump": false,
    "ledLight": false
  },
  "controlMode": {
    "isAuto": true
  }
}`}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState<TabName>('Monitor');
  const { isLoading } = useApp();

  const renderScreen = () => {
    switch (activeTab) {
      case 'Monitor':
        return <MonitorScreen />;
      case 'AI':
        return <AIScreen />;
      case 'Camera':
        return <CameraScreen />;
      case 'Settings':
        return <SettingsScreen />;
      default:
        return <MonitorScreen />;
    }
  };

  const tabs: Array<{ name: TabName; icon: string; label: string }> = [
    { name: 'Monitor', icon: 'leaf', label: 'Monitor' },
    { name: 'AI', icon: 'chatbubbles', label: 'AI' },
    { name: 'Camera', icon: 'camera', label: 'Camera' },
    { name: 'Settings', icon: 'settings', label: 'Settings' },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderScreen()}
      </View>
      
      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => setActiveTab(tab.name)}
            >
              <Ionicons
                name={isActive ? (tab.icon as any) : `${tab.icon}-outline`}
                size={24}
                color={isActive ? '#4CAF50' : '#757575'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

function AppContent() {
  const configured = isFirebaseConfigured();

  if (!configured) {
    return <SetupScreen />;
  }

  return <MainApp />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    minHeight: 60,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#4CAF50',
  },
  setupContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  setupContent: {
    padding: 20,
    paddingTop: 60,
  },
  setupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  setupSubtitle: {
    fontSize: 16,
    color: '#757575',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
  stepsContainer: {
    marginTop: 24,
    width: '100%',
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '700',
    marginRight: 12,
    flexShrink: 0,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    paddingTop: 4,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 13,
    color: '#2E7D32',
  },
  link: {
    color: '#4CAF50',
    textDecorationLine: 'underline',
  },
  demoDataBox: {
    marginTop: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  demoDataTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  demoDataText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  codeBlock: {
    backgroundColor: '#263238',
    padding: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: '#80CBC4',
    lineHeight: 16,
  },
});
