# 🧪 App Testing Guide

Use this checklist to test all features of your Greenhouse App.

---

## ✅ Monitor Tab

### Test 1: Sensor Data Display
- [ ] Open **Monitor** tab
- [ ] Verify temperature shows correct value from Firebase
- [ ] Verify humidity shows correct value from Firebase
- [ ] Verify all 3 soil moisture pots show values
- [ ] Check status indicators:
  - ✅ Green checkmark = within optimal range
  - ⚠️ Orange warning = outside optimal range

### Test 2: Plant Selector
- [ ] Click the plant selector dropdown
- [ ] Select different plants (Tomato, Lettuce, Basil, etc.)
- [ ] Verify optimal parameters change for each plant
- [ ] Check Firebase Console - `settings/selectedPlant` should update

### Test 3: Control Mode
- [ ] Switch between **AUTO** and **MANUAL** modes
- [ ] Verify mode toggles work
- [ ] Check Firebase Console - `controlMode/isAuto` should update

### Test 4: Actuator Control (Manual Mode Only)
- [ ] Switch to **MANUAL** mode first
- [ ] Toggle **Fan** ON → Check Firebase for `actuators/fan: true`
- [ ] Toggle **Fan** OFF → Check Firebase for `actuators/fan: false`
- [ ] Repeat for **Pump** and **LED Light**
- [ ] Try toggling in **AUTO** mode (should be disabled)

---

## ✅ AI Assistant Tab

### Test 1: AI Chat
- [ ] Open **AI** tab → **AI Chat** tab
- [ ] Type a question: "What is the ideal temperature for tomato plants?"
- [ ] Send message
- [ ] Wait for AI response (should take 2-5 seconds)
- [ ] Verify response is relevant to your question
- [ ] Try follow-up questions

**Sample Questions to Test:**
- "Is my plant healthy?"
- "When should I water my plants?"
- "Optimize growing conditions"
- "What nutrients does my plant need?"

### Test 2: Soil Analysis
- [ ] Open **AI** tab → **Soil Analysis** tab
- [ ] Select Pot 1, 2, or 3
- [ ] Click **Get AI Recommendation**
- [ ] Wait for analysis (2-5 seconds)
- [ ] Verify recommendation appears
- [ ] Check recommendation history below

### Test 3: Error Handling
- [ ] Send empty message (should not send)
- [ ] Disconnect internet and try sending (should show error)
- [ ] Verify error messages are user-friendly

---

## ✅ Camera Tab

### Test 1: Empty State
- [ ] Open **Camera** tab
- [ ] Verify "No Snapshots Yet" message appears (if no data)
- [ ] Check info card about growth tracking

### Test 2: With Snapshot Data
Add test data to Firebase:
```json
{
  "snapshots": {
    "test1": {
      "imageUrl": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda7?w=400",
      "timestamp": 1711555200000
    },
    "test2": {
      "imageUrl": "https://images.unsplash.com/photo-1446071103084-c257b5f70671?w=400",
      "timestamp": 1711468800000
    }
  }
}
```

Then test:
- [ ] Reload app
- [ ] Verify latest snapshot shows in top card
- [ ] Click snapshot → should open in browser
- [ ] Verify gallery shows additional images
- [ ] Check timestamps display correctly

---

## ✅ Settings Tab

### Test 1: Theme Toggle
- [ ] Open **Settings** tab
- [ ] Tap **Light** theme → Verify app switches to light mode
- [ ] Tap **Dark** theme → Verify app switches to dark mode
- [ ] Toggle back and forth multiple times
- [ ] Check all tabs in both themes

### Test 2: Notifications
- [ ] Toggle **Enable Notifications** ON/OFF
- [ ] Verify sub-toggles are disabled when main toggle is OFF
- [ ] Toggle individual alerts (Temperature, Humidity, Soil)

### Test 3: Alert Thresholds
- [ ] Tap **Temperature** row
- [ ] Adjust min/max values using +/- buttons
- [ ] Click **Save Changes**
- [ ] Verify values update
- [ ] Click **Reset to Plant Defaults**
- [ ] Verify values reset based on selected plant

### Test 4: About Section
- [ ] Verify app version shows
- [ ] Verify Firebase status shows "Connected"

---

## 🐛 Common Issues & Fixes

### AI Chat Error 401 (Invalid API Key)
**Fix:** Get new Groq API key from https://console.groq.com/
Update `src/config/index.ts` → `GROQ_API_KEY`

### Data Not Updating
**Fix:** 
1. Check Firebase Console for correct data structure
2. Shake phone → Reload
3. Verify internet connection

### Actuators Not Responding
**Fix:**
1. Make sure you're in **MANUAL** mode
2. Check Firebase Console for updated values
3. Verify app has write permissions

### Dark Mode Status Bar
**Note:** Status bar follows system theme, not app theme. This is expected behavior.

---

## 📊 Test Results Template

Copy this and fill in your results:

```
## Test Results - [Date]

### Monitor Tab
- [ ] Sensor Data: PASS / FAIL
- [ ] Plant Selector: PASS / FAIL
- [ ] Control Mode: PASS / FAIL
- [ ] Actuators: PASS / FAIL

### AI Tab
- [ ] AI Chat: PASS / FAIL
- [ ] Soil Analysis: PASS / FAIL

### Camera Tab
- [ ] Empty State: PASS / FAIL
- [ ] Gallery: PASS / FAIL

### Settings Tab
- [ ] Theme Toggle: PASS / FAIL
- [ ] Notifications: PASS / FAIL
- [ ] Thresholds: PASS / FAIL

### Issues Found:
1. [Description]
2. [Description]

### Screenshots:
[Attach any relevant screenshots]
```

---

## 🎯 Next Steps After Testing

Once all tests pass:
1. ✅ Connect ESP32 for real sensor data
2. ✅ Add data visualization (graphs)
3. ✅ Set up push notifications
4. ✅ Add data export for thesis

---

**Start by fixing the Groq API key, then work through each tab!**

Let me know which tests pass/fail and I'll help fix any issues. 🚀
