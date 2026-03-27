# Firebase Setup Guide for AI-Based Smart Mini Greenhouse

## 📋 Overview
This guide will help you set up Firebase Realtime Database for your greenhouse monitoring system.

---

## 🔧 Step 1: Firebase Console Setup

### 1.1 Go to Firebase Console
1. Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Select your project: **greenhouse-67568**

### 1.2 Enable Realtime Database
1. Click **Build** → **Realtime Database**
2. Click **Create Database** (if not already created)
3. Choose location: **asia-southeast1** (Singapore) - closest to Philippines
4. Start in **test mode** for development

### 1.3 Set Database Rules
Replace the default rules with these security rules:

```json
{
  "rules": {
    "sensors": {
      ".read": true,
      ".write": true
    },
    "actuators": {
      ".read": true,
      ".write": true
    },
    "controlMode": {
      ".read": true,
      ".write": true
    },
    "snapshots": {
      ".read": true,
      ".write": true
    },
    "settings": {
      ".read": true,
      ".write": true
    }
  }
}
```

> ⚠️ **Note:** For production, add authentication. For now, test mode is fine for development.

---

## 📊 Step 2: Database Structure

Your Firebase Realtime Database should have this structure:

```json
{
  "sensors": {
    "temperature": 25.5,
    "humidity": 65.0,
    "soilMoisture": {
      "pot1": 70,
      "pot2": 65,
      "pot3": 68
    },
    "timestamp": 1711555200000
  },
  "actuators": {
    "fan": false,
    "pump": false,
    "ledLight": false
  },
  "controlMode": {
    "isAuto": true
  },
  "snapshots": {
    "snapshotId1": {
      "imageUrl": "https://firebasestorage.googleapis.com/.../image.jpg",
      "timestamp": 1711555200000
    }
  },
  "settings": {
    "selectedPlant": "tomato"
  }
}
```

---

## 🔌 Step 3: ESP32/Arduino Code

Here's the complete code for your ESP32 to send data to Firebase:

### 3.1 Install Required Libraries (Arduino IDE)
```
- Firebase-ESP32 by Mobizt (v3.5.5 or later)
- DHT sensor library
- Adafruit Unified Sensor
```

### 3.2 ESP32 Firebase Code

