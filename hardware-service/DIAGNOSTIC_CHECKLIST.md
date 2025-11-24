# 🔍 Diagnostic Checklist - Why Mic Isn't Working

## Current Status from Your Logs

✅ **Working:**
- Button handler is running and detecting button presses
- Hardware service is running on port 3001
- Mode switching is working (radio ↔ ai)
- API calls are successful

❌ **Missing:**
- No "Client connected" logs in hardware service
- Frontend WebSocket connection not established
- Vapi conversation not starting

---

## Step 1: Check if Frontend is Running

**On the Pi, check if frontend is running:**

```bash
# Check if port 8081 is in use (frontend)
sudo lsof -i :8081

# Check if Chromium is running
ps aux | grep chromium

# Check if expo is running
ps aux | grep expo
```

**Expected:** You should see processes for:
- `node` (expo)
- `chromium-browser`

**If nothing is running:**
```bash
# Terminal 3: Start frontend
cd ~/Desktop/Cogito/frontend
npx expo start --web
```

Wait for it to build, then open Chromium:
```bash
chromium-browser --kiosk \
  --autoplay-policy=no-user-gesture-required \
  --use-fake-ui-for-media-stream \
  --disable-features=AudioServiceOutOfProcess \
  http://localhost:8081
```

---

## Step 2: Check WebSocket Connection

**In hardware service terminal, you should see:**
```
✅ Client connected: <socket-id>
📡 Total clients: 1
```

**If you DON'T see this:**
- Frontend is not connecting to WebSocket
- Check browser console (F12 in Chromium)

**To check browser console:**
1. Open Chromium (even if in kiosk mode, press F12)
2. Go to Console tab
3. Look for:
   - `🔌 Connecting to hardware service: http://localhost:3001`
   - `✅ Connected to hardware service`
   - Any connection errors

---

## Step 3: Check Vapi Configuration

**Check frontend `.env` file:**
```bash
cat ~/Desktop/Cogito/frontend/.env
```

**Should have:**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_VAPI_PUBLIC_KEY=0976fe03-c53e-4a18-a033-d9677d4214cf
EXPO_PUBLIC_VAPI_ASSISTANT_ID=df2a9bc2-b7e1-4640-af14-1e69930712c5
EXPO_PUBLIC_HARDWARE_SERVICE_URL=http://localhost:3001
```

**If missing, create it:**
```bash
cd ~/Desktop/Cogito/frontend
nano .env
# Paste the content above
```

---

## Step 4: Test WebSocket Connection Manually

**In a new terminal on the Pi:**
```bash
# Test if hardware service WebSocket is accessible
curl http://localhost:3001/health

# Should return:
{"status":"ok","mode":"radio"}
```

**Test WebSocket connection:**
```bash
# Install wscat if needed
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:3001/socket.io/?EIO=4&transport=websocket
```

**If connection fails:**
- Hardware service might not be running
- Port 3001 might be blocked
- Check hardware service logs

---

## Step 5: Check Browser Console for Errors

**In Chromium (F12 → Console), look for:**

✅ **Good signs:**
```
🔌 Connecting to hardware service: http://localhost:3001
✅ Connected to hardware service
🎤 Hardware button pressed - Starting Vapi conversation
🚀 Starting Vapi conversation...
```

❌ **Bad signs:**
```
❌ Hardware service connection error: ...
❌ Failed to start Vapi via button: ...
❌ Failed to start conversation: ...
```

**Common errors:**
- `Connection refused` → Hardware service not running
- `Microphone permission denied` → Need to grant mic access
- `Vapi SDK error` → Check VAPI_PUBLIC_KEY and VAPI_ASSISTANT_ID

---

## Step 6: Check Microphone Permissions

**In Chromium:**
1. Press F12 (open DevTools)
2. Go to Console
3. Type:
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('✅ Mic access granted', stream))
  .catch(err => console.error('❌ Mic access denied', err))
```

**If denied:**
- Chromium needs to be launched with `--use-fake-ui-for-media-stream`
- Or manually grant permission in browser settings

---

## Step 7: Check Vapi SDK Initialization

**In browser console (F12), check:**
```javascript
// Check if Vapi is loaded
window.Vapi

// Check if assistant ID is set
localStorage.getItem('vapi-assistant-id')
```

