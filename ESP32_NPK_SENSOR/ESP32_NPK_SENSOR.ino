/*
 * ESP32 NPK Sensor + DHT11 + Soil Moisture + Firebase
 * ====================================================
 * This code reads NPK (Nitrogen, Phosphorus, Potassium) sensor data
 * along with DHT11 temperature/humidity and soil moisture sensors,
 * then sends everything to Firebase Realtime Database.
 * 
 * Hardware Required:
 * - ESP32 Dev Board
 * - DHT11/DHT22 Temperature & Humidity Sensor
 * - RS485 NPK Sensor (Modbus RTU)
 * - Capacitive Soil Moisture Sensors (x3)
 * - Relay Module (for fan, pump, LED)
 * 
 * Libraries Required (install via Arduino Library Manager):
 * - Firebase-ESP32 by Mobizt (v3.5.5 or later)
 * - DHT sensor library by Adafruit
 * - Adafruit Unified Sensor
 * - ModbusMaster (for RS485 NPK sensor)
 */

#include <WiFi.h>
#include <Firebase_ESP32.h>
#include <DHT.h>
#include <ModbusMaster.h>

// ====================== CONFIGURATION ======================

// WiFi credentials
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase credentials
#define FIREBASE_HOST "greenhouse-67568-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "YOUR_FIREBASE_DATABASE_SECRET"  // Get from Firebase Console > Project Settings > Service Accounts

// DHT Sensor Setup
#define DHTPIN 4
#define DHTTYPE DHT11  // or DHT22 for better accuracy
DHT dht(DHTPIN, DHTTYPE);

// Soil Moisture Sensors (ADC pins)
#define SOIL_PIN_POT1 34
#define SOIL_PIN_POT2 35
#define SOIL_PIN_POT3 32

// RS485 NPK Sensor Setup (Modbus RTU)
#define RS485_TX_PIN 17
#define RS485_RX_PIN 16
#define RS485_DE_RE_PIN 5  // Driver Enable / Receiver Enable pin
ModbusMaster node;

// Relay pins for actuators
#define FAN_PIN 26
#define PUMP_PIN 25
#define LED_PIN 27

// Firebase objects
FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;

// Timing
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL = 5000;  // Read sensors every 5 seconds

// ====================== NPK SENSOR FUNCTIONS ======================

// RS485 transceiver control callback
void preTransmission() {
  digitalWrite(RS485_DE_RE_PIN, 1);
}

void postTransmission() {
  digitalWrite(RS485_DE_RE_PIN, 0);
}

// NPK Sensor Modbus registers (typical addresses for common NPK sensors)
// Note: Register addresses may vary by manufacturer. Check your sensor's datasheet.
#define NPK_NITROGEN_REG    0x0000  // Nitrogen value register
#define NPK_PHOSPHORUS_REG  0x0001  // Phosphorus value register
#define NPK_POTASSIUM_REG   0x0002  // Potassium value register

// Slave ID of your NPK sensor (commonly 1, but check your sensor's manual)
#define NPK_SLAVE_ID 1

struct NPKReading {
  int nitrogen;
  int phosphorus;
  int potassium;
};

NPKReading readNPKSensor() {
  NPKReading npk = {0, 0, 0};
  uint8_t result;
  
  // Read Nitrogen
  result = node.readInputRegisters(NPK_NITROGEN_REG, 1);
  if (result == node.ku8MBSuccess) {
    npk.nitrogen = node.getResponseBuffer(0);
  }
  delay(100);
  
  // Read Phosphorus
  result = node.readInputRegisters(NPK_PHOSPHORUS_REG, 1);
  if (result == node.ku8MBSuccess) {
    npk.phosphorus = node.getResponseBuffer(0);
  }
  delay(100);
  
  // Read Potassium
  result = node.readInputRegisters(NPK_POTASSIUM_REG, 1);
  if (result == node.ku8MBSuccess) {
    npk.potassium = node.getResponseBuffer(0);
  }
  
  return npk;
}

// ====================== SENSOR FUNCTIONS ======================

float readTemperature() {
  return dht.readTemperature();
}

float readHumidity() {
  return dht.readHumidity();
}

int readSoilMoisture(int pin) {
  int rawValue = analogRead(pin);
  // Convert to percentage (calibrate based on your sensor)
  // Typical values: 4095 (dry air) to ~1500 (in water)
  int percentage = map(rawValue, 4095, 1500, 0, 100);
  return constrain(percentage, 0, 100);
}

// ====================== FIREBASE FUNCTIONS ======================