```cpp
#include <WiFi.h>
#include <Firebase_ESP32.h>
#include <DHT.h>

// WiFi credentials
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase credentials
#define FIREBASE_HOST "greenhouse-67568-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "YOUR_FIREBASE_DATABASE_SECRET"  // Get from Project Settings > Service Accounts

// DHT Sensor
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Soil Moisture Sensors (ADC pins)
#define SOIL_PIN_POT1 34
#define SOIL_PIN_POT2 35
#define SOIL_PIN_POT3 32

// Relay pins for actuators
#define FAN_PIN 26
#define PUMP_PIN 25
#define LED_PIN 27

FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;

unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL = 5000;  // Read every 5 seconds

void setup() {
  Serial.begin(115200);
  
  // Initialize sensors
  dht.begin();
  
  // Initialize relay pins
  pinMode(FAN_PIN, OUTPUT);
  pinMode(PUMP_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(FAN_PIN, LOW);
  digitalWrite(PUMP_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  
  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nConnected to WiFi");
  
  // Setup Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  // Enable listening for actuator changes
  Firebase.stream(&firebaseData, "/actuators");
  
  Serial.println("Firebase connected!");
}

void loop() {
  // Read sensors every 5 seconds
  if (millis() - lastReadTime > READ_INTERVAL) {
    readAndSendSensors();
    lastReadTime = millis();
  }
  
  // Listen for actuator updates from Firebase
  if (Firebase.stream(&firebaseData, "/actuators")) {
    updateActuators();
  }
  
  delay(100);
}

void readAndSendSensors() {
  // Read DHT11
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Read soil moisture (0-4095 for ESP32)
  int soil1 = analogRead(SOIL_PIN_POT1);
  int soil2 = analogRead(SOIL_PIN_POT2);
  int soil3 = analogRead(SOIL_PIN_POT3);
  
  // Convert to percentage (calibrate based on your sensor)
  int soil1Percent = map(soil1, 4095, 1500, 0, 100);
  int soil2Percent = map(soil2, 4095, 1500, 0, 100);
  int soil3Percent = map(soil3, 4095, 1500, 0, 100);
  
  // Constrain values
  soil1Percent = constrain(soil1Percent, 0, 100);
  soil2Percent = constrain(soil2Percent, 0, 100);
  soil3Percent = constrain(soil3Percent, 0, 100);
  
  // Send to Firebase
  if (Firebase.setFloat(firebaseData, "/sensors/temperature", temperature)) {
    Serial.println("Temperature sent");
  }
  
  if (Firebase.setFloat(firebaseData, "/sensors/humidity", humidity)) {
    Serial.println("Humidity sent");
  }
  
  if (Firebase.setInt(firebaseData, "/sensors/soilMoisture/pot1", soil1Percent)) {
    Serial.println("Soil 1 sent");
  }
  
  if (Firebase.setInt(firebaseData, "/sensors/soilMoisture/pot2", soil2Percent)) {
    Serial.println("Soil 2 sent");
  }
  
  if (Firebase.setInt(firebaseData, "/sensors/soilMoisture/pot3", soil3Percent)) {
    Serial.println("Soil 3 sent");
  }
  
  if (Firebase.setInt(firebaseData, "/sensors/timestamp", millis())) {
    Serial.println("Timestamp sent");
  }
}

void updateActuators() {
  // Read actuator states from Firebase
  if (Firebase.getInt(firebaseData, "/actuators/fan")) {
    digitalWrite(FAN_PIN, HIGH);
  } else {
    digitalWrite(FAN_PIN, LOW);
  }
  
  if (Firebase.getInt(firebaseData, "/actuators/pump")) {
    digitalWrite(PUMP_PIN, HIGH);
  } else {
    digitalWrite(PUMP_PIN, LOW);
  }
  
  if (Firebase.getInt(firebaseData, "/actuators/ledLight")) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }
  
  Serial.println("Actuators updated");
}
```

---

## 📱 Step 4: Test the Integration

### 4.1 Manual Test (Without ESP32)
You can test the app by manually adding data to Firebase:

1. Go to Firebase Console → Realtime Database → Data tab
2. Click the three dots (⋮) → **Import JSON**
3. Paste this test data:

```json
{
  "sensors": {
    "temperature": 26.5,
    "humidity": 68.0,
    "soilMoisture": {
      "pot1": 72,
      "pot2": 65,
      "pot3": 70
    },
    "timestamp": 1711555200000
  },
  "actuators": {
    "fan": false,
    "pump": false,
    "ledLight": false
  },
  "controlMode": {
    "isAuto": true
  },
  "settings": {
    "selectedPlant": "tomato"
  }
}
```

4. Click **Import**
5. Open your app - you should see live data!

### 4.2 Test Actuator Control
1. Open the app
2. Go to **Monitor** tab
3. Switch to **MANUAL** mode
4. Toggle Fan/Pump/LED
5. Check Firebase Console - values should update!
6. Your ESP32 should respond to the changes

---

## 🔍 Step 5: Get Firebase Database Secret

To get `FIREBASE_AUTH` for ESP32:

1. Go to Firebase Console
2. Click **Project Settings** (gear icon)
3. Go to **Service Accounts** tab
4. Click **Reveal** next to Database secret
5. Copy the secret key
6. Replace `YOUR_FIREBASE_DATABASE_SECRET` in the ESP32 code

---

## ✅ Troubleshooting

### App shows "No sensor data available"
- Check if data exists in Firebase Console
- Verify `databaseURL` in config matches your project
- Make sure database rules allow read access

### Actuators don't respond
- Check if ESP32 is connected to WiFi
- Verify `FIREBASE_AUTH` is correct
- Check relay wiring on ESP32

### Data not updating in real-time
- ESP32 should send data every 5 seconds
- App subscribes to Firebase updates automatically
- Check internet connection on both devices

---

## 📞 Need Help?

If you encounter issues:
1. Check Firebase Console for error logs
2. Open Serial Monitor in Arduino IDE (115200 baud)
3. Check app console logs with `npx expo start`
