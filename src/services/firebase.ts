import { initializeApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, DataSnapshot, Unsubscribe } from 'firebase/database';
import { firebaseConfig, isFirebaseConfigured as checkConfig } from '../config';
import { SensorData, ActuatorStatus, ControlMode, CameraSnapshot } from '../types';

let db: ReturnType<typeof getDatabase> | null = null;
let app: FirebaseApp | null = null;

// Initialize Firebase (only if configured)
if (checkConfig()) {
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export { db };

// Sensor Data
export const subscribeToSensorData = (callback: (data: SensorData) => void): Unsubscribe => {
  if (!db) {
    return () => {};
  }
  const sensorRef = ref(db, 'sensors');
  return onValue(sensorRef, (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
};

// Actuator Status
export const subscribeToActuatorStatus = (callback: (status: ActuatorStatus) => void): Unsubscribe => {
  if (!db) {
    return () => {};
  }
  const actuatorRef = ref(db, 'actuators');
  return onValue(actuatorRef, (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
};

// Control Mode
export const subscribeToControlMode = (callback: (mode: ControlMode) => void): Unsubscribe => {
  if (!db) {
    return () => {};
  }
  const modeRef = ref(db, 'controlMode');
  return onValue(modeRef, (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (data !== null) {
      callback({ isAuto: data.isAuto });
    }
  });
};

// Update Actuator
export const updateActuator = async (actuator: 'fan' | 'pump' | 'ledLight', value: boolean) => {
  if (!db) {
    throw new Error('Firebase not configured. Please set up Firebase in src/config/index.ts');
  }
  try {
    await update(ref(db, 'actuators'), {
      [actuator]: value,
    });
  } catch (error) {
    console.error('Error updating actuator:', error);
    throw error;
  }
};

// Toggle Control Mode
export const toggleControlMode = async (isAuto: boolean) => {
  if (!db) {
    throw new Error('Firebase not configured. Please set up Firebase in src/config/index.ts');
  }
  try {
    await set(ref(db, 'controlMode'), { isAuto });
  } catch (error) {
    console.error('Error toggling control mode:', error);
    throw error;
  }
};

// Camera Snapshots
export const subscribeToSnapshots = (callback: (snapshots: CameraSnapshot[]) => void): Unsubscribe => {
  if (!db) {
    return () => {};
  }
  const snapshotsRef = ref(db, 'snapshots');
  return onValue(snapshotsRef, (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (data) {
      const snapshotsArray: CameraSnapshot[] = Object.entries(data)
        .map(([id, snap]: [string, any]) => ({
          id,
          imageUrl: snap.imageUrl,
          timestamp: snap.timestamp,
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
      callback(snapshotsArray);
    } else {
      callback([]);
    }
  });
};

// Selected Plant
export const subscribeToSelectedPlant = (callback: (plantId: string) => void): Unsubscribe => {
  if (!db) {
    return () => {};
  }
  const plantRef = ref(db, 'settings/selectedPlant');
  return onValue(plantRef, (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
};

export const updateSelectedPlant = async (plantId: string) => {
  if (!db) {
    throw new Error('Firebase not configured. Please set up Firebase in src/config/index.ts');
  }
  try {
    await set(ref(db, 'settings/selectedPlant'), plantId);
  } catch (error) {
    console.error('Error updating selected plant:', error);
    throw error;
  }
};
