import { SensorData, ThresholdSettings, NotificationSettings, Plant } from '../types';
import { sendLocalNotification } from './notifications';

interface AlertState {
  temperatureAlertSent: boolean;
  humidityAlertSent: boolean;
  soilMoistureAlertSent: boolean;
}

const alertState: AlertState = {
  temperatureAlertSent: false,
  humidityAlertSent: false,
  soilMoistureAlertSent: false,
};

/**
 * Check sensor data against thresholds and send notifications if needed
 */
export function checkSensorAlerts(
  sensorData: SensorData | null,
  thresholds: ThresholdSettings,
  settings: NotificationSettings,
  plant: Plant
): void {
  if (!sensorData) return;

  const { temperature, humidity, soilMoisture } = sensorData;

  // Check Temperature Alerts
  if (settings.enabled && settings.temperatureAlert) {
    const { min, max } = thresholds.temperature;
    
    if (temperature < min || temperature > max) {
      if (!alertState.temperatureAlertSent) {
        sendTemperatureAlert(temperature, min, max, plant.name);
        alertState.temperatureAlertSent = true;
      }
    } else {
      alertState.temperatureAlertSent = false;
    }
  }

  // Check Humidity Alerts
  if (settings.enabled && settings.humidityAlert) {
    const { min, max } = thresholds.humidity;
    
    if (humidity < min || humidity > max) {
      if (!alertState.humidityAlertSent) {
        sendHumidityAlert(humidity, min, max, plant.name);
        alertState.humidityAlertSent = true;
      }
    } else {
      alertState.humidityAlertSent = false;
    }
  }

  // Check Soil Moisture Alerts (for all pots)
  if (settings.enabled && settings.soilMoistureAlert) {
    const { min, max } = thresholds.soilMoisture;
    
    Object.entries(soilMoisture).forEach(([pot, moisture]) => {
      if (moisture < min || moisture > max) {
        if (!alertState.soilMoistureAlertSent) {
          sendSoilMoistureAlert(pot, moisture, min, max, plant.name);
          alertState.soilMoistureAlertSent = true;
        }
      } else {
        alertState.soilMoistureAlertSent = false;
      }
    });
  }
}

/**
 * Send temperature alert notification
 */
async function sendTemperatureAlert(
  temp: number,
  min: number,
  max: number,
  plantName: string
): Promise<void> {
  const isTooLow = temp < min;
  
  await sendLocalNotification({
    title: '🌡️ Temperature Alert',
    body: `${plantName}: Temperature is ${isTooLow ? 'too low' : 'too high'}! Current: ${temp}°C (Optimal: ${min}°C - ${max}°C)`,
    data: {
      type: 'temperature_alert',
      value: temp,
      min,
      max,
    },
  });
}

/**
 * Send humidity alert notification
 */
async function sendHumidityAlert(
  humidity: number,
  min: number,
  max: number,
  plantName: string
): Promise<void> {
  const isTooLow = humidity < min;
  
  await sendLocalNotification({
    title: '💧 Humidity Alert',
    body: `${plantName}: Humidity is ${isTooLow ? 'too low' : 'too high'}! Current: ${humidity}% (Optimal: ${min}% - ${max}%)`,
    data: {
      type: 'humidity_alert',
      value: humidity,
      min,
      max,
    },
  });
}

/**
 * Send soil moisture alert notification
 */
async function sendSoilMoistureAlert(
  pot: string,
  moisture: number,
  min: number,
  max: number,
  plantName: string
): Promise<void> {
  const isTooLow = moisture < min;
  
  await sendLocalNotification({
    title: '🌱 Soil Moisture Alert',
    body: `${plantName} (${pot}): Soil is ${isTooLow ? 'too dry' : 'too wet'}! Current: ${moisture}% (Optimal: ${min}% - ${max}%)`,
    data: {
      type: 'soil_moisture_alert',
      pot,
      value: moisture,
      min,
      max,
    },
  });
}

/**
 * Reset all alert states (useful when changing plants or thresholds)
 */
export function resetAlertStates(): void {
  alertState.temperatureAlertSent = false;
  alertState.humidityAlertSent = false;
  alertState.soilMoistureAlertSent = false;
}