**If Vapi SDK not loaded:**
- Frontend build might have failed
- Check frontend terminal for build errors
- Rebuild: `cd ~/Desktop/Cogito/frontend && npm run build`

---

## Step 8: Full Diagnostic Test

**Run this script to test everything:**

```bash
# Create test script
cat > ~/test-cogito.sh << 'EOF'
#!/bin/bash
echo "🔍 Cogito Diagnostic Test"
echo "========================"
echo ""

echo "1. Checking hardware service..."
curl -s http://localhost:3001/health && echo "✅ Hardware service OK" || echo "❌ Hardware service DOWN"

echo ""
echo "2. Checking frontend..."
curl -s http://localhost:8081 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend DOWN"

echo ""
echo "3. Checking WebSocket clients..."
# This will show in hardware service logs

echo ""
echo "4. Checking processes..."
ps aux | grep -E "(node|expo|chromium)" | grep -v grep

echo ""
echo "✅ Diagnostic complete!"
EOF

chmod +x ~/test-cogito.sh
~/test-cogito.sh
```

---

## Most Likely Issues

### Issue 1: Frontend Not Running
**Symptom:** No "Client connected" in hardware service logs

**Fix:**
```bash
cd ~/Desktop/Cogito/frontend
npx expo start --web
# Wait for build, then open Chromium
```

### Issue 2: Frontend Not Connecting to WebSocket
**Symptom:** Browser console shows connection errors

**Fix:**
- Check `EXPO_PUBLIC_HARDWARE_SERVICE_URL=http://localhost:3001` in frontend `.env`
- Restart frontend after changing `.env`
- Check hardware service is actually running

### Issue 3: Vapi Not Starting
**Symptom:** WebSocket connected but Vapi doesn't start

**Fix:**
- Check browser console for Vapi errors
- Verify `EXPO_PUBLIC_VAPI_PUBLIC_KEY` and `EXPO_PUBLIC_VAPI_ASSISTANT_ID` in `.env`
- Check Vapi SDK is loaded in browser

### Issue 4: Microphone Not Working
**Symptom:** Vapi starts but no audio

**Fix:**
- Launch Chromium with `--use-fake-ui-for-media-stream`
- Check mic is connected to Pi
- Test mic: `arecord -d 3 test.wav && aplay test.wav`

**Comprehensive Microphone Testing:**

1. **System-level test (Terminal):**
   ```bash
   cd ~/Desktop/Cogito/hardware-service
   chmod +x test-microphone.sh
   ./test-microphone.sh
   ```
   This will:
   - List all audio input devices
   - Record 3 seconds of audio
   - Play it back so you can hear if it's working

2. **Browser-level test:**
   ```bash
   # Open the test page in Chromium
   chromium-browser ~/Desktop/Cogito/hardware-service/test-browser-mic.html
   ```
   Or if Chromium is already running:
   - Press F12 to open DevTools
   - Go to Console tab
   - Type:
   ```javascript
   navigator.mediaDevices.getUserMedia({ audio: true })
     .then(stream => {
       console.log('✅ Mic access granted!', stream.getAudioTracks());
       stream.getTracks().forEach(track => track.stop());
     })
     .catch(err => console.error('❌ Mic error:', err));
   ```

3. **Check microphone permissions in Chromium:**
   - Go to: `chrome://settings/content/microphone`
   - Make sure `http://localhost:8081` is allowed
   - Or set to "Ask" and grant when prompted

---

## Quick Fix Commands

```bash
# Kill everything and restart
killall node chromium-browser 2>/dev/null

# Terminal 1: Hardware service
cd ~/Desktop/Cogito/hardware-service
node hardware-service.js

# Terminal 2: Button handler
cd ~/Desktop/Cogito/hardware-service
python3 python/button-vapi-handler-debug.py

# Terminal 3: Frontend
cd ~/Desktop/Cogito/frontend
npx expo start --web

# Terminal 4: Open Chromium (after frontend builds)
chromium-browser --kiosk \
  --autoplay-policy=no-user-gesture-required \
  --use-fake-ui-for-media-stream \
  --disable-features=AudioServiceOutOfProcess \
  http://localhost:8081
```

---

## What to Check Next

1. **Hardware service logs** - Should show "Client connected" when frontend loads
2. **Browser console** - Should show WebSocket connection and Vapi events
3. **Button handler logs** - Already working ✅
4. **Frontend terminal** - Should show build success and no errors

Let me know what you see in each of these!

