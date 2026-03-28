#include <WiFi.h>
#include <DHT.h>
#include <Firebase_ESP_Client.h>
#include <ArduinoJson.h>

// ================= WIFI + FIREBASE =================
#define WIFI_SSID     "TP-Link_B03C"
#define WIFI_PASSWORD "PLDTWIFID@bu123"
#define API_KEY       "AIzaSyCbiFexrs6mspHzHiMA65VYOtMAqUF1T-c"
#define DATABASE_URL  "https://greenhouse-67568-default-rtdb.asia-southeast1.firebasedatabase.app/"

// ================= PIN DEFINITIONS =================
#define DHTPIN          4
#define DHTTYPE         DHT22
#define SOIL1_PIN       36
#define SOIL2_PIN       34
#define SOIL3_PIN       35
#define LDR_PIN         33
#define LED_RELAY_PIN   25
#define FAN_RELAY_PIN   26
#define PUMP_RELAY_PIN  27
#define VALVE1_PIN      21
#define VALVE2_PIN      22
#define VALVE3_PIN      23
#define RS485_TX_PIN    17
#define RS485_RX_PIN    16
#define RS485_DE_RE_PIN 18
#define DRY_VALUE       3000
#define WET_VALUE       1300

// ================= TIMING =================
const unsigned long SENSOR_INTERVAL_MS   = 2000;
const unsigned long FIREBASE_PUSH_MS     = 5000;  // Push every 5 seconds
const unsigned long NPK_READ_INTERVAL_MS = 10000;
const unsigned long PLANT_POLL_MS        = 5000;
const unsigned long MODE_POLL_MS         = 500;  // Check manual/auto mode

// ================= PLANT PROFILE =================
String selectedPlant      = "lettuce";
int    soilWaterThreshold = 35;
float  fanTempOn          = 30.0;
float  fanTempOff         = 28.0;
float  fanHumOn           = 80.0;
float  fanHumOff          = 75.0;
int    lightDarkEnter     = 600;
int    lightDarkExit      = 500;

// ================= CONTROL MODE =================
bool isAutoMode   = true;   // true = auto, false = manual
bool manualFan    = false;  // Manual fan state (from app)
bool manualPump   = false;  // Manual pump state (from app)
bool manualLed    = false;  // Manual LED state (from app)

// ================= STRUCTS (declared before all functions) =================

struct SensorData {
  float airTemp       = NAN;
  float humidity      = NAN;
  int   soil1         = 0;
  int   soil2         = 0;
  int   soil3         = 0;
  int   lightRaw      = 0;
  int   npkNitrogen   = 0;
  int   npkPhosphorus = 0;
  int   npkPotassium  = 0;
  bool  fan     = false;
  bool  pump    = false;
  bool  led     = false;
  bool  valve1  = false;
  bool  valve2  = false;
  bool  valve3  = false;
  bool  outFan    = false;
  bool  outPump   = false;
  bool  outLed    = false;
  bool  outValve1 = false;
  bool  outValve2 = false;
  bool  outValve3 = false;
};

struct NPKReading {
  int nitrogen   = 0;
  int phosphorus = 0;
  int potassium  = 0;
};

// ================= GLOBAL VARIABLES =================

SensorData   data;
NPKReading   npkData;

DHT            dht(DHTPIN, DHTTYPE);
FirebaseData   fbdo;
FirebaseAuth   auth;
FirebaseConfig config;
HardwareSerial NPKSerial(2);

unsigned long lastNPKRead      = 0;
unsigned long lastSensor       = 0;
unsigned long lastPush         = 0;
unsigned long lastPlantPoll    = 0;
unsigned long lastModePoll     = 0;

const byte NPK_QUERY[] = {0x01, 0x03, 0x00, 0x1E, 0x00, 0x03, 0x65, 0xCD};

// ================= NPK FUNCTIONS =================

uint16_t calculateCRC(const byte* buf, uint8_t len) {
  uint16_t crc = 0xFFFF;
  for (uint8_t i = 0; i < len; i++) {
    crc ^= buf[i];
    for (uint8_t j = 0; j < 8; j++) {
      crc = (crc & 0x0001) ? (crc >> 1) ^ 0xA001 : crc >> 1;
    }
  }
  return crc;
}

void sendQuery(const byte* query, uint8_t len) {
  digitalWrite(RS485_DE_RE_PIN, HIGH);
  delayMicroseconds(500);
  NPKSerial.write(query, len);
  NPKSerial.flush();
  delayMicroseconds(500);
  digitalWrite(RS485_DE_RE_PIN, LOW);
}

