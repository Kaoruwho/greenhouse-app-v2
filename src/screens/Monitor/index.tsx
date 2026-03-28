import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../theme/ThemeContext';
import { PLANTS } from '../../config/plants';

const MonitorScreen: React.FC = () => {
  const {
    sensorData,
    actuatorStatus,
    controlMode,
    selectedPlant,
    setSelectedPlant,
    updateActuatorState,
    setControlMode,
    isLoading,
  } = useApp();

  const { colors } = useTheme();
  const [showPlantSelector, setShowPlantSelector] = useState(false);

  const getStatusColor = (value: number, min: number, max: number) => {
    if (value >= min && value <= max) return colors.success;
    return colors.warning;
  };

  const getStatusIcon = (value: number, min: number, max: number) => {
    if (value >= min && value <= max) return 'checkmark-circle' as const;
    return 'warning' as const;
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading greenhouse data...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
    >
      {/* Plant Selector */}
      <View style={[styles.plantSelectorContainer, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Selected Plant</Text>
        <TouchableOpacity
          style={[styles.plantButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
          onPress={() => setShowPlantSelector(!showPlantSelector)}
        >
          <Text style={[styles.plantButtonText, { color: colors.text }]}>
            {selectedPlant.name}
          </Text>
          <Ionicons
            name={showPlantSelector ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>

        {showPlantSelector && (
          <View style={[styles.plantDropdown, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {PLANTS.map((plant) => (
              <TouchableOpacity
                key={plant.id}
                style={[
                  styles.plantOption,
                  { 
                    borderBottomColor: colors.border,
                    backgroundColor: selectedPlant.id === plant.id ? colors.primaryLight : 'transparent',
                  },
                ]}
                onPress={() => {
                  setSelectedPlant(plant.id);
                  setShowPlantSelector(false);
                }}
              >
                <Text
                  style={[
                    styles.plantOptionText,
                    { 
                      color: selectedPlant.id === plant.id ? colors.primary : colors.text,
                      fontWeight: selectedPlant.id === plant.id ? '700' : '500',
                    },
                  ]}
                >
                  {plant.name}
                </Text>
                {selectedPlant.id === plant.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Plant Optimal Parameters - Gradient Card */}
      <LinearGradient
        colors={['#11998e', '#38ef7d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="leaf" size={24} color="#fff" />
          <Text style={styles.cardTitleWhite}>
            Optimal Parameters for {selectedPlant.name}
          </Text>
        </View>
        <View style={styles.parameterGrid}>
          <View style={styles.parameterItem}>
            <LinearGradient
              colors={['#FF6B6B', '#FF8E8E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.parameterIcon}
            >
              <Ionicons name="thermometer" size={18} color="#fff" />
            </LinearGradient>
            <Text style={styles.parameterLabel}>Temperature</Text>
            <Text style={styles.parameterValue}>
              {selectedPlant.optimalTemp.min}° - {selectedPlant.optimalTemp.max}°C
            </Text>
          </View>
          <View style={styles.parameterItem}>
            <LinearGradient
              colors={['#4ECDC4', '#7EDDD6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.parameterIcon}
            >
              <Ionicons name="water" size={18} color="#fff" />
            </LinearGradient>
            <Text style={styles.parameterLabel}>Humidity</Text>
            <Text style={styles.parameterValue}>
              {selectedPlant.optimalHumidity.min}% - {selectedPlant.optimalHumidity.max}%
            </Text>
          </View>
          <View style={styles.parameterItem}>
            <LinearGradient
              colors={['#95E1D3', '#B5EDE5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.parameterIcon}
            >
              <Ionicons name="leaf" size={18} color="#fff" />
            </LinearGradient>
            <Text style={styles.parameterLabel}>Soil Moisture</Text>
            <Text style={styles.parameterValue}>
              {selectedPlant.optimalSoilMoisture.min}% - {selectedPlant.optimalSoilMoisture.max}%
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Sensor Data */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <LinearGradient
            colors={['#4CAF50', '#8BC34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardIcon}
          >
            <Ionicons name="analytics" size={18} color="#fff" />
          </LinearGradient>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Current Sensor Readings</Text>
        </View>
        
        {sensorData ? (
          <>
            {/* Temperature */}
            <View style={[styles.sensorRow, { borderBottomColor: colors.border }]}>
              <View style={styles.sensorInfo}>
                <Ionicons
                  name={getStatusIcon(sensorData.temperature, selectedPlant.optimalTemp.min, selectedPlant.optimalTemp.max)}
                  size={22}
                  color={getStatusColor(sensorData.temperature, selectedPlant.optimalTemp.min, selectedPlant.optimalTemp.max)}
                />
                <Text style={[styles.sensorLabel, { color: colors.text }]}>Temperature</Text>
              </View>
              <Text style={[styles.sensorValue, { color: colors.text }]}>
                {sensorData.temperature.toFixed(1)}°C
              </Text>
            </View>

            {/* Humidity */}
            <View style={[styles.sensorRow, { borderBottomColor: colors.border }]}>
              <View style={styles.sensorInfo}>
                <Ionicons
                  name={getStatusIcon(sensorData.humidity, selectedPlant.optimalHumidity.min, selectedPlant.optimalHumidity.max)}
                  size={22}
                  color={getStatusColor(sensorData.humidity, selectedPlant.optimalHumidity.min, selectedPlant.optimalHumidity.max)}
                />
                <Text style={[styles.sensorLabel, { color: colors.text }]}>Humidity</Text>
              </View>
              <Text style={[styles.sensorValue, { color: colors.text }]}>
                {sensorData.humidity.toFixed(1)}%
              </Text>
            </View>

            {/* Soil Moisture - 3 Pots */}
            <Text style={[styles.subTitle, { color: colors.text }]}>Soil Moisture</Text>
            <View style={styles.soilGrid}>
              {[1, 2, 3].map((pot) => {
                const moisture = sensorData.soilMoisture[`pot${pot}` as keyof typeof sensorData.soilMoisture];
                const isOptimal = moisture >= selectedPlant.optimalSoilMoisture.min && moisture <= selectedPlant.optimalSoilMoisture.max;
                return (
                  <LinearGradient
                    key={pot}
                    colors={isOptimal ? ['#4CAF50', '#66BB6A'] : ['#FF9800', '#FFB74D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.soilCard}
                  >
                    <Text style={styles.soilLabel}>Pot {pot}</Text>
                    <Ionicons
                      name={isOptimal ? 'checkmark-circle' : 'warning'}
                      size={28}
                      color="#fff"
                    />
                    <Text style={styles.soilValue}>{moisture.toFixed(1)}%</Text>
                  </LinearGradient>
                );
              })}
            </View>

            <Text style={[styles.timestamp, { color: colors.textMuted }]}>
              Last updated: {new Date(sensorData.timestamp).toLocaleString()}
            </Text>
          </>
        ) : (
          <View style={[styles.noDataContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.noDataText, { color: colors.textMuted }]}>No sensor data available</Text>
          </View>
        )}
      </View>

      {/* Control Mode */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <LinearGradient
            colors={['#4CAF50', '#8BC34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardIcon}
          >
            <Ionicons name="toggle" size={18} color="#fff" />
          </LinearGradient>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Control Mode</Text>
        </View>
        <View style={[styles.modeToggle, { borderColor: colors.primary }]}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              { 
                backgroundColor: controlMode?.isAuto ? colors.primary : 'transparent',
                borderRadius: 12,
              }
            ]}
            onPress={() => setControlMode(true)}
          >
            <Text style={[styles.modeButtonText, { color: controlMode?.isAuto ? '#fff' : colors.primary }]}>AUTO</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              { 
                backgroundColor: !controlMode?.isAuto ? colors.primary : 'transparent',
                borderRadius: 12,
              }
            ]}
            onPress={() => setControlMode(false)}
          >
            <Text style={[styles.modeButtonText, { color: !controlMode?.isAuto ? '#fff' : colors.primary }]}>MANUAL</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Actuator Control */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <LinearGradient
            colors={['#4CAF50', '#8BC34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardIcon}
          >
            <Ionicons name="settings" size={18} color="#fff" />
          </LinearGradient>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Actuator Control</Text>
        </View>
        {!controlMode?.isAuto && (
          <LinearGradient
            colors={['#FF9800', '#FFB74D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.manualModeHint}
          >
            <Ionicons name="information-circle" size={18} color="#fff" />
            <Text style={styles.manualModeHintText}>
              Switch to manual mode to control actuators
            </Text>
          </LinearGradient>
        )}
        
        <View style={styles.actuatorList}>
          {[
            { key: 'fan' as const, label: 'Fan', icon: 'leaf' },
            { key: 'pump' as const, label: 'Pump', icon: 'water' },
            { key: 'ledLight' as const, label: 'LED Light', icon: 'bulb' },
          ].map((actuator) => {
            const isActive = actuatorStatus?.[actuator.key];
            return (
              <View key={actuator.key} style={[styles.actuatorRow, { borderBottomColor: colors.border }]}>
                <View style={styles.actuatorInfo}>
                  <LinearGradient
                    colors={isActive ? ['#4CAF50', '#66BB6A'] : [colors.border, colors.border]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actuatorIconBg}
                  >
                    <Ionicons
                      name={actuator.icon as any}
                      size={20}
                      color={isActive ? '#fff' : colors.textMuted}
                    />
                  </LinearGradient>
                  <Text style={[styles.actuatorLabel, { color: colors.text }]}>{actuator.label}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.actuatorSwitch, { backgroundColor: isActive ? colors.primary : colors.border }]}
                  onPress={() => updateActuatorState(actuator.key, !isActive)}
                  disabled={controlMode?.isAuto}
                >
                  <Text style={[styles.actuatorSwitchText, { color: isActive ? '#fff' : colors.textMuted }]}>
                    {isActive ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 15 },
  plantSelectorContainer: { margin: 16, marginTop: 8, padding: 16, borderRadius: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  plantButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 2 },
  plantButtonText: { fontSize: 17, fontWeight: '700' },
  plantDropdown: { marginTop: 12, borderRadius: 14, borderWidth: 1 },
  plantOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
  plantOptionText: { flex: 1, fontSize: 15, flexShrink: 1 },
  card: { margin: 16, marginTop: 8, padding: 20, borderRadius: 20, borderWidth: 1 },
  gradientCard: { margin: 16, marginTop: 8, padding: 20, borderRadius: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  cardIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardTitleWhite: { fontSize: 18, fontWeight: '700', color: '#fff' },
  parameterGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  parameterItem: { flex: 1, alignItems: 'center' },
  parameterIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  parameterLabel: { fontSize: 12, color: '#fff', textAlign: 'center', marginBottom: 4, paddingHorizontal: 1},
  parameterValue: { fontSize: 13, fontWeight: '700', color: '#fff', textAlign: 'center' },
  sensorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  sensorInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sensorLabel: { fontSize: 16, fontWeight: '500' },
  sensorValue: { fontSize: 16, fontWeight: '700' },
  subTitle: { fontSize: 15, fontWeight: '700', marginTop: 16, marginBottom: 14 },
  soilGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  soilCard: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 16, gap: 8 },
  soilLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
  soilValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  timestamp: { fontSize: 12, marginTop: 16, textAlign: 'center' },
  noDataContainer: { alignItems: 'center', padding: 32, borderRadius: 16, gap: 12 },
  noDataText: { fontSize: 15, textAlign: 'center' },
  modeToggle: { flexDirection: 'row', borderRadius: 14, borderWidth: 2, overflow: 'hidden' },
  modeButton: { flex: 1, padding: 16, alignItems: 'center', overflow: 'hidden' },
  modeButtonText: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  manualModeHint: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 16, gap: 10 },
  manualModeHintText: { fontSize: 14, fontWeight: '600', color: '#fff', flex: 1, flexShrink: 1 },
  actuatorList: { gap: 4 },
  actuatorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  actuatorInfo: { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 1 },
  actuatorIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actuatorLabel: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  actuatorSwitch: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14 },
  actuatorSwitchText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  bottomPadding: { height: 40 },
});

export default MonitorScreen;
