# Push Notifications Setup Guide

This guide will help you set up push notifications for your Greenhouse App using Firebase Cloud Messaging (FCM) and Expo Notifications.

## Overview

The app now supports push notifications that will alert you when:
- Temperature goes outside your defined range
- Humidity goes outside your defined range
- Soil moisture levels are too low or too high

## Prerequisites

- A physical Android device (notifications don't work on emulators)
- Firebase project with Cloud Messaging enabled
- Google Services configuration file

## Step 1: Enable Firebase Cloud Messaging

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `greenhouse-67568`
3. Navigate to **Project Settings** (gear icon)
4. Go to the **Cloud Messaging** tab
5. Copy your **Server Key** and **Sender ID** (you'll need the Sender ID)

## Step 2: Download google-services.json

1. In Firebase Console, go to **Project Settings**
2. Under **Your apps**, select your Android app
3. Download the `google-services.json` file
4. Place it in the root of your project: `C:\Users\arrol\greenhouse-app-v2\google-services.json`

## Step 3: Update app.json (Already Done)

The `app.json` has been configured with:
- FCM permissions for Android
- Notification channel settings
- Required permissions (POST_NOTIFICATIONS, VIBRATE, etc.)

## Step 4: Update Notification Service (Already Done!)

The `projectId` has been configured with your Firebase project ID: `greenhouse-67568`

No changes needed - you're ready to go!

## Step 5: Build and Run on Physical Device

Push notifications **only work on physical devices**, not emulators.

```bash
# Start the development server
npx expo start

# Scan the QR code with your Android device using Expo Go
# Or build a development build:
npx expo run:android
```

## Step 6: Grant Notification Permissions

1. Open the app on your device
2. Go to the **Settings** tab
3. You'll see a notification permission card at the top
4. Tap **Enable Notifications** if permissions aren't granted
5. Accept the permission dialog

## Step 7: Configure Alert Thresholds

1. Go to **Settings** → **Alert Thresholds**
2. Tap on Temperature, Humidity, or Soil Moisture
3. Set your desired min/max values
4. Tap **Save Changes**

## Step 8: Test Notifications

### Option A: Automatic Testing (via Sensor Data)

1. Make sure notifications are enabled in Settings
2. Wait for sensor data to update (from your ESP32)
3. If values go outside thresholds, you'll receive a notification

### Option B: Manual Testing (Send Test Notification)

You can send a test notification using the Firebase Console:

1. Go to Firebase Console → **Cloud Messaging**
2. Click **New Notification** or **Send your first message**
3. Enter notification title and text
4. Target your specific device using the token (found in app logs)
5. Click **Send**

## How It Works

### Notification Flow

```
ESP32 Sensors → Firebase Realtime Database
                      ↓
              AppContext (monitors data)
                      ↓
          Alert Service (checks thresholds)
                      ↓
          Notification Service (sends alert)
                      ↓
              Device receives notification
```

### Alert Logic

The app monitors sensor data in real-time and sends notifications when:
- **Temperature**: Goes below min or above max threshold
- **Humidity**: Goes below min or above max threshold  
- **Soil Moisture**: Any pot goes below min or above max threshold

**Smart Alerting**: The app only sends one notification per alert type until the condition returns to normal, preventing notification spam.

## Notification Settings

In the app's Settings tab, you can:
- **Enable/Disable all notifications** (master toggle)
- **Temperature Alerts**: Toggle on/off
- **Humidity Alerts**: Toggle on/off
- **Soil Moisture Alerts**: Toggle on/off

## Troubleshooting

### Notifications not showing

1. **Check permissions**: Go to Settings tab and ensure notifications are enabled
2. **Check Android settings**: Go to Android Settings → Apps → Greenhouse App → Notifications → Enable
3. **Check app is running**: Notifications work best when app is running or in background

### Token not saving to Firebase

1. Check that `google-services.json` is in the project root
2. Verify Firebase project ID matches
3. Check app logs for errors: `npx expo start --clear`

### "Must use physical device" error

Push notifications don't work on emulators. Use a physical Android device.

## Firebase Database Structure

The app saves notification tokens to:
```
notificationTokens/
  └── {deviceId}/
      ├── token: "ExponentPushToken[...]"
      ├── createdAt: 1234567890
      ├── platform: "android"
      └── enabled: true

devicePresence/
  └── {deviceId}/
      ├── lastSeen: 1234567890
      ├── online: true
      └── token: "ExponentPushToken[...]"
```

## Sending Notifications from Server

If you want to send notifications from a server or ESP32:

### Using Expo Push API

```javascript
const message = {
  to: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  sound: 'default',
  title: 'Greenhouse Alert',
  body: 'Temperature is too high!',
  data: { type: 'temperature_alert', value: 35 },
};

fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(message),
});
```

### Using Firebase Cloud Messaging

```javascript
// Send to specific device token
const message = {
  token: 'device-fcm-token',
  notification: {
    title: 'Greenhouse Alert',
    body: 'Temperature is too high!',
  },
  data: {
    type: 'temperature_alert',
    value: '35',
  },
};
```

## Next Steps

- [ ] Set up server-side notification scheduling
- [ ] Add notification history in the app
- [ ] Create notification sound customization
- [ ] Add quiet hours (do not disturb period)

## Additional Resources

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Expo Push Notification Tool](https://expo.dev/notifications)