void sendToFirebase(float temperature, float humidity, 
                    int soil1, int soil2, int soil3,
                    NPKReading npk) {
  // Send temperature
  if (Firebase.setFloat(firebaseData, "/sensors/temperature", temperature)) {
    Serial.println("✓ Temperature sent");
  } else {
    Serial.println("✗ Temperature failed: " + firebaseData.errorReason());
  }
  
  // Send humidity
  if (Firebase.setFloat(firebaseData, "/sensors/humidity", humidity)) {
    Serial.println("✓ Humidity sent");
  } else {
    Serial.println("✗ Humidity failed: " + firebaseData.errorReason());
  }
  
  // Send soil moisture for each pot
  if (Firebase.setInt(firebaseData, "/sensors/soilMoisture/pot1", soil1)) {
    Serial.println("✓ Soil Pot1 sent");
  }
  if (Firebase.setInt(firebaseData, "/sensors/soilMoisture/pot2", soil2)) {
    Serial.println("✓ Soil Pot2 sent");
  }
  if (Firebase.setInt(firebaseData, "/sensors/soilMoisture/pot3", soil3)) {
    Serial.println("✓ Soil Pot3 sent");
  }
  
  // Send NPK data for each pot (assuming same NPK reading for all pots)
  // If you have separate NPK sensors per pot, adjust accordingly
  if (Firebase.setInt(firebaseData, "/sensors/npk/pot1/nitrogen", npk.nitrogen)) {
    Serial.println("✓ NPK Pot1 Nitrogen sent");
  }
  if (Firebase.setInt(firebaseData, "/sensors/npk/pot1/phosphorus", npk.phosphorus)) {
    Serial.println("✓ NPK Pot1 Phosphorus sent");
  }
  if (Firebase.setInt(firebaseData, "/sensors/npk/pot1/potassium", npk.potassium)) {
    Serial.println("✓ NPK Pot1 Potassium sent");
  }
  
  // Copy same NPK to pot2 and pot3 (or use separate sensors if available)
  Firebase.setInt(firebaseData, "/sensors/npk/pot2/nitrogen", npk.nitrogen);
  Firebase.setInt(firebaseData, "/sensors/npk/pot2/phosphorus", npk.phosphorus);
  Firebase.setInt(firebaseData, "/sensors/npk/pot2/potassium", npk.potassium);
  
  Firebase.setInt(firebaseData, "/sensors/npk/pot3/nitrogen", npk.nitrogen);
  Firebase.setInt(firebaseData, "/sensors/npk/pot3/phosphorus", npk.phosphorus);
  Firebase.setInt(firebaseData, "/sensors/npk/pot3/potassium", npk.potassium);
  
  // Send timestamp
  if (Firebase.setInt(firebaseData, "/sensors/timestamp", millis())) {
    Serial.println("✓ Timestamp sent");
  }
}

// ====================== ACTUATOR CONTROL ======================

void updateActuators() {
  // Read actuator states from Firebase and control relays
  int fanState = 0, pumpState = 0, ledState = 0;
  
  if (Firebase.getInt(firebaseData, "/actuators/fan")) {
    fanState = firebaseData.intData();
    digitalWrite(FAN_PIN, fanState ? HIGH : LOW);
  }
  
  if (Firebase.getInt(firebaseData, "/actuators/pump")) {
    pumpState = firebaseData.intData();
    digitalWrite(PUMP_PIN, pumpState ? HIGH : LOW);
  }
  
  if (Firebase.getInt(firebaseData, "/actuators/ledLight")) {
    ledState = firebaseData.intData();
    digitalWrite(LED_PIN, ledState ? HIGH : LOW);
  }
  
  if (fanState || pumpState || ledState) {
    Serial.println("✓ Actuators updated");
  }
}

// ====================== SETUP ======================

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
  
  // Initialize RS485 for NPK sensor
  pinMode(RS485_DE_RE_PIN, OUTPUT);
  digitalWrite(RS485_DE_RE_PIN, LOW);  // Start in receive mode
  Serial2.begin(4800, SERIAL_8N1, RS485_RX_PIN, RS485_TX_PIN);  // Common baud rate for NPK sensors
  node.begin(1, Serial2);  // Modbus slave ID = 1
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);
  
  Serial.println("NPK Sensor initialized");
  
  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\n✓ Connected to WiFi");
  Serial.println("IP address: " + WiFi.localIP().toString());
  
  // Setup Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  Serial.println("✓ Firebase connected");
}

// ====================== LOOP ======================

void loop() {
  // Read sensors every 5 seconds
  if (millis() - lastReadTime > READ_INTERVAL) {
    Serial.println("\n--- Reading Sensors ---");
    
    // Read DHT11
    float temperature = readTemperature();
    float humidity = readHumidity();
    
    // Check for valid readings
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("✗ Failed to read DHT sensor");
      temperature = 25.0;  // Default value
      humidity = 65.0;     // Default value
    }
    
    // Read soil moisture
    int soil1 = readSoilMoisture(SOIL_PIN_POT1);
    int soil2 = readSoilMoisture(SOIL_PIN_POT2);
    int soil3 = readSoilMoisture(SOIL_PIN_POT3);
    
    // Read NPK sensor
    NPKReading npk = readNPKSensor();
    
    Serial.printf("Temperature: %.1f°C\n", temperature);
    Serial.printf("Humidity: %.1f%%\n", humidity);
    Serial.printf("Soil Moisture - Pot1: %d%%, Pot2: %d%%, Pot3: %d%%\n", soil1, soil2, soil3);
    Serial.printf("NPK - N: %d mg/kg, P: %d mg/kg, K: %d mg/kg\n", npk.nitrogen, npk.phosphorus, npk.potassium);
    
    // Send to Firebase
    sendToFirebase(temperature, humidity, soil1, soil2, soil3, npk);
    
    lastReadTime = millis();
  }
  
  // Listen for actuator updates from Firebase
  if (Firebase.stream(&firebaseData, "/actuators")) {
    updateActuators();
  }
  
  delay(100);
}
