export interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: {
    pot1: number;
    pot2: number;
    pot3: number;
  };
  npk?: {
    pot1: { nitrogen: number; phosphorus: number; potassium: number };
    pot2: { nitrogen: number; phosphorus: number; potassium: number };
    pot3: { nitrogen: number; phosphorus: number; potassium: number };
  };
  timestamp: number;
}

export interface ActuatorStatus {
  fan: boolean;
  pump: boolean;
  ledLight: boolean;
}

export interface ControlMode {
  isAuto: boolean;
}

export interface Plant {
  id: string;
  name: string;
  optimalTemp: { min: number; max: number };
  optimalHumidity: { min: number; max: number };
  optimalSoilMoisture: { min: number; max: number };
}

export interface CameraSnapshot {
  id: string;
  imageUrl: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface SoilRecommendation {
  id: string;
  potNumber: number;
  recommendation: string;
  npkData?: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  timestamp: number;
}

export interface NPKRecommendation {
  id: string;
  potNumber: number;
  npkData: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  recommendation: string;
  fertilizerAdvice: string;
  timestamp: number;
}

export interface NotificationSettings {
  enabled: boolean;
  temperatureAlert: boolean;
  humidityAlert: boolean;
  soilMoistureAlert: boolean;
}

export interface ThresholdSettings {
  temperature: { min: number; max: number };
  humidity: { min: number; max: number };
  soilMoisture: { min: number; max: number };
}
