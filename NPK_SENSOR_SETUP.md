# NPK Sensor Setup Guide

This guide will help you set up the NPK (Nitrogen, Phosphorus, Potassium) soil sensor for AI-powered fertilizer recommendations.

## 📦 Hardware Required

| Component | Quantity | Purpose |
|-----------|----------|---------|
| ESP32 Dev Board | 1 | Main microcontroller |
| RS485 NPK Sensor | 1 | Measures N, P, K levels in soil |
| DHT11/DHT22 Sensor | 1 | Temperature & humidity |
| Capacitive Soil Moisture Sensors | 3 | Soil moisture per pot |
| RS485 Module (if not built-in) | 1 | Modbus RTU communication |
| Jumper Wires | - | Connections |
| Breadboard/PCB | 1 | Prototyping |

## 🔌 Wiring Diagram

### NPK Sensor (RS485 Modbus) to ESP32

```
NPK Sensor     ESP32
----------     -----
VCC         -> 5V or 12V (check your sensor)
GND         -> GND
A+ (RX+)    -> RS485 Module A
B- (TX-)    -> RS485 Module B
```

### RS485 Module to ESP32

```
RS485 Module   ESP32
------------   -----
VCC         -> 5V
GND         -> GND
RO (Receiver) -> GPIO 16 (RX2)
DI (Driver)   -> GPIO 17 (TX2)
DE/RE       -> GPIO 5
```

### DHT11 Sensor

```
DHT11      ESP32
-----      -----
VCC     -> 3.3V
DATA    -> GPIO 4
GND     -> GND
```

### Soil Moisture Sensors

```
Soil Sensor 1  ESP32
-------------  -----
VCC         -> 3.3V
GND         -> GND
AO          -> GPIO 34 (VP)

Soil Sensor 2  ESP32
-------------  -----
VCC         -> 3.3V
GND         -> GND
AO          -> GPIO 35 (VN)

Soil Sensor 3  ESP32
-------------  -----
VCC         -> 3.3V
GND         -> GND
AO          -> GPIO 32
```

### Relay Module (for actuators)

```
Relay Module  ESP32
------------  -----
IN1 (Fan)   -> GPIO 26
IN2 (Pump)  -> GPIO 25
IN3 (LED)   -> GPIO 27
VCC         -> 5V
GND         -> GND
```

## 📝 Step-by-Step Setup

### 1. Install Arduino Libraries

Open Arduino IDE and install these libraries via Library Manager:

1. **Firebase-ESP32** by Mobizt (v3.5.5 or later)
2. **DHT sensor library** by Adafruit
3. **Adafruit Unified Sensor**
4. **ModbusMaster** by Doc Walker

### 2. Configure the Code

Open `ESP32_NPK_SENSOR/ESP32_NPK_SENSOR.ino` and update:

```cpp
// WiFi credentials
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase credentials
#define FIREBASE_AUTH "YOUR_FIREBASE_DATABASE_SECRET"
```

**Get Firebase Database Secret:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Reveal" next to Database secret
3. Copy and paste into the code

### 3. Calibrate NPK Sensor

NPK sensors use Modbus RTU protocol. Common settings:
- **Baud Rate:** 4800 (check your sensor's datasheet)
- **Slave ID:** 1 (may vary by manufacturer)
- **Register Addresses:** May need adjustment

**Check your sensor's documentation for:**
- Correct Modbus register addresses for N, P, K values
- Proper baud rate and slave ID
- Wiring voltage requirements (some need 12V)

### 4. Calibrate Soil Moisture Sensors

1. Upload this test code to read raw values:
```cpp
void setup() {
  Serial.begin(115200);
}

void loop() {
  int dryValue = analogRead(34);  // Sensor in dry air
  int wetValue = analogRead(34);  // Sensor in water
  Serial.printf("Dry: %d, Wet: %d\n", dryValue, wetValue);
  delay(1000);
}
```

2. Update the `map()` function in the main code with your calibrated values:
```cpp
int percentage = map(rawValue, YOUR_DRY_VALUE, YOUR_WET_VALUE, 0, 100);
```

### 5. Upload Code

1. Connect ESP32 via USB
2. Select board: **DOIT ESP32 DEVKIT V1**
3. Select port: **COM port** (Windows) or `/dev/ttyUSB0` (Linux)
4. Click **Upload**

### 6. Test in Firebase Console

1. Open Firebase Console → Realtime Database → Data
2. You should see data appearing every 5 seconds:
```json
{
  "sensors": {
    "temperature": 26.5,
    "humidity": 68,
    "soilMoisture": {
      "pot1": 72,
      "pot2": 65,
      "pot3": 70
    },
    "npk": {
      "pot1": {
        "nitrogen": 85,
        "phosphorus": 32,
        "potassium": 145
      },
      "pot2": { ... },
      "pot3": { ... }
    },
    "timestamp": 1234567890
  }
}
```

## 📱 Testing NPK in the App

1. Open your Greenhouse App
2. Go to **AI** tab → **Soil Analysis**
3. Select a pot (1, 2, or 3)
4. You should see NPK readings displayed
5. Tap **Get AI Recommendation**
6. The AI will analyze NPK values and provide fertilizer advice

## 🔍 Troubleshooting

### NPK Sensor Not Reading

1. **Check wiring:** Ensure A+ and B- are not swapped
2. **Check baud rate:** Try 9600, 19200, or 115200
3. **Check slave ID:** Some sensors use ID 0 or 2
4. **Check register addresses:** Consult your sensor's Modbus map

### "NPK sensor not detected" Warning

- The app shows this when no NPK data exists in Firebase
- Verify ESP32 is uploading NPK data correctly
- Check Firebase Console for npk data structure

### Inaccurate NPK Readings

1. **Soil contact:** Ensure sensor probes are fully inserted in soil
2. **Calibration:** Some sensors need calibration with known samples
3. **Interference:** Keep away from motors and high-voltage wires
4. **Moisture:** NPK sensors work best in moist (not wet) soil

## 🌱 Understanding NPK Values

### Nitrogen (N)
- **Role:** Leaf growth, chlorophyll production
- **Deficiency:** Yellowing leaves, stunted growth
- **Optimal Range:** 50-100 mg/kg

### Phosphorus (P)
- **Role:** Root development, flowering, fruiting
- **Deficiency:** Purple leaves, poor root growth
- **Optimal Range:** 20-40 mg/kg

### Potassium (K)
- **Role:** Overall plant health, disease resistance
- **Deficiency:** Brown leaf edges, weak stems
- **Optimal Range:** 100-200 mg/kg

## 📊 Firebase Database Structure

Your complete database should look like:

```json
{
  "sensors": {
    "temperature": 26.5,
    "humidity": 68,
    "soilMoisture": {
      "pot1": 72,
      "pot2": 65,
      "pot3": 70
    },
    "npk": {
      "pot1": {
        "nitrogen": 85,
        "phosphorus": 32,
        "potassium": 145
      },
      "pot2": {
        "nitrogen": 78,
        "phosphorus": 28,
        "potassium": 138
      },
      "pot3": {
        "nitrogen": 82,
        "phosphorus": 30,
        "potassium": 142
      }
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

## 🎯 Next Steps

1. ✅ Test NPK sensor readings in app
2. ✅ Get AI fertilizer recommendations
3. ⬜ Set up automatic fertilizer dosing system
4. ⬜ Add nutrient history tracking
5. ⬜ Create custom NPK profiles for different plants

## 📞 Need Help?

- Check Serial Monitor (115200 baud) for debug messages
- Verify Firebase data in Realtime Database
- Test NPK sensor with Modbus scanner app first