bool readNPKSensor() {
  while (NPKSerial.available()) NPKSerial.read();
  sendQuery(NPK_QUERY, sizeof(NPK_QUERY));
  delay(100);

  uint8_t       response[11];
  uint8_t       bytesRead = 0;
  unsigned long start     = millis();

  while (bytesRead < 11 && millis() - start < 500) {
    if (NPKSerial.available()) response[bytesRead++] = NPKSerial.read();
  }

  if (bytesRead < 9) {
    Serial.println("[NPK ERROR] Incomplete response.");
    return false;
  }

  uint16_t receivedCRC   = (response[bytesRead - 1] << 8) | response[bytesRead - 2];
  uint16_t calculatedCRC = calculateCRC(response, bytesRead - 2);
  if (receivedCRC != calculatedCRC) {
    Serial.printf("[NPK ERROR] CRC mismatch. Got:0x%04X Expected:0x%04X\n",
                  receivedCRC, calculatedCRC);
    return false;
  }

  npkData.nitrogen   = (response[3] << 8) | response[4];
  npkData.phosphorus = (response[5] << 8) | response[6];
  npkData.potassium  = (response[7] << 8) | response[8];
  return true;
}

// ================= HELPER FUNCTIONS =================

int readSoilPct(int pin) {
  int raw = analogRead(pin);
  int pct = map(raw, DRY_VALUE, WET_VALUE, 0, 100);
  return constrain(pct, 0, 100);
}

void relayWrite(int pin, bool on) {
  digitalWrite(pin, on ? LOW : HIGH);
}

// ================= FIREBASE HELPERS =================

bool getIntPath(const String& path, int& out) {
  if (Firebase.RTDB.getInt(&fbdo, path.c_str())) {
    out = fbdo.intData();
    return true;
  }
  return false;
}

bool getFloatPath(const String& path, float& out) {
  if (Firebase.RTDB.getFloat(&fbdo, path.c_str())) {
    out = fbdo.floatData();
    return true;
  }
  return false;
}

bool getStringPath(const String& path, String& out) {
  if (Firebase.RTDB.getString(&fbdo, path.c_str())) {
    out = fbdo.stringData();
    return true;
  }
  return false;
}

// ================= CONTROL MODE =================

void readControlMode() {
  // Read auto/manual mode
  if (Firebase.RTDB.getBool(&fbdo, "/controlMode/isAuto")) {
    isAutoMode = fbdo.boolData();
  }
  
  // If in manual mode, read actuator states from app
  if (!isAutoMode) {
    if (Firebase.RTDB.getBool(&fbdo, "/actuators/fan")) {
      manualFan = fbdo.boolData();
    }
    if (Firebase.RTDB.getBool(&fbdo, "/actuators/pump")) {
      manualPump = fbdo.boolData();
    }
    if (Firebase.RTDB.getBool(&fbdo, "/actuators/ledLight")) {
      manualLed = fbdo.boolData();
    }
  }
}

// ================= PLANT PROFILE FUNCTIONS =================

void loadPlantProfileByKey(const String& plantKey) {
  String base = "/plant/profiles/" + plantKey;
  getIntPath(base   + "/soilWaterThreshold", soilWaterThreshold);
  getFloatPath(base + "/fanTempOn",          fanTempOn);
  getFloatPath(base + "/fanTempOff",         fanTempOff);
  getFloatPath(base + "/fanHumOn",           fanHumOn);
  getFloatPath(base + "/fanHumOff",          fanHumOff);
  getIntPath(base   + "/lightDarkEnter",     lightDarkEnter);
  getIntPath(base   + "/lightDarkExit",      lightDarkExit);

  Serial.printf("Plant=%s soilTh=%d fan(T%.1f/%.1f H%.1f/%.1f) light(%d/%d)\n",
    plantKey.c_str(), soilWaterThreshold,
    fanTempOn, fanTempOff, fanHumOn, fanHumOff,
    lightDarkEnter, lightDarkExit);
}

void pollPlantSelectionAndProfile() {
  String newPlant;
  if (getStringPath("/settings/selectedPlant", newPlant)) {
    newPlant.toLowerCase();
    if (newPlant.length() > 0 && newPlant != selectedPlant) {
      selectedPlant = newPlant;
      loadPlantProfileByKey(selectedPlant);
    }
  }
}

// ================= FIREBASE PUSH =================

