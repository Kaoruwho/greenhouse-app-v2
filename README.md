# 🌱 AI-Based Smart Mini Greenhouse Mobile App

A React Native Expo mobile application for monitoring and controlling an AI-Based Smart Mini Greenhouse with Soil Recommendation.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Firebase project (greenhouse-67568)
- Groq API key

### 1. Install Dependencies
```bash
cd greenhouse-app-v2
npm install
```

### 2. Configure Firebase (REQUIRED)

Your Firebase is already configured with:
- **Project ID**: greenhouse-67568
- **Database URL**: https://greenhouse-67568-default-rtdb.asia-southeast1.firebasedatabase.app

#### Option A: Quick Test (Manual Data)
1. Go to [Firebase Console](https://console.firebase.google.com/project/greenhouse-67568/database)
2. Click **Realtime Database** → **Data** tab
3. Click the three dots (⋮) → **Import JSON**
4. Paste this test data:

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

5. Click **Import** and open the app!

#### Option B: Automated Test Data Push
```bash
# Install Firebase Admin SDK
npm install firebase-admin

# Download service account key from Firebase Console:
# Project Settings > Service Accounts > Generate New Private Key
# Save as serviceAccountKey.json in project root

# Run the test data script
node push-test-data.js
```

### 3. Configure Groq API (For AI Features)

Your Groq API key is already configured. To get a new one:
1. Visit [Groq Console](https://console.groq.com/)
2. Go to **API Keys**
3. Create a new key
4. Update `src/config/index.ts` if needed

### 4. Run the App
```bash
# Start Expo development server
npx expo start

# Then choose one:
# - Press 'w' for web browser
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go app
```

---

## 📱 Features

### Monitor Tab
- ✅ Real-time sensor data (Temperature, Humidity, Soil Moisture for 3 pots)
- ✅ Actuator status and manual control (Fan, Pump, LED Light)
- ✅ Auto/Manual mode switching
- ✅ Plant selector with dynamic optimal parameters
- ✅ Status indicators (green/orange) for optimal/out-of-range values

### AI Assistant Tab
- ✅ AI Chat for general greenhouse questions
- ✅ Soil recommendation powered by Groq AI
- ✅ Conversation history
- ✅ Quick action buttons
- ✅ Recommendation history tracking

### Camera Tab
- ✅ Latest snapshot from greenhouse camera
- ✅ Image gallery with timestamps
- ✅ Growth tracking info

### Settings Tab
- ✅ Light/Dark mode toggle
- ✅ Notification preferences
- ✅ Custom alert thresholds
- ✅ Plant-based default reset

---

## 🔥 Firebase Integration

### Database Structure
```
greenhouse-67568-default-rtdb/
├── sensors/
│   ├── temperature: number
│   ├── humidity: number
│   ├── soilMoisture/
│   │   ├── pot1: number
│   │   ├── pot2: number
│   │   └── pot3: number
│   └── timestamp: number
├── actuators/
│   ├── fan: boolean
│   ├── pump: boolean
│   └── ledLight: boolean
├── controlMode/
│   └── isAuto: boolean
├── snapshots/
│   └── {snapshotId}/
│       ├── imageUrl: string
│       └── timestamp: number
└── settings/
    └── selectedPlant: string
```

### ESP32/Arduino Integration
See **FIREBASE_SETUP.md** for complete ESP32 code and setup instructions.

---

## 🎨 Customization

### Change Firebase Project
Edit `src/config/index.ts`:
```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  databaseURL: "YOUR_DATABASE_URL",
  // ... other config
};
```

### Add New Plants
Edit `src/config/plants.ts`:
```typescript
export const PLANTS: Plant[] = [
  {
    id: 'your_plant',
    name: 'Your Plant Name',
    optimalTemp: { min: 20, max: 30 },
    optimalHumidity: { min: 50, max: 70 },
    optimalSoilMoisture: { min: 60, max: 80 },
  },
  // ... more plants
];
```

### Change Theme Colors
Edit `src/theme/colors.ts`:
```typescript
export const lightColors: ThemeColors = {
  primary: '#4CAF50',  // Change this
  // ... other colors
};
```

---

## 📂 Project Structure

```
greenhouse-app-v2/
├── app/                    # Expo Router screens
│   ├── _layout.tsx
│   ├── index.tsx
│   └── MainApp.tsx
├── src/
│   ├── components/         # Reusable UI components
│   ├── config/             # Configuration files
│   │   ├── index.ts        # Firebase & Groq config
│   │   └── plants.ts       # Plant definitions
│   ├── context/            # React Context providers
│   │   └── AppContext.tsx
│   ├── screens/            # Screen components
│   │   ├── Monitor/
│   │   ├── AI/
│   │   ├── Camera/
│   │   └── Settings/
│   ├── services/           # API & Firebase services
│   │   ├── firebase.ts
│   │   └── groq.ts
│   ├── theme/              # Theme configuration
│   │   ├── colors.ts
│   │   └── ThemeContext.tsx
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   └── utils/              # Utility functions
├── FIREBASE_SETUP.md       # Detailed Firebase guide
├── push-test-data.js       # Test data script
├── app.json               # Expo configuration
└── package.json           # Dependencies
```

---

## 🛠️ Troubleshooting

### App shows "No sensor data available"
1. Check if data exists in Firebase Console
2. Verify internet connection
3. Reload the app (shake device → Reload)

### Actuators don't respond
1. Switch to MANUAL mode first
2. Check Firebase Console for updated values
3. Verify ESP32 is connected and listening

### AI features not working
1. Check Groq API key in `src/config/index.ts`
2. Verify internet connection
3. Check Groq console for API usage limits

### Build errors
```bash
# Clear cache and reinstall
npx expo start -c
rm -rf node_modules
npm install
```

---

## 📞 Support

For issues or questions:
1. Check **FIREBASE_SETUP.md** for detailed Firebase guide
2. Review Firebase Console logs
3. Check Expo terminal for error messages

---

## 📄 License

This project is part of an AI-Based Smart Mini Greenhouse thesis.

Built with ❤️ for smart greenhouse farmers
