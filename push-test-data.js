const admin = require('firebase-admin');

// Service account key - download from Firebase Console:
// Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://greenhouse-67568-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = admin.database();

// Test data to push
const testData = {
  sensors: {
    temperature: 26.5,
    humidity: 68.0,
    soilMoisture: {
      pot1: 72,
      pot2: 65,
      pot3: 70
    },
    timestamp: Date.now()
  },
  actuators: {
    fan: false,
    pump: false,
    ledLight: false
  },
  controlMode: {
    isAuto: true
  },
  settings: {
    selectedPlant: 'tomato'
  }
};

async function pushTestData() {
  try {
    console.log('🔄 Pushing test data to Firebase...');
    
    await db.ref('/').set(testData);
    
    console.log('✅ Test data pushed successfully!');
    console.log('\n📊 Data structure:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n📱 Open your app to see the live data!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error pushing data:', error.message);
    console.log('\n📝 Make sure you:');
    console.log('1. Downloaded serviceAccountKey.json from Firebase Console');
    console.log('2. Placed it in the same folder as this script');
    console.log('3. Have internet connection');
    process.exit(1);
  }
}

pushTestData();