void pushToFirebase() {
  // Batch all sensor data into single JSON object
  StaticJsonDocument<512> sensorDoc;
  sensorDoc["temperature"] = data.airTemp;
  sensorDoc["humidity"] = data.humidity;
  sensorDoc["timestamp"] = (int)millis();
  
  // Soil moisture
  JsonObject soilMoisture = sensorDoc.createNestedObject("soilMoisture");
  soilMoisture["pot1"] = data.soil1;
  soilMoisture["pot2"] = data.soil2;
  soilMoisture["pot3"] = data.soil3;
  
  // NPK data
  JsonObject npk = sensorDoc.createNestedObject("npk");
  
  JsonObject pot1 = npk.createNestedObject("pot1");
  pot1["nitrogen"] = data.npkNitrogen;
  pot1["phosphorus"] = data.npkPhosphorus;
  pot1["potassium"] = data.npkPotassium;
  
  JsonObject pot2 = npk.createNestedObject("pot2");
  pot2["nitrogen"] = data.npkNitrogen;
  pot2["phosphorus"] = data.npkPhosphorus;
  pot2["potassium"] = data.npkPotassium;
  
  JsonObject pot3 = npk.createNestedObject("pot3");
  pot3["nitrogen"] = data.npkNitrogen;
  pot3["phosphorus"] = data.npkPhosphorus;
  pot3["potassium"] = data.npkPotassium;
  
  // Push sensors in single call
  Firebase.RTDB.setJSON(&fbdo, "/sensors", &sensorDoc);
  
  // Push actuators only in auto mode
  if (isAutoMode) {
    StaticJsonDocument<128> actuatorDoc;
    actuatorDoc["fan"] = data.outFan;
    actuatorDoc["pump"] = data.outPump;
    actuatorDoc["ledLight"] = data.outLed;
    
    Firebase.RTDB.setJSON(&fbdo, "/actuators", &actuatorDoc);
  }
  
  Serial.println("Firebase pushed (batched JSON).");
}

// ================= PIN SETUP =================

void setupPins() {
  pinMode(LED_RELAY_PIN,  OUTPUT); digitalWrite(LED_RELAY_PIN,  HIGH);
  pinMode(FAN_RELAY_PIN,  OUTPUT); digitalWrite(FAN_RELAY_PIN,  HIGH);
  pinMode(PUMP_RELAY_PIN, OUTPUT); digitalWrite(PUMP_RELAY_PIN, HIGH);
  pinMode(VALVE1_PIN,     OUTPUT); digitalWrite(VALVE1_PIN,     HIGH);
  pinMode(VALVE2_PIN,     OUTPUT); digitalWrite(VALVE2_PIN,     HIGH);
  pinMode(VALVE3_PIN,     OUTPUT); digitalWrite(VALVE3_PIN,     HIGH);

  analogReadResolution(12);
  analogSetPinAttenuation(SOIL1_PIN, ADC_11db);
  analogSetPinAttenuation(SOIL2_PIN, ADC_11db);
  analogSetPinAttenuation(SOIL3_PIN, ADC_11db);
  analogSetPinAttenuation(LDR_PIN,   ADC_11db);
}

// ================= WIFI + FIREBASE SETUP =================

