// ============================================================
//  ESP32 NPK Sensor + DHT22 + LDR + Soil Moisture + Firebase
//  Based on sketch_feb24b.ino with NPK sensor from npk_groq_test.ino
// ============================================================

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
#define DHTPIN         4
#define DHTTYPE        DHT22

#define SOIL1_PIN      36
#define SOIL2_PIN      34
#define SOIL3_PIN      35
#define LDR_PIN        33

#define LED_RELAY_PIN  25
#define FAN_RELAY_PIN  26
#define PUMP_RELAY_PIN 27
#define VALVE1_PIN     21
#define VALVE2_PIN     22
#define VALVE3_PIN     23

// NPK RS485 pins
#define RS485_TX_PIN   17
#define RS485_RX_PIN   16
#define RS485_DE_RE_PIN 18

#define DRY_VALUE 3000
#define WET_VALUE 1300

// ================= PLANT PROFILE =================
String selectedPlant = "lettuce";
int soilWaterThreshold = 35;

float fanTempOn  = 30.0;
float fanTempOff = 28.0;
float fanHumOn   = 80.0;
float fanHumOff  = 75.0;

int lightDarkEnter = 600;
int lightDarkExit  = 500;

unsigned long lastPlantPoll = 0;
const unsigned long PLANT_POLL_MS = 5000;

// ================= TIMING =================
const unsigned long SENSOR_INTERVAL_MS   = 2000;
const unsigned long FIREBASE_PUSH_MS     = 1000;
const unsigned long OVERRIDE_POLL_MS     = 500;
const unsigned long NPK_READ_INTERVAL_MS = 10000;

// ================= OBJECTS =================
DHT dht(DHTPIN, DHTTYPE);
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

HardwareSerial NPKSerial(2);

// ================= NPK SENSOR =================
struct NPKReading {
  int nitrogen = 0;
  int phosphorus = 0;
  int potassium = 0;
};

NPKReading npkData = {0, 0, 0};
unsigned long lastNPKRead = 0;

// Modbus RTU query — Read N, P, K (device ID: 0x01)
const byte NPK_QUERY[] = {0x01, 0x03, 0x00, 0x1E, 0x00, 0x03, 0x65, 0xCD};

// CRC16 Modbus
uint16_t calculateCRC(const byte* data, uint8_t len) {
  uint16_t crc = 0xFFFF;
  for (uint8_t i = 0; i < len; i++) {
    crc ^= data[i];
    for (uint8_t j = 0; j < 8; j++) {
      crc = (crc & 0x0001) ? (crc >> 1) ^ 0xA001 : crc >> 1;
    }
  }
  return crc;
}

// Send RS485 query
void sendQuery(const byte* query, uint8_t len) {
  digitalWrite(RS485_DE_RE_PIN, HIGH);
  delayMicroseconds(500);
  NPKSerial.write(query, len);
  NPKSerial.flush();
  delayMicroseconds(500);
  digitalWrite(RS485_DE_RE_PIN, LOW);
}

