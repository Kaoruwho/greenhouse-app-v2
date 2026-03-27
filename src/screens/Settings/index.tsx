import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../theme/ThemeContext';
import ThresholdEditModal from '../../components/ThresholdEditModal';

const SettingsScreen: React.FC = () => {
  const appContext = useApp();
  const notificationSettings = appContext.notificationSettings || { enabled: true, temperatureAlert: true, humidityAlert: true, soilMoistureAlert: true };
  const setNotificationSettings = appContext.setNotificationSettings;
  const thresholdSettings = appContext.thresholdSettings || { temperature: { min: 15, max: 35 }, humidity: { min: 40, max: 90 }, soilMoisture: { min: 40, max: 90 } };
  const setThresholdSettings = appContext.setThresholdSettings;
  const selectedPlant = appContext.selectedPlant;
  const notificationPermissionGranted = appContext.notificationPermissionGranted;
  const requestNotificationPermission = appContext.requestNotificationPermission;

  const { colors, isDark, toggleTheme } = useTheme();
  const [editingThreshold, setEditingThreshold] = useState<'temperature' | 'humidity' | 'soilMoisture' | null>(null);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      Alert.alert(
        'Notifications Enabled',
        'You will now receive alerts about your greenhouse conditions.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Permission Denied',
        'Notification permission was not granted. You can enable it in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSaveThreshold = (values: { min: number; max: number }) => {
    if (!editingThreshold) return;

    setThresholdSettings({
      ...thresholdSettings,
      [editingThreshold]: values,
    });
    setEditingThreshold(null);
  };

  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    if (key === 'enabled') {
      setNotificationSettings({ ...notificationSettings, enabled: !notificationSettings.enabled });
    } else {
      setNotificationSettings({ ...notificationSettings, [key]: !notificationSettings[key] });
    }
  };

  const handleResetThresholds = () => {
    Alert.alert(
      'Reset Thresholds',
      'Reset to default values based on selected plant?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setThresholdSettings({
              temperature: selectedPlant.optimalTemp,
              humidity: selectedPlant.optimalHumidity,
              soilMoisture: selectedPlant.optimalSoilMoisture,
            });
          },
        },
      ]
    );
  };

  const SettingToggle = ({ title, subtitle, value, onToggle, disabled = false }: any) => (
    <View style={[styles.settingRow, disabled && { opacity: 0.5 }]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.text }, disabled && { color: colors.textMuted }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }, disabled && { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <LinearGradient
          colors={['#4CAF50', '#8BC34A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerIcon}
        >
          <Ionicons name="settings" size={28} color="#fff" />
        </LinearGradient>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Customize your preferences
        </Text>
      </View>

      {/* Theme Toggle */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <LinearGradient
            colors={isDark ? ['#4A5568', '#2D3748'] : ['#FFB74D', '#FF9800']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionIcon}
          >
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color="#fff" />
          </LinearGradient>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        </View>

        <View style={styles.themeToggleContainer}>
          <TouchableOpacity
            style={[styles.themeOption, { backgroundColor: !isDark ? '#4CAF50' : '#2A2A2A', borderColor: !isDark ? '#4CAF50' : '#404040' }]}
            onPress={() => isDark && toggleTheme()}
          >
            <LinearGradient
              colors={!isDark ? ['#FFB74D', '#FF9800'] : ['#2A2A2A', '#2A2A2A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.themeIcon}
            >
              <Ionicons name="sunny" size={24} color={!isDark ? '#fff' : '#666'} />
            </LinearGradient>
            <Text style={[styles.themeLabel, { color: !isDark ? '#fff' : '#999' }]}>Light</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeOption, { backgroundColor: isDark ? '#4CAF50' : '#2A2A2A', borderColor: isDark ? '#4CAF50' : '#404040' }]}
            onPress={() => !isDark && toggleTheme()}
          >
            <LinearGradient
              colors={isDark ? ['#4A5568', '#2D3748'] : ['#2A2A2A', '#2A2A2A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.themeIcon}
            >
              <Ionicons name="moon" size={24} color={isDark ? '#fff' : '#666'} />
            </LinearGradient>
            <Text style={[styles.themeLabel, { color: isDark ? '#fff' : '#999' }]}>Dark</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <LinearGradient
            colors={['#FF9800', '#FFB74D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionIcon}
          >
            <Ionicons name="notifications" size={18} color="#fff" />
          </LinearGradient>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
        </View>

        <View style={styles.sectionContent}>
          {/* Permission Status */}
          <View style={[styles.permissionCard, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
            <View style={styles.permissionHeader}>
              <LinearGradient
                colors={notificationPermissionGranted ? ['#4CAF50', '#8BC34A'] : ['#FF9800', '#FFB74D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.permissionIcon}
              >
                <Ionicons
                  name={notificationPermissionGranted ? 'notifications' : 'notifications-outline'}
                  size={20}
                  color="#fff"
                />
              </LinearGradient>
              <View style={styles.permissionInfo}>
                <Text style={[styles.permissionTitle, { color: colors.text }]}>
                  {notificationPermissionGranted ? 'Notifications Enabled' : 'Notifications Disabled'}
                </Text>
                <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
                  {notificationPermissionGranted
                    ? 'Your device will receive push notifications'
                    : 'Tap below to enable notification permissions'}
                </Text>
              </View>
            </View>
            {!notificationPermissionGranted && (
              <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermission}>
                <LinearGradient
                  colors={['#4CAF50', '#8BC34A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.permissionButtonGradient}
                >
                  <Text style={styles.permissionButtonText}>Enable Notifications</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <SettingToggle
            title="Enable Notifications"
            subtitle="Receive alerts about your greenhouse"
            value={notificationSettings.enabled}
            onToggle={() => handleNotificationToggle('enabled')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingToggle
            title="Temperature Alerts"
            subtitle="Get notified when temperature is out of range"
            value={notificationSettings.temperatureAlert}
            onToggle={() => handleNotificationToggle('temperatureAlert')}
            disabled={!notificationSettings.enabled}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingToggle
            title="Humidity Alerts"
            subtitle="Get notified when humidity is out of range"
            value={notificationSettings.humidityAlert}
            onToggle={() => handleNotificationToggle('humidityAlert')}
            disabled={!notificationSettings.enabled}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingToggle
            title="Soil Moisture Alerts"
            subtitle="Get notified when soil moisture is low"
            value={notificationSettings.soilMoistureAlert}
            onToggle={() => handleNotificationToggle('soilMoistureAlert')}
            disabled={!notificationSettings.enabled}
          />
        </View>
      </View>

      {/* Thresholds */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <LinearGradient
            colors={['#4CAF50', '#8BC34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionIcon}
          >
            <Ionicons name="speedometer" size={18} color="#fff" />
          </LinearGradient>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Alert Thresholds</Text>
        </View>

        <View style={styles.sectionContent}>
          <Text style={[styles.thresholdInfo, { color: colors.textSecondary }]}>
            Set custom min/max values for alerts. Values outside this range will trigger notifications.
          </Text>

          <TouchableOpacity style={[styles.thresholdDisplay, { borderBottomColor: colors.border }]} onPress={() => setEditingThreshold('temperature')}>
            <View style={styles.thresholdDisplayRow}>
              <View style={styles.thresholdDisplayItem}>
                <LinearGradient colors={['#FF6B6B', '#FF8E8E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.thresholdDisplayIcon}>
                  <Ionicons name="thermometer" size={18} color="#fff" />
                </LinearGradient>
                <View>
                  <Text style={[styles.thresholdDisplayLabel, { color: colors.text }]}>Temperature</Text>
                  <Text style={[styles.thresholdDisplayValue, { color: colors.textSecondary }]}>
                    {thresholdSettings.temperature.min}° - {thresholdSettings.temperature.max}°C
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={[styles.thresholdDisplay, { borderBottomColor: colors.border }]} onPress={() => setEditingThreshold('humidity')}>
            <View style={styles.thresholdDisplayRow}>
              <View style={styles.thresholdDisplayItem}>
                <LinearGradient colors={['#4ECDC4', '#7EDDD6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.thresholdDisplayIcon}>
                  <Ionicons name="water" size={18} color="#fff" />
                </LinearGradient>
                <View>
                  <Text style={[styles.thresholdDisplayLabel, { color: colors.text }]}>Humidity</Text>
                  <Text style={[styles.thresholdDisplayValue, { color: colors.textSecondary }]}>
                    {thresholdSettings.humidity.min}% - {thresholdSettings.humidity.max}%
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={[styles.thresholdDisplay, { borderBottomColor: colors.border }]} onPress={() => setEditingThreshold('soilMoisture')}>
            <View style={styles.thresholdDisplayRow}>
              <View style={styles.thresholdDisplayItem}>
                <LinearGradient colors={['#95E1D3', '#B5EDE5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.thresholdDisplayIcon}>
                  <Ionicons name="leaf" size={18} color="#fff" />
                </LinearGradient>
                <View>
                  <Text style={[styles.thresholdDisplayLabel, { color: colors.text }]}>Soil Moisture</Text>
                  <Text style={[styles.thresholdDisplayValue, { color: colors.textSecondary }]}>
                    {thresholdSettings.soilMoisture.min}% - {thresholdSettings.soilMoisture.max}%
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={handleResetThresholds}>
            <LinearGradient colors={['#4CAF50', '#8BC34A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.resetButtonIcon}>
              <Ionicons name="refresh" size={18} color="#fff" />
            </LinearGradient>
            <Text style={[styles.resetButtonText, { color: colors.primary }]}>Reset to Plant Defaults</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <LinearGradient
            colors={['#2196F3', '#64B5F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionIcon}
          >
            <Ionicons name="information-circle" size={18} color="#fff" />
          </LinearGradient>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        </View>

        <View style={styles.sectionContent}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.text }]}>App Version</Text>
            <View style={[styles.versionBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.aboutValue, { color: colors.primary }]}>1.0.0</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.text }]}>Firebase Status</Text>
            <View style={styles.statusIndicator}>
              <LinearGradient colors={['#4CAF50', '#66BB6A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statusDot} />
              <Text style={[styles.aboutValue, { color: colors.success }]}>Connected</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomPadding} />
      
      {/* Threshold Edit Modal */}
      {editingThreshold && (
        <ThresholdEditModal
          visible={true}
          type={editingThreshold === 'soilMoisture' ? 'soil' : editingThreshold}
          currentValues={thresholdSettings[editingThreshold]}
          plantDefaults={
            editingThreshold === 'temperature'
              ? selectedPlant.optimalTemp
              : editingThreshold === 'humidity'
              ? selectedPlant.optimalHumidity
              : selectedPlant.optimalSoilMoisture
          }
          unit={editingThreshold === 'temperature' ? '°C' : '%'}
          onClose={() => setEditingThreshold(null)}
          onSave={handleSaveThreshold}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', padding: 24, paddingTop: 60, gap: 12 },
  headerIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  headerSubtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center', paddingHorizontal: 5, flexShrink: 1 },
  section: { margin: 16, marginTop: 8, borderRadius: 20, borderWidth: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12 },
  sectionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', flexShrink: 1 },
  sectionContent: { paddingHorizontal: 18, paddingBottom: 18 },
  themeToggleContainer: { flexDirection: 'row', gap: 12, marginTop: 8 },
  themeOption: { flex: 1, alignItems: 'center', padding: 18, borderRadius: 16, borderWidth: 2, gap: 10 },
  themeIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  themeLabel: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  settingInfo: { flex: 1, marginRight: 16 },
  settingTitle: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  settingSubtitle: { fontSize: 13, marginTop: 4, lineHeight: 18, flexShrink: 1 },
  divider: { height: 1, marginVertical: 4 },
  permissionCard: { padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1 },
  permissionHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  permissionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  permissionInfo: { flex: 1 },
  permissionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  permissionText: { fontSize: 14, lineHeight: 20 },
  permissionButton: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  permissionButtonGradient: { paddingVertical: 14, alignItems: 'center' },
  permissionButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  thresholdInfo: { fontSize: 14, lineHeight: 20, paddingVertical: 12 },
  thresholdDisplay: { paddingVertical: 14 },
  thresholdDisplayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  thresholdDisplayItem: { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 1 },
  thresholdDisplayIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  thresholdDisplayLabel: { fontSize: 15, fontWeight: '500', flexShrink: 1 },
  thresholdDisplayValue: { fontSize: 13, marginTop: 2 },
  resetButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10 },
  resetButtonIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  resetButtonText: { fontSize: 15, fontWeight: '600' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  aboutLabel: { fontSize: 15, fontWeight: '500' },
  aboutValue: { fontSize: 14, fontWeight: '600' },
  versionBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  bottomPadding: { height: 40 },
});

export default SettingsScreen;
