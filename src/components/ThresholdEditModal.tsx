import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

interface ThresholdValues {
  min: number;
  max: number;
}

interface ThresholdEditModalProps {
  visible: boolean;
  type: 'temperature' | 'humidity' | 'soil';
  currentValues: ThresholdValues;
  plantDefaults: ThresholdValues;
  unit: string;
  onClose: () => void;
  onSave: (values: ThresholdValues) => void;
}

const ThresholdEditModal: React.FC<ThresholdEditModalProps> = ({
  visible,
  type,
  currentValues,
  plantDefaults,
  unit,
  onClose,
  onSave,
}) => {
  const { colors, isDark } = useTheme();
  const [minValue, setMinValue] = useState(currentValues.min.toString());
  const [maxValue, setMaxValue] = useState(currentValues.max.toString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setMinValue(currentValues.min.toString());
      setMaxValue(currentValues.max.toString());
      setError(null);
    }
  }, [visible, currentValues]);

  const handleSave = () => {
    const min = parseFloat(minValue);
    const max = parseFloat(maxValue);

    if (isNaN(min) || isNaN(max)) {
      setError('Please enter valid numbers');
      return;
    }

    if (min >= max) {
      setError('Minimum value must be less than maximum value');
      return;
    }

    if (min < 0 || max < 0) {
      setError('Values cannot be negative');
      return;
    }

    setError(null);
    onSave({ min, max });
  };

  const handleResetToDefaults = () => {
    setMinValue(plantDefaults.min.toString());
    setMaxValue(plantDefaults.max.toString());
    setError(null);
  };

  const getHeaderConfig = () => {
    switch (type) {
      case 'temperature':
        return {
          title: 'Temperature',
          icon: 'thermometer' as const,
          gradient: ['#FF6B6B', '#FF8E8E'] as const,
        };
      case 'humidity':
        return {
          title: 'Humidity',
          icon: 'water' as const,
          gradient: ['#4ECDC4', '#7EDDD6'] as const,
        };
      case 'soil':
        return {
          title: 'Soil Moisture',
          icon: 'leaf' as const,
          gradient: ['#95E1D3', '#B5EDE5'] as const,
        };
    }
  };

  const headerConfig = getHeaderConfig();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalOverlay} onStartShouldSetResponder={() => true}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <LinearGradient
                  colors={headerConfig.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.headerIcon}
                >
                  <Ionicons name={headerConfig.icon} size={24} color="#fff" />
                </LinearGradient>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Edit {headerConfig.title}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Min Value Input */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Minimum {unit}
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={minValue}
                    onChangeText={setMinValue}
                    keyboardType="decimal-pad"
                    placeholder="Enter minimum"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>{unit}</Text>
                </View>
              </View>

              {/* Max Value Input */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Maximum {unit}
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={maxValue}
                    onChangeText={setMaxValue}
                    keyboardType="decimal-pad"
                    placeholder="Enter maximum"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>{unit}</Text>
                </View>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Current Range Display */}
              <View style={[styles.currentRangeCard, { backgroundColor: colors.primaryLight }]}>
                <View style={styles.currentRangeHeader}>
                  <Ionicons name="information-circle" size={20} color={colors.primary} />
                  <Text style={[styles.currentRangeTitle, { color: colors.primary }]}>
                    Current Range
                  </Text>
                </View>
                <Text style={[styles.currentRangeValue, { color: colors.text }]}>
                  {currentValues.min}{unit} - {currentValues.max}{unit}
                </Text>
              </View>

              {/* Plant Defaults Display */}
              <View style={[styles.defaultsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.defaultsHeader}>
                  <Ionicons name="leaf" size={20} color={colors.textSecondary} />
                  <Text style={[styles.defaultsTitle, { color: colors.text }]}>
                    Plant Default Range
                  </Text>
                </View>
                <Text style={[styles.defaultsValue, { color: colors.textSecondary }]}>
                  {plantDefaults.min}{unit} - {plantDefaults.max}{unit}
                </Text>
                <TouchableOpacity
                  style={styles.resetDefaultsButton}
                  onPress={handleResetToDefaults}
                >
                  <Ionicons name="refresh" size={16} color={colors.primary} />
                  <Text style={[styles.resetDefaultsText, { color: colors.primary }]}>
                    Use Defaults
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <LinearGradient
                  colors={['#4CAF50', '#8BC34A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    paddingVertical: 12,
  },
  inputUnit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
  currentRangeCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  currentRangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  currentRangeTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  currentRangeValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  defaultsCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  defaultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  defaultsTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  defaultsValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  resetDefaultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  resetDefaultsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ThresholdEditModal;
