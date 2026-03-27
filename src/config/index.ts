// Firebase Configuration
// TODO: Replace with your actual Firebase config from Firebase Console
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || "YOUR_DATABASE_URL",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID"
};

// Groq API Configuration
// TODO: Replace with your actual Groq API key
export const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || "YOUR_GROQ_API_KEY";

// Camera snapshot settings
export const SNAPSHOTS_PER_DAY = 2;

// Firebase paths
export const FIREBASE_PATHS = {
  SENSOR_DATA: 'sensors',
  ACTUATOR_STATUS: 'actuators',
  CONTROL_MODE: 'controlMode',
  CAMERA_SNAPSHOTS: 'snapshots',
  SELECTED_PLANT: 'settings/selectedPlant',
};

// Helper to check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "" &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.databaseURL &&
    firebaseConfig.databaseURL !== "" &&
    firebaseConfig.databaseURL !== "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
  );
};