void setupWiFiFirebase() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(400);
  }
  Serial.println();
  Serial.print("WiFi connected. IP: ");
  Serial.println(WiFi.localIP());

  config.api_key      = API_KEY;
  config.database_url = DATABASE_URL;

  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase signUp OK");
  } else {
    Serial.printf("Firebase signUp FAILED: %s\n",
      config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("Waiting for Firebase token...");
  while (!Firebase.ready()) delay(100);
  Serial.println("Firebase Ready");

  String initPlant;
  if (getStringPath("/settings/selectedPlant", initPlant) && initPlant.length() > 0) {
    selectedPlant = initPlant;
  }
  loadPlantProfileByKey(selectedPlant);
}

// ================= SETUP =================

void setup() {
  Serial.begin(115200);
  setupPins();
  dht.begin();

  NPKSerial.begin(4800, SERIAL_8N1, RS485_RX_PIN, RS485_TX_PIN);
  pinMode(RS485_DE_RE_PIN, OUTPUT);
  digitalWrite(RS485_DE_RE_PIN, LOW);
  Serial.println("NPK Sensor initialized");

  setupWiFiFirebase();
  Serial.println("=== ESP32 Greenhouse Started ===");
}

// ================= LOOP =================

void loop() {
  unsigned long now = millis();

  // Poll plant selection
  if (Firebase.ready() && now - lastPlantPoll >= PLANT_POLL_MS) {
    pollPlantSelectionAndProfile();
    lastPlantPoll = now;
  }

  // Poll control mode (auto/manual)
  if (Firebase.ready() && now - lastModePoll >= MODE_POLL_MS) {
    readControlMode();
    lastModePoll = now;
    Serial.printf("Mode: %s | Manual: fan=%d pump=%d led=%d\n",
      isAutoMode ? "AUTO" : "MANUAL", manualFan, manualPump, manualLed);
  }

  // Read sensors + auto logic
  if (now - lastSensor >= SENSOR_INTERVAL_MS) {
    lastSensor = now;

    data.lightRaw = analogRead(LDR_PIN);
    data.airTemp  = dht.readTemperature();
    data.humidity = dht.readHumidity();
    data.soil1    = readSoilPct(SOIL1_PIN);
    data.soil2    = readSoilPct(SOIL2_PIN);
    data.soil3    = readSoilPct(SOIL3_PIN);

    // NPK every 10s
    if (now - lastNPKRead >= NPK_READ_INTERVAL_MS) {
      if (readNPKSensor()) {
        data.npkNitrogen   = npkData.nitrogen;
        data.npkPhosphorus = npkData.phosphorus;
        data.npkPotassium  = npkData.potassium;
        Serial.printf("NPK | N:%d P:%d K:%d mg/kg\n",
          data.npkNitrogen, data.npkPhosphorus, data.npkPotassium);
      } else {
        Serial.println("NPK | Failed to read sensor");
      }
      lastNPKRead = now;
    }

    // AUTO MODE: Calculate based on sensors
    if (isAutoMode) {
      // Fan hysteresis
      static bool fanState = false;
      if (isnan(data.airTemp) || isnan(data.humidity)) {
        fanState = false;
      } else {
        if (fanState) {
          if (data.airTemp <= fanTempOff && data.humidity <= fanHumOff) fanState = false;
        } else {
          if (data.airTemp >= fanTempOn  || data.humidity >= fanHumOn)  fanState = true;
        }
      }
      data.fan = fanState;

      // Valves + pump
      data.valve1 = data.soil1 < soilWaterThreshold;
      data.valve2 = data.soil2 < soilWaterThreshold;
      data.valve3 = data.soil3 < soilWaterThreshold;
      data.pump   = data.valve1 || data.valve2 || data.valve3;

      // LED hysteresis
      static bool ledState = false;
      if (ledState) {
        if (data.lightRaw < lightDarkExit)  ledState = false;
      } else {
        if (data.lightRaw > lightDarkEnter) ledState = true;
      }
      data.led = ledState;

      // Use auto values
      data.outFan  = data.fan;
      data.outPump = data.pump;
      data.outLed  = data.led;
    } 
    // MANUAL MODE: Use values from app
    else {
      data.outFan  = manualFan;
      data.outPump = manualPump;
      data.outLed  = manualLed;
      data.valve1  = false;  // Valves off in manual
      data.valve2  = false;
      data.valve3  = false;
    }

    data.outValve1 = data.valve1;
    data.outValve2 = data.valve2;
    data.outValve3 = data.valve3;

    // Drive relays
    relayWrite(LED_RELAY_PIN,  data.outLed);
    relayWrite(FAN_RELAY_PIN,  data.outFan);
    relayWrite(PUMP_RELAY_PIN, data.outPump);
    relayWrite(VALVE1_PIN,     data.outValve1);
    relayWrite(VALVE2_PIN,     data.outValve2);
    relayWrite(VALVE3_PIN,     data.outValve3);

    // Debug output
    Serial.printf("Temp:%.1fC Hum:%.1f%% Soil:%d/%d/%d Light:%d\n",
      data.airTemp, data.humidity,
      data.soil1, data.soil2, data.soil3, data.lightRaw);
    Serial.printf("AUTO   fan:%d pump:%d led:%d v1:%d v2:%d v3:%d\n",
      data.fan, data.pump, data.led,
      data.valve1, data.valve2, data.valve3);
    Serial.printf("FINAL  fan:%d pump:%d led:%d v1:%d v2:%d v3:%d\n\n",
      data.outFan, data.outPump, data.outLed,
      data.outValve1, data.outValve2, data.outValve3);
  }

  // Push to Firebase
  if (Firebase.ready() && now - lastPush >= FIREBASE_PUSH_MS) {
    pushToFirebase();
    lastPush = now;
  }
}
