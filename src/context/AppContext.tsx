import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  SensorData,
  ActuatorStatus,
  ControlMode,
  Plant,
  CameraSnapshot,
  ChatMessage,
  SoilRecommendation,
  NotificationSettings,
  ThresholdSettings,
} from '../types';
import {
  subscribeToSensorData,
  subscribeToActuatorStatus,
  subscribeToControlMode,
  subscribeToSnapshots,
  subscribeToSelectedPlant,
  updateActuator,
  toggleControlMode,
  updateSelectedPlant,
} from '../services/firebase';
import { isFirebaseConfigured } from '../config';
import { PLANTS, DEFAULT_PLANT } from '../config/plants';
import { registerForPushNotificationsAsync, savePushTokenToFirebase, checkNotificationPermissions } from '../services/notifications';
import { checkSensorAlerts, resetAlertStates } from '../services/alertService';
import Constants from 'expo-constants';

interface AppContextType {
  // Sensor Data
  sensorData: SensorData | null;

  // Actuator Status
  actuatorStatus: ActuatorStatus | null;
  updateActuatorState: (actuator: 'fan' | 'pump' | 'ledLight', value: boolean) => Promise<void>;

  // Control Mode
  controlMode: ControlMode | null;
  setControlMode: (isAuto: boolean) => Promise<void>;

  // Plant Selection
  selectedPlant: Plant;
  setSelectedPlant: (plantId: string) => Promise<void>;
  availablePlants: Plant[];

  // Camera Snapshots
  snapshots: CameraSnapshot[];

  // Chat Messages (persisted in context)
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;

  // Soil Recommendations (persisted in context)
  soilRecommendations: SoilRecommendation[];
  addSoilRecommendation: (recommendation: SoilRecommendation) => void;

  // Settings
  notificationSettings: NotificationSettings;
  setNotificationSettings: (settings: NotificationSettings) => void;

  thresholdSettings: ThresholdSettings;
  setThresholdSettings: (settings: ThresholdSettings) => void;

  // Notification permissions
  notificationPermissionGranted: boolean;
  requestNotificationPermission: () => Promise<boolean>;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Firebase setup
  isFirebaseConfigured: boolean;
}

const defaultThresholds: ThresholdSettings = {
  temperature: { min: 15, max: 35 },
  humidity: { min: 40, max: 90 },
  soilMoisture: { min: 40, max: 90 },
};

const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  temperatureAlert: true,
  humidityAlert: true,
  soilMoistureAlert: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [actuatorStatus, setActuatorStatus] = useState<ActuatorStatus | null>(null);
  const [controlMode, setControlModeState] = useState<ControlMode | null>({ isAuto: true });
  const [selectedPlant, setSelectedPlantState] = useState<Plant>(DEFAULT_PLANT);
  const [snapshots, setSnapshots] = useState<CameraSnapshot[]>([]);
  const [chatMessages, setChatMessagesState] = useState<ChatMessage[]>([]);
  const [soilRecommendations, setSoilRecommendations] = useState<SoilRecommendation[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [thresholdSettings, setThresholdSettings] = useState<ThresholdSettings>(defaultThresholds);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firebaseConfigured, setFirebaseConfigured] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);

  // Get unique device ID for notification tokens
  const getDeviceId = (): string => {
    return `${Constants.expoConfig?.slug || 'greenhouse-app'}-${Constants.deviceId || 'unknown'}`;
  };

  // Check Firebase configuration
  useEffect(() => {
    const configured = isFirebaseConfigured();
    setFirebaseConfigured(configured);

    if (!configured) {
      setIsLoading(false);
      return;
    }

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    const unsubscribeSensor = subscribeToSensorData((data) => {
      setSensorData(data);
      setIsLoading(false);
      clearTimeout(timeoutId);
    });

    const unsubscribeActuator = subscribeToActuatorStatus((status) => {
      setActuatorStatus(status);
    });

    const unsubscribeMode = subscribeToControlMode((mode) => {
      setControlModeState(mode);
    });

    const unsubscribeSnapshots = subscribeToSnapshots((snapshotsData) => {
      setSnapshots(Array.isArray(snapshotsData) ? snapshotsData : []);
    });

    const unsubscribePlant = subscribeToSelectedPlant((plantId) => {
      const plant = PLANTS.find((p) => p.id === plantId) || DEFAULT_PLANT;
      setSelectedPlantState(plant);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribeSensor();
      unsubscribeActuator();
      unsubscribeMode();
      unsubscribeSnapshots();
      unsubscribePlant();
    };
  }, []);

  // Initialize push notifications
  useEffect(() => {
    const initNotifications = async () => {
      // Check initial permission status
      const hasPermission = await checkNotificationPermissions();
      setNotificationPermissionGranted(hasPermission);

      if (hasPermission) {
        // Register for push notifications
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await savePushTokenToFirebase(token, getDeviceId());
        }
      }
    };

    initNotifications();
  }, []);

  // Check sensor alerts when sensor data changes
  useEffect(() => {
    if (sensorData) {
      checkSensorAlerts(sensorData, thresholdSettings, notificationSettings, selectedPlant);
    }
  }, [sensorData, thresholdSettings, notificationSettings, selectedPlant]);

  const updateActuatorState = async (actuator: 'fan' | 'pump' | 'ledLight', value: boolean) => {
    try {
      await updateActuator(actuator, value);
    } catch (err) {
      setError('Failed to update actuator');
      throw err;
    }
  };

  const setControlMode = async (isAuto: boolean) => {
    try {
      await toggleControlMode(isAuto);
    } catch (err) {
      setError('Failed to update control mode');
      throw err;
    }
  };

  const setSelectedPlant = async (plantId: string) => {
    try {
      await updateSelectedPlant(plantId);
    } catch (err) {
      setError('Failed to update selected plant');
      throw err;
    }
  };

  const addChatMessage = (message: ChatMessage) => {
    setChatMessagesState((prev) => [...prev, message]);
  };

  const addSoilRecommendation = (recommendation: SoilRecommendation) => {
    setSoilRecommendations((prev) => [recommendation, ...prev]);
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    const { requestNotificationPermissions } = await import('../services/notifications');
    const granted = await requestNotificationPermissions();
    setNotificationPermissionGranted(granted);
    
    if (granted) {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await savePushTokenToFirebase(token, getDeviceId());
      }
    }
    
    return granted;
  };

  return (
    <AppContext.Provider
      value={{
        sensorData: sensorData || null,
        actuatorStatus: actuatorStatus || null,
        updateActuatorState,
        controlMode: controlMode || { isAuto: true },
        setControlMode,
        selectedPlant: selectedPlant || DEFAULT_PLANT,
        setSelectedPlant,
        availablePlants: PLANTS,
        snapshots: snapshots || [],
        chatMessages: chatMessages || [],
        addChatMessage,
        setChatMessages: setChatMessagesState,
        soilRecommendations: soilRecommendations || [],
        addSoilRecommendation,
        notificationSettings: notificationSettings || defaultNotificationSettings,
        setNotificationSettings,
        thresholdSettings: thresholdSettings || defaultThresholds,
        setThresholdSettings,
        notificationPermissionGranted,
        requestNotificationPermission,
        isLoading,
        error,
        isFirebaseConfigured: firebaseConfigured,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
