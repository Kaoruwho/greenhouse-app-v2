# NPK Sensor Setup Guide

This guide will help you set up the NPK (Nitrogen, Phosphorus, Potassium) soil sensor for AI-powered fertilizer recommendations.

## 📦 Hardware Required

| Component | Quantity | Purpose |
|-----------|----------|---------|
| ESP32 Dev Board | 1 | Main microcontroller |
| MAX RS485 + NPK Sensor | 1 | Measures N, P, K levels in soil (Modbus RTU) |
| DHT22 Sensor | 1 | Temperature & humidity (more accurate than DHT11) |
| 4pin LDR Module | 1 | Light intensity detection |
| Capacitive Soil Moisture Sensors | 3 | Soil moisture per pot |
| 2x 4-channel 5V Relay Module | 2 | LOW-trigger relays for fan, pump, LED, valves |
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
VCC         -> 3.3V (or 5V depending on module)
GND         -> GND
RO (Receiver) -> GPIO 16 (RX2)
DI (Driver)   -> GPIO 17 (TX2)
DE/RE       -> GPIO 18  (IMPORTANT: This is GPIO 18, not 5!)
```

**Note:** From the working test code, the DE/RE pin is GPIO 18. Make sure to update this!

### DHT22 Sensor

```
DHT22      ESP32
-----      -----
VCC     -> 3.3V
DATA    -> GPIO 4
GND     -> GND
```

### LDR Module

```
LDR Module   ESP32
----------   -----
VCC       -> 3.3V
GND       -> GND
AO        -> GPIO 33
```

### Soil Moisture Sensors

```
Soil Sensor 1  ESP32
-------------  -----
VCC         -> 3.3V
GND         -> GND
AO          -> GPIO 36 (VP)

Soil Sensor 2  ESP32
-------------  -----
VCC         -> 3.3V
GND         -> GND
AO          -> GPIO 34

Soil Sensor 3  ESP32
-------------  -----
VCC         -> 3.3V
GND         -> GND
AO          -> GPIO 35
```

### Relay Module 1 (LOW-trigger)

```
Relay Module  ESP32
------------  -----
IN1 (LED)   -> GPIO 25
IN2 (Fan)   -> GPIO 26
IN3 (Pump)  -> GPIO 27
IN4 (NC)    -> -
VCC         -> 5V
GND         -> GND
```

### Relay Module 2 (LOW-trigger)

```
Relay Module  ESP32
------------  -----
IN1 (Valve1)-> GPIO 21
IN2 (Valve2)-> GPIO 22
IN3 (Valve3)-> GPIO 23
IN4 (NC)    -> -
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
5. **ArduinoJson** by Benoit Blanchon (v6.x) - for JSON parsing

### 2. Configure the Code

Open `ESP32_NPK_SENSOR/ESP32_NPK_SENSOR.ino` - WiFi and Firebase are already configured with your credentials:

```cpp
#define WIFI_SSID     "TP-Link_B03C"
#define WIFI_PASSWORD "PLDTWIFID@bu123"
#define API_KEY       "AIzaSyCbiFexrs6mspHzHiMA65VYOtMAqUF1T-c"
#define DATABASE_URL  "https://greenhouse-67568-default-rtdb.asia-southeast1.firebasedatabase.app/"
```

**Pin Configuration (from your working test):**
```cpp
#define RS485_DE_RE_PIN 18  // IMPORTANT: GPIO 18, not 5!
#define NPK_NITROGEN_REG    0x001E
#define NPK_PHOSPHORUS_REG  0x001F
#define NPK_POTASSIUM_REG   0x0020
```

### 3. Upload Code

1. Connect ESP32 via USB
2. Select board: **DOIT ESP32 DEVKIT V1** (or your board)
3. Select port: **COM port** (Windows) or `/dev/ttyUSB0` (Linux)
4. Click **Upload**

### 4. Open Serial Monitor

1. Set baud rate to **115200**
2. You should see:
```
=== ESP32 Greenhouse with NPK Sensor Started ===
WiFi connected. IP: 192.168.1.XXX
NPK Sensor initialized
NPK | N: 85 mg/kg, P: 32 mg/kg, K: 145 mg/kg
✓ Firebase pushed (with NPK)
```

### 5. Test NPK Readings

Wait for the NPK reading (every 10 seconds). You should see:
```
NPK | N: XX mg/kg, P: XX mg/kg, K: XX mg/kg
```

**If you see 0 values:**
- Check wiring (DE/RE is GPIO 18!)
- Verify A+ and B- are not swapped
- Check sensor power (some need 12V)

### 6. Calibrate Soil Moisture Sensors

1. Upload this test code to read raw values:
```cpp
void setup() {
  Serial.begin(115200);
}

void loop() {
  int dryValue = analogRead(36);  // Sensor in dry air
  int wetValue = analogRead(36);  // Sensor in water
  Serial.printf("Dry: %d, Wet: %d\n", dryValue, wetValue);
  delay(1000);
}
```

2. Update the `map()` function in the main code with your calibrated values:
```cpp
int percentage = map(rawValue, YOUR_DRY_VALUE, YOUR_WET_VALUE, 0, 100);
```

The code already uses your calibrated values:
```cpp
#define DRY_VALUE 3000
#define WET_VALUE 1300
```

### 7. Test in Firebase Console

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
