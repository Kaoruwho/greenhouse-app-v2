# 🌥️ Cloudinary + ESP32-CAM Complete Setup Guide

## 📋 Overview

This guide will help you set up Cloudinary for image storage and connect it to your ESP32-CAM and mobile app.

---

## ✅ Part 1: Cloudinary Setup (5 minutes)

### Step 1: Sign Up

1. Go to **https://cloudinary.com/users/register/free**
2. Click **"Sign up with Google"** (easiest) or use email
3. Fill in your details
4. **No credit card required!**
5. Verify your email

### Step 2: Get Your Credentials

After logging in, you'll see the **Dashboard**. Copy these:

1. **Cloud Name** (e.g., `dxxx1234` or your custom name)
2. **API Key** (click the eye icon to reveal)
3. **API Secret** (click the eye icon to reveal)

**Save these somewhere safe!** You'll need them later.

### Step 3: Create Upload Preset

1. Click **Settings** (gear icon ⚙️) → **Upload**
2. Scroll down to **"Upload presets"** section
3. Click **"Add upload preset"**
4. Configure:
   - **Preset name**: `greenhouse_preset`
   - **Signing Mode**: Select **Unsigned** ← **IMPORTANT!**
   - **Folder**: `greenhouse` (optional, keeps images organized)
   - **Unique filename**: Select **Yes**
5. Click **Save**

---

## 📸 Part 2: Test Upload Manually

### Upload via Web Interface

1. In Cloudinary Dashboard, click **"Upload"** button (top right)
2. Drag and drop a photo or click to browse
3. After upload, click on the image
4. Copy the **URL** (looks like):
   ```
   https://res.cloudinary.com/YOUR-CLOUD-NAME/image/upload/v1234567890/greenhouse/abc123.jpg
   ```

### Add to Firebase Realtime Database

1. Go to **Firebase Console** → **Realtime Database** → **Data** tab
2. Click on **snapshots** → **test1** (or create new)
3. Replace the **imageUrl** with your Cloudinary URL
4. Press **Enter**

### Test in Your App

1. **Reload your app** (shake phone → tap Reload)
2. Go to **Camera** tab
3. Your image should appear! ✅

---

## 🔌 Part 3: ESP32-CAM Setup

### Step 1: Install Arduino Libraries

Open **Arduino IDE** → **Sketch** → **Include Library** → **Manage Libraries**

Install these:
- **ArduinoJson** by Benoit Blanchon (v6.x)
- **Firebase-ESP32** by Mobizt (v3.5.5 or later)

### Step 2: Upload the Code

1. Open the file: `ESP32_CAM_CLOUDINARY.ino`
2. Update these values:

```cpp
// WiFi credentials
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Cloudinary credentials (from Dashboard)
#define CLOUD_NAME "your-cloud-name"  // From your dashboard
#define UPLOAD_PRESET "greenhouse_preset"  // The preset you created

// Firebase credentials
#define FIREBASE_HOST "greenhouse-67568-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "YOUR_FIREBASE_DATABASE_SECRET"  // From Project Settings > Service Accounts
```

3. Select your board: **Tools** → **Board** → **ESP32 Dev Module**
4. Select the correct **Port**
5. Click **Upload**

### Step 3: Test ESP32-CAM

1. Open **Serial Monitor** (115200 baud)
2. Press **EN** button on ESP32-CAM
3. You should see:
   ```
   ✓ Camera initialized
   ✓ WiFi connected!
   ✓ Firebase connected
   === System Ready ===
   ```
4. Wait 5 minutes for first capture, or modify code for immediate test
5. Check **Cloudinary Media Library** - your image should appear!
6. Check **Firebase Realtime Database** - URL should be saved!

---

## 📊 Part 4: Database Structure

### Firebase Realtime Database:
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
  "snapshots": {
    "latest": {
      "imageUrl": "https://res.cloudinary.com/YOUR-CLOUD/image/upload/v1234567890/greenhouse/abc123.jpg",
      "timestamp": 1711555200000
    },
    "history": {
      "1711555200000": {
        "imageUrl": "https://res.cloudinary.com/...",
        "timestamp": 1711555200000
      }
    }
  }
}
```

### Cloudinary:
- Stores actual image files
- Folder: `greenhouse/`
- Auto-optimizes images
- Provides CDN delivery

---

## ⚙️ Part 5: Configuration Options

### Change Capture Interval

In the code, modify:
```cpp
const unsigned long CAPTURE_INTERVAL = 300000;  // 5 minutes (in milliseconds)
```

Common intervals:
- `60000` = 1 minute
- `300000` = 5 minutes (default)
- `900000` = 15 minutes
- `3600000` = 1 hour

### Change Image Quality

```cpp
config.frame_size = FRAMESIZE_SVGA;  // 800x600 (default)
config.frame_size = FRAMESIZE_XGA;   // 1024x768 (higher quality)
config.frame_size = FRAMESIZE_CIF;   // 400x296 (smaller size)
```

### Change JPEG Quality

```cpp
config.jpeg_quality = 12;  // 0-63 (lower = better quality, larger file)
```

---

## 🔧 Troubleshooting

### Camera Init Failed
- Make sure you selected **ESP32 Dev Module** board
- Check camera wiring matches the pin definitions
- Try restarting the ESP32

### Upload Failed (Cloudinary)
- Check **Upload Preset** is set to **Unsigned**
- Verify **Cloud Name** is correct
- Check WiFi connection

### Can't Save to Firebase
- Verify **FIREBASE_AUTH** is correct (from Service Accounts)
- Check database rules allow write access
- Verify internet connection

### Image Not Showing in App
- Make sure URL is saved correctly in Firebase
- Reload the app
- Check Cloudinary URL is accessible in browser

---

## 📈 Part 6: Free Tier Limits

### Cloudinary Free Plan:
- ✅ **25 GB** storage (~2,500-5,000 photos)
- ✅ **25 GB** bandwidth/month
- ✅ **25,000** transformations/month
- ✅ Unlimited uploads
- ✅ **No credit card required**

### For Your Thesis Project:
- Taking 1 photo every 5 minutes = 288 photos/day
- At ~500KB per photo = 144 MB/day
- **You'll use ~4.3 GB/month** (well within free limit!)

---

## ✅ Testing Checklist

- [ ] Cloudinary account created
- [ ] Upload preset created (Unsigned mode)
- [ ] Manual upload test successful
- [ ] Image URL added to Firebase
- [ ] App shows image in Camera tab
- [ ] ESP32-CAM code uploaded
- [ ] ESP32-CAM captures and uploads automatically
- [ ] Images appear in Cloudinary Media Library
- [ ] URLs saved to Firebase Realtime Database

---

## 🎯 Next Steps After Setup

1. ✅ Test all app tabs (Monitor, AI, Camera, Settings)
2. ✅ Fix Groq API key for AI features
3. ✅ Mount ESP32-CAM in greenhouse
4. ✅ Test automatic captures
5. ✅ Document for thesis

---

## 📞 Need Help?

### Common Issues:

| Issue | Solution |
|-------|----------|
| Upload preset not working | Make sure it's set to **Unsigned** |
| Camera not detected | Check board selection and pin definitions |
| WiFi won't connect | Verify SSID and password (case-sensitive) |
| Images too large | Reduce `frame_size` or `jpeg_quality` |

---

**Ready to start? Begin with Part 1 (Cloudinary setup) and work through each section!**

Let me know when you complete each part and I'll help with any issues! 🚀
