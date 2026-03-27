import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getDatabase, ref, set, onDisconnect } from 'firebase/database';

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and get the Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      sound: 'notification-sound.wav',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Get the Expo push token
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '4b1322cf-9530-43a3-b131-df151b3e536a',
      });
      token = tokenData.data;
      console.log('Expo Push Token:', token);
    } catch (error) {
      console.error('Error getting Expo push token:', error);
      return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Save the push token to Firebase for the current device
 */
export async function savePushTokenToFirebase(token: string | null, deviceId: string): Promise<void> {
  if (!token) return;

  try {
    const db = getDatabase();
    const tokenRef = ref(db, `notificationTokens/${deviceId}`);
    
    await set(tokenRef, {
      token,
      createdAt: Date.now(),
      platform: Platform.OS,
      enabled: true,
    });

    // Set up onDisconnect to mark token as offline when device disconnects
    const devicePresenceRef = ref(db, `devicePresence/${deviceId}`);
    await onDisconnect(devicePresenceRef).set({
      lastSeen: Date.now(),
      online: false,
    });
    await set(devicePresenceRef, {
      lastSeen: Date.now(),
      online: true,
      token,
    });

    console.log('Push token saved to Firebase');
  } catch (error) {
    console.error('Error saving push token to Firebase:', error);
  }
}

/**
 * Send a local notification (for testing or immediate alerts)
 */
export async function sendLocalNotification({
  title,
  body,
  data,
}: {
  title: string;
  body: string;
  data?: Record<string, any>;
}): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // Send immediately
  });
}

/**
 * Schedule a notification for a specific time
 */
export async function scheduleNotification({
  title,
  body,
  trigger,
  data,
}: {
  title: string;
  body: string;
  trigger: Date | number;
  data?: Record<string, any>;
}): Promise<string | null> {
  try {
    const triggerConfig =
      typeof trigger === 'number'
        ? { seconds: trigger }
        : { date: trigger };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: triggerConfig as any,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Check notification permissions
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Get the current notification settings status
 */
export async function getNotificationStatus(): Promise<{
  granted: boolean;
  canSchedule: boolean;
}> {
  const { status } = await Notifications.getPermissionsAsync();
  return {
    granted: status === 'granted',
    canSchedule: await Notifications.getBadgeCountAsync() !== undefined,
  };
}
