/*
 * ESP32-CAM + Cloudinary Integration
 * For AI-Based Smart Mini Greenhouse
 * 
 * Uploads photos to Cloudinary and saves URL to Firebase
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "esp_camera.h"

// ==================== CONFIGURATION ====================

// WiFi credentials
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Cloudinary credentials (from Dashboard)
#define CLOUD_NAME "your-cloud-name"
#define UPLOAD_PRESET "greenhouse_preset"  // The preset you created

// Firebase credentials
#define FIREBASE_HOST "greenhouse-67568-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "YOUR_FIREBASE_DATABASE_SECRET"

// Camera pins for ESP32-CAM (AI-Thinker module)
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ==================== GLOBAL VARIABLES ====================

FirebaseData firebaseData;
unsigned long lastCaptureTime = 0;
const unsigned long CAPTURE_INTERVAL = 300000;  // Capture every 5 minutes

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  Serial.println("\n\nGreenhouse ESP32-CAM Starting...");
  
  // Initialize camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_SVGA;  // 800x600 - good balance of quality/size
  config.jpeg_quality = 12;
  config.fb_count = 1;
  
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    Serial.println("\nMake sure you have the correct board selected in Arduino IDE!");
    return;
  }
  Serial.println("✓ Camera initialized");
  
  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✓ WiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  
  // Setup Firebase
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);
  Serial.println("✓ Firebase connected");
  
  Serial.println("\n=== System Ready ===");
  Serial.println("Will capture and upload every 5 minutes");
}

// ==================== MAIN LOOP ====================

void loop() {
  // Capture and upload every 5 minutes
  if (millis() - lastCaptureTime > CAPTURE_INTERVAL) {
    captureAndUpload();
    lastCaptureTime = millis();
  }
  
  delay(1000);
}

// ==================== FUNCTIONS ====================

void captureAndUpload() {
  Serial.println("\n📸 Capturing image...");
  
  // Capture image
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("❌ Camera capture failed");
    return;
  }
  Serial.println("✓ Image captured (" + String(fb->len) + " bytes)");
  
  // Upload to Cloudinary
  String imageUrl = uploadToCloudinary(fb);
  
  // Return the frame buffer to be reused
  esp_camera_fb_return(fb);
  
  if (imageUrl.length() > 0) {
    Serial.println("✓ Upload successful!");
    Serial.println("Image URL: " + imageUrl);
    
    // Save URL to Firebase Realtime Database
    saveToFirebase(imageUrl);
  } else {
    Serial.println("❌ Upload failed");
  }
}

String uploadToCloudinary(camera_fb_t *fb) {
  Serial.println("🌥️ Uploading to Cloudinary...");
  
  WiFiClientSecure client;
  client.setInsecure();  // Skip SSL verification for simplicity
  
  HTTPClient http;
  String url = "https://api.cloudinary.com/v1_1/" + String(CLOUD_NAME) + "/image/upload";
  
  http.begin(client, url);
  http.addHeader("Content-Type", "multipart/form-data");
  
  // Prepare multipart form data
  String boundary = "----WebKitFormBoundary" + String(random(1000000, 9999999));
  http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
  
  // Build form data
  String formData = "--" + boundary + "\r\n";
  formData += "Content-Disposition: form-data; name=\"file\"; filename=\"greenhouse.jpg\"\r\n";
  formData += "Content-Type: image/jpeg\r\n\r\n";
  
  String endData = "\r\n--" + boundary + "\r\n";
  endData += "Content-Disposition: form-data; name=\"upload_preset\"\r\n\r\n";
  endData += String(UPLOAD_PRESET) + "\r\n";
  endData += "--" + boundary + "--\r\n";
  
  // Send request
  int httpResponseCode = http.POST(formData + String((char*)fb->buf, fb->len) + endData);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("✓ Cloudinary response: " + response);
    
    // Parse JSON to extract URL
    String imageUrl = extractImageUrl(response);
    http.end();
    return imageUrl;
  } else {
    Serial.println("❌ Upload failed: " + String(httpResponseCode));
    Serial.println(http.getString());
    http.end();
    return "";
  }
}

String extractImageUrl(String jsonResponse) {
  // Simple JSON parsing to extract secure_url
  int urlStart = jsonResponse.indexOf("\"secure_url\":\"");
  if (urlStart == -1) {
    urlStart = jsonResponse.indexOf("\"url\":\"");
  }
  
  if (urlStart == -1) return "";
  
  urlStart += 13;  // Length of "\"secure_url\":\""
  int urlEnd = jsonResponse.indexOf("\"", urlStart);
  
  if (urlEnd == -1) return "";
  
  String url = jsonResponse.substring(urlStart, urlEnd);
  return url;
}

void saveToFirebase(String imageUrl) {
  Serial.println("💾 Saving to Firebase...");
  
  // Save image URL
  if (Firebase.setString(firebaseData, "/snapshots/latest/imageUrl", imageUrl)) {
    Serial.println("✓ Image URL saved");
  } else {
    Serial.println("❌ Failed to save URL: " + firebaseData.errorReason());
  }
  
  // Save timestamp
  if (Firebase.setInt(firebaseData, "/snapshots/latest/timestamp", millis())) {
    Serial.println("✓ Timestamp saved");
  } else {
    Serial.println("❌ Failed to save timestamp");
  }
  
  // Optional: Add to history (keeps last 10 images)
  String historyPath = "/snapshots/history/" + String(millis());
  Firebase.setString(firebaseData, historyPath + "/imageUrl", imageUrl);
  Firebase.setInt(firebaseData, historyPath + "/timestamp", millis());
}