// Read NPK sensor
bool readNPKSensor() {
  while (NPKSerial.available()) NPKSerial.read();

  sendQuery(NPK_QUERY, sizeof(NPK_QUERY));
  delay(100);

  uint8_t response[11];
  uint8_t bytesRead = 0;
  unsigned long start = millis();

  while (bytesRead < 11 && millis() - start < 500) {
    if (NPKSerial.available()) response[bytesRead++] = NPKSerial.read();
  }

  if (bytesRead < 9) {
    Serial.println("[NPK ERROR] Incomplete response.");
    return false;
  }

  uint16_t receivedCRC   = (response[bytesRead-1] << 8) | response[bytesRead-2];
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

// ================= DATA =================
struct SensorData {
  float airTemp = NAN;
  float humidity = NAN;
  int soil1 = 0;
  int soil2 = 0;
  int soil3 = 0;
  int lightRaw = 0;
  
  // NPK data
  int npkNitrogen = 0;
  int npkPhosphorus = 0;
  int npkPotassium = 0;

  // auto outputs (before override)
  bool fan = false;
  bool pump = false;
  bool led = false;
  bool valve1 = false;
  bool valve2 = false;
  bool valve3 = false;

  // final outputs (after override)
  bool outFan = false;
  bool outPump = false;
  bool outLed = false;
  bool outValve1 = false;
  bool outValve2 = false;
  bool outValve3 = false;
};

SensorData data;

// ================= OVERRIDES =================
struct OverrideItem {
  String mode = "auto";
  bool value = false;
};

OverrideItem ovLed, ovFan, ovPump, ovV1, ovV2, ovV3;

// ================= HELPERS =================
int readSoilPct(int pin) {
  int raw = analogRead(pin);
  int pct = map(raw, DRY_VALUE, WET_VALUE, 0, 100);
  return constrain(pct, 0, 100);
}

void relayWrite(int pin, bool on) {
  digitalWrite(pin, on ? LOW : HIGH);
}

String controlBase(const char* name) {
  return String("/greenhouse/node1/controls/") + name;
}

bool readOverride(const char* name, OverrideItem &ov) {
  String modePath = controlBase(name) + "/mode";
  if (Firebase.RTDB.getString(&fbdo, modePath.c_str())) {
    String m = fbdo.stringData();
    m.toLowerCase();
    if (m == "auto" || m == "manual") ov.mode = m;
  }
  String valuePath = controlBase(name) + "/value";
  if (Firebase.RTDB.getBool(&fbdo, valuePath.c_str())) {
    ov.value = fbdo.boolData();
  }
  return true;
}

bool applyOverride(const OverrideItem &ov, bool autoValue) {
  if (ov.mode == "manual") return ov.value;
  return autoValue;
}

bool getIntPath(const String &path, int &out) {
  if (Firebase.RTDB.getInt(&fbdo, path.c_str())) {
    out = fbdo.intData();
    return true;
  }
  return false;
}

bool getFloatPath(const String &path, float &out) {
  if (Firebase.RTDB.getFloat(&fbdo, path.c_str())) {
    out = fbdo.floatData();
    return true;
  }
  return false;
}

bool getStringPath(const String &path, String &out) {
  if (Firebase.RTDB.getString(&fbdo, path.c_str())) {
    out = fbdo.stringData();
    return true;
  }
  return false;
}

void loadPlantProfileByKey(const String &plantKey) {
  String base = "/greenhouse/node1/plant/profiles/" + plantKey;

  getIntPath(base + "/soilWaterThreshold", soilWaterThreshold);

  getFloatPath(base + "/fanTempOn",  fanTempOn);
  getFloatPath(base + "/fanTempOff", fanTempOff);
  getFloatPath(base + "/fanHumOn",   fanHumOn);
  getFloatPath(base + "/fanHumOff",  fanHumOff);

  getIntPath(base + "/lightDarkEnter", lightDarkEnter);
  getIntPath(base + "/lightDarkExit",  lightDarkExit);

  Serial.printf("Plant=%s | soilTh=%d | fan(T %.1f/%.1f, H %.1f/%.1f) | light(%d/%d)\n",
    plantKey.c_str(),
    soilWaterThreshold,
    fanTempOn, fanTempOff,
    fanHumOn, fanHumOff,
    lightDarkEnter, lightDarkExit
  );
}

void pollPlantSelectionAndProfile() {
  String newPlant;
  if (getStringPath("/greenhouse/node1/plant/selected", newPlant)) {
    newPlant.toLowerCase();
    if (newPlant.length() > 0 && newPlant != selectedPlant) {
      selectedPlant = newPlant;
      loadPlantProfileByKey(selectedPlant);
    }
  }
}

// ================= FIREBASE PUSH =================
void pushToFirebase() {
  // Legacy path
  Firebase.RTDB.setFloat(&fbdo, "/greenhouse/node1/sensors/airTemp", data.airTemp);
  Firebase.RTDB.setFloat(&fbdo, "/greenhouse/node1/sensors/humidity", data.humidity);
  Firebase.RTDB.setInt(&fbdo, "/greenhouse/node1/sensors/soil1", data.soil1);
  Firebase.RTDB.setInt(&fbdo, "/greenhouse/node1/sensors/soil2", data.soil2);
  Firebase.RTDB.setInt(&fbdo, "/greenhouse/node1/sensors/soil3", data.soil3);
  Firebase.RTDB.setInt(&fbdo, "/greenhouse/node1/sensors/lightRaw", data.lightRaw);
  
  // NPK Data
  Firebase.RTDB.setInt(&fbdo, "/greenhouse/node1/sensors/npkNitrogen", data.npkNitrogen);
  Firebase.RTDB.setInt(&fbdo, "/greenhouse/node1/sensors/npkPhosphorus", data.npkPhosphorus);
  Firebase.RTDB.setInt(&fbdo, "/greenhouse/node1/sensors/npkPotassium", data.npkPotassium);
  
  // Mobile app structure
  Firebase.RTDB.setFloat(&fbdo, "/sensors/temperature", data.airTemp);
  Firebase.RTDB.setFloat(&fbdo, "/sensors/humidity", data.humidity);
  Firebase.RTDB.setInt(&fbdo, "/sensors/soilMoisture/pot1", data.soil1);
  Firebase.RTDB.setInt(&fbdo, "/sensors/soilMoisture/pot2", data.soil2);
  Firebase.RTDB.setInt(&fbdo, "/sensors/soilMoisture/pot3", data.soil3);
  
  // NPK for mobile app
  Firebase.RTDB.setInt(&fbdo, "/sensors/npk/pot1/nitrogen", data.npkNitrogen);
  Firebase.RTDB.setInt(&fbdo, "/sensors/npk/pot1/phosphorus", data.npkPhosphorus);
  Firebase.RTDB.setInt(&fbdo, "/sensors/npk/pot1/potassium", data.npkPotassium);
  Firebase.RTDB.setInt(&fbdo, "/sensors/npk/pot2/nitrogen", data.npkNitrogen);
  Firebase.RTDB.setInt(&fbdo, "/sensors/npk/pot2/phosphorus", data.npkPhosphorus);
  Firebase.RTDB.setInt(&fbdo, "/sensors/npk/pot2/potassium", data.npkPotassium);
  Firebase.RTDB.setInt(&fbdo, "/sensors/npk/pot3/nitrogen", data.npkNitrogen);
  Firebase.RTDB.setInt(&fbdo, "/sensors/npk/pot3/phosphorus", data.npkPhosphorus);
  Firebase.RTDB.setInt(&fbdo, "/sensors/npk/pot3/potassium", data.npkPotassium);
  
  Firebase.RTDB.setInt(&fbdo, "/sensors/timestamp", millis());
  
  // Actuators
  Firebase.RTDB.setBool(&fbdo, "/greenhouse/node1/actuators/fan", data.outFan);
  Firebase.RTDB.setBool(&fbdo, "/greenhouse/node1/actuators/pump", data.outPump);
  Firebase.RTDB.setBool(&fbdo, "/greenhouse/node1/actuators/led", data.outLed);
  Firebase.RTDB.setBool(&fbdo, "/greenhouse/node1/actuators/valve1", data.outValve1);
  Firebase.RTDB.setBool(&fbdo, "/greenhouse/node1/actuators/valve2", data.outValve2);
  Firebase.RTDB.setBool(&fbdo, "/greenhouse/node1/actuators/valve3", data.outValve3);
  
  Firebase.RTDB.setBool(&fbdo, "/actuators/fan", data.outFan);
  Firebase.RTDB.setBool(&fbdo, "/actuators/pump", data.outPump);
  Firebase.RTDB.setBool(&fbdo, "/actuators/ledLight", data.outLed);
  
  // System
  Firebase.RTDB.setInt(&fbdo, "/greenhouse/node1/system/lastSeenMs", (int)millis());
  Firebase.RTDB.setInt(&fbdo, "/greenhouse/node1/system/lastPushMs", (int)millis());
  
  Serial.println("Firebase pushed (with NPK)");
}

// ================= SETUP =================
void setupPins() {
  pinMode(LED_RELAY_PIN, OUTPUT);
  pinMode(FAN_RELAY_PIN, OUTPUT);
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(VALVE1_PIN, OUTPUT);
  pinMode(VALVE2_PIN, OUTPUT);
  pinMode(VALVE3_PIN, OUTPUT);
  pinMode(RS485_DE_RE_PIN, OUTPUT);
  digitalWrite(RS485_DE_RE_PIN, LOW);

  digitalWrite(LED_RELAY_PIN, HIGH);
  digitalWrite(FAN_RELAY_PIN, HIGH);
  digitalWrite(PUMP_RELAY_PIN, HIGH);
  digitalWrite(VALVE1_PIN, HIGH);
  digitalWrite(VALVE2_PIN, HIGH);
  digitalWrite(VALVE3_PIN, HIGH);

  analogReadResolution(12);
  analogSetPinAttenuation(SOIL1_PIN, ADC_11db);
  analogSetPinAttenuation(SOIL2_PIN, ADC_11db);
  analogSetPinAttenuation(SOIL3_PIN, ADC_11db);
  analogSetPinAttenuation(LDR_PIN,   ADC_11db);
}

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

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  Serial.println("Firebase signup...");
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase signUp OK");
  } else {
    Serial.printf("Firebase signUp FAILED: %s\n",
      config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("Waiting for Firebase token...");
  while (!Firebase.ready()) {
    delay(100);
  }
  Serial.println("Firebase Ready");
  
  if (Firebase.ready()) {
    String initPlant;
    if (getStringPath("/greenhouse/node1/plant/selected", initPlant) && initPlant.length() > 0) {
      selectedPlant = initPlant;
    }
    loadPlantProfileByKey(selectedPlant);
  }
}

void setup() {
  Serial.begin(115200);

  setupPins();
  dht.begin();
  
  // Initialize RS485 for NPK sensor
  NPKSerial.begin(4800, SERIAL_8N1, RS485_RX_PIN, RS485_TX_PIN);
  pinMode(RS485_DE_RE_PIN, OUTPUT);
  digitalWrite(RS485_DE_RE_PIN, LOW);
  
  Serial.println("NPK Sensor initialized");
  setupWiFiFirebase();
  
  Serial.println("=== ESP32 Greenhouse with NPK Sensor Started ===");
}

// ================= MAIN LOOP =================
unsigned long lastSensor = 0;
unsigned long lastPush = 0;
unsigned long lastOverridePoll = 0;

void loop() {
  unsigned long now = millis();

  if (Firebase.ready() && now - lastPlantPoll >= PLANT_POLL_MS) {
    pollPlantSelectionAndProfile();
    lastPlantPoll = now;
  }

  if (Firebase.ready() && now - lastOverridePoll >= OVERRIDE_POLL_MS) {
    readOverride("led", ovLed);
    readOverride("fan", ovFan);
    readOverride("pump", ovPump);
    readOverride("valve1", ovV1);
    readOverride("valve2", ovV2);
    readOverride("valve3", ovV3);

    lastOverridePoll = now;

    Serial.printf("Overrides | led:%s fan:%s pump:%s v1:%s v2:%s v3:%s\n",
      ovLed.mode.c_str(), ovFan.mode.c_str(), ovPump.mode.c_str(),
      ovV1.mode.c_str(), ovV2.mode.c_str(), ovV3.mode.c_str());
  }

  if (now - lastSensor >= SENSOR_INTERVAL_MS) {
    lastSensor = now;

    data.lightRaw = analogRead(LDR_PIN);

    data.airTemp  = dht.readTemperature();
    data.humidity = dht.readHumidity();

    data.soil1 = readSoilPct(SOIL1_PIN);
    data.soil2 = readSoilPct(SOIL2_PIN);
    data.soil3 = readSoilPct(SOIL3_PIN);
    
    // Read NPK sensor every 10 seconds
    if (now - lastNPKRead >= NPK_READ_INTERVAL_MS) {
      if (readNPKSensor()) {
        data.npkNitrogen = npkData.nitrogen;
        data.npkPhosphorus = npkData.phosphorus;
        data.npkPotassium = npkData.potassium;
        Serial.printf("NPK | N: %d mg/kg, P: %d mg/kg, K: %d mg/kg\n", 
          data.npkNitrogen, data.npkPhosphorus, data.npkPotassium);
      } else {
        Serial.println("NPK | Failed to read sensor");
      }
      lastNPKRead = now;
    }

    static bool fanState = false;
    if (isnan(data.airTemp) || isnan(data.humidity)) {
      fanState = false;
    } else {
      if (fanState) {
        if (data.airTemp <= fanTempOff && data.humidity <= fanHumOff) {
          fanState = false;
        }
      } else {
        if (data.airTemp >= fanTempOn || data.humidity >= fanHumOn) {
          fanState = true;
        }
      }
    }
    data.fan = fanState;

    data.valve1 = data.soil1 < soilWaterThreshold;
    data.valve2 = data.soil2 < soilWaterThreshold;
    data.valve3 = data.soil3 < soilWaterThreshold;

    data.pump = data.valve1 || data.valve2 || data.valve3;

    static bool ledState = false;
    if (ledState) {
      if (data.lightRaw < lightDarkExit) ledState = false;
    } else {
      if (data.lightRaw > lightDarkEnter) ledState = true;
    }
    data.led = ledState;

    data.outLed    = applyOverride(ovLed, data.led);
    data.outFan    = applyOverride(ovFan, data.fan);

    bool pumpFinal = applyOverride(ovPump, data.pump);

    bool v1Final = applyOverride(ovV1, data.valve1);
    bool v2Final = applyOverride(ovV2, data.valve2);
    bool v3Final = applyOverride(ovV3, data.valve3);

    if (ovPump.mode == "manual" && ovPump.value == true) {
      if (ovV1.mode == "auto") v1Final = true;
      if (ovV2.mode == "auto") v2Final = true;
      if (ovV3.mode == "auto") v3Final = true;
    }

    data.outValve1 = v1Final;
    data.outValve2 = v2Final;
    data.outValve3 = v3Final;

    if (ovPump.mode == "auto") {
      data.outPump = data.outValve1 || data.outValve2 || data.outValve3;
    } else {
      data.outPump = pumpFinal;
    }

    relayWrite(LED_RELAY_PIN,  data.outLed);
    relayWrite(FAN_RELAY_PIN,  data.outFan);
    relayWrite(PUMP_RELAY_PIN, data.outPump);
    relayWrite(VALVE1_PIN,     data.outValve1);
    relayWrite(VALVE2_PIN,     data.outValve2);
    relayWrite(VALVE3_PIN,     data.outValve3);

    Serial.printf("Temp: %.1f C | Hum: %.1f %%\n", data.airTemp, data.humidity);
    Serial.printf("Soil: %d %d %d | LightRaw: %d\n", data.soil1, data.soil2, data.soil3, data.lightRaw);
    Serial.printf("AUTO  led:%d fan:%d pump:%d v1:%d v2:%d v3:%d\n",
      data.led, data.fan, data.pump, data.valve1, data.valve2, data.valve3);
    Serial.printf("FINAL led:%d fan:%d pump:%d v1:%d v2:%d v3:%d\n\n",
      data.outLed, data.outFan, data.outPump, data.outValve1, data.outValve2, data.outValve3);
    Serial.printf("FanState=%d | T=%.1f H=%.1f | T_ON=%.1f H_ON=%.1f\n",
              fanState,
              data.airTemp,
              data.humidity,
              fanTempOn,
              fanHumOn);
  }

  if (Firebase.ready() && now - lastPush >= FIREBASE_PUSH_MS) {
    pushToFirebase();
    lastPush = now;
  }
}
