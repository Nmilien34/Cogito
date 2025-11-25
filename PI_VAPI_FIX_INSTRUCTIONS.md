# Fixing Vapi on Raspberry Pi

## ✅ Status: Vapi Works on Local Machine!

Vapi is working perfectly on your local machine. The issue is specific to the Pi environment.

## 🚀 Quick Fix for Pi

### Step 1: Push Your Changes
On your local machine:
```bash
git add .
git commit -m "Fix Vapi connection and add Chromium flags"
git push
```

### Step 2: On the Pi - Pull Changes
```bash
cd ~/Desktop/Cogito
git pull
```

### Step 3: On the Pi - Install Chromium (if not installed)

**Option A: Use the install script (easiest)**
```bash
cd ~/Desktop/Cogito/hardware-service
chmod +x install-chromium.sh
./install-chromium.sh
```

**Option B: Manual installation**
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser

# If that doesn't work, try:
sudo apt-get install -y chromium

# Verify installation:
which chromium-browser || which chromium
```

### Step 4: On the Pi - Start Frontend
```bash
cd ~/Desktop/Cogito/frontend
npm run dev
```

### Step 5: On the Pi - Launch Chromium with Correct Flags

**Option A: Use the script (easiest)**
```bash
cd ~/Desktop/Cogito/hardware-service
chmod +x start-chromium-vapi.sh
./start-chromium-vapi.sh
```

**Option B: Manual command**
```bash
chromium-browser --kiosk \
  --autoplay-policy=no-user-gesture-required \
  --use-fake-ui-for-media-stream \
  --disable-features=AudioServiceOutOfProcess \
  --enable-features=WebRTC \
  --unsafely-treat-insecure-origin-as-secure=http://localhost:5173 \
  --unsafely-treat-insecure-origin-as-secure=http://localhost:3001 \
  --unsafely-treat-insecure-origin-as-secure=http://localhost:4000 \
  --disable-web-security \
  --user-data-dir=/tmp/chromium-vapi \
  http://localhost:5173
```

## 🔍 Testing on Pi

1. **Open DevTools in Chromium** (Press F12, even in kiosk mode)
2. **Go to Network tab** → Filter by "WS" (WebSocket)
3. **Click "Start Voice" button** in the UI
4. **Check for:**
   - WebSocket connections to Vapi servers (should see `wss://api.vapi.ai` or similar)
   - Console logs showing `📞 Vapi call started!`
   - AI speaking back

## 🐛 If Still Not Working on Pi

### Check Network Connectivity
```bash
# On Pi, test if Vapi servers are reachable
curl https://api.vapi.ai
```

### Check Firewall
```bash
# On Pi
sudo ufw status
# If blocking, allow outbound connections:
sudo ufw allow out 443
sudo ufw allow out 80
```

### Check Chromium Version
```bash
# On Pi
chromium-browser --version
# Should be a recent version (2023+)
```

### Test WebSocket Manually
In Chromium DevTools Console (F12), run:
```javascript
const ws = new WebSocket('wss://api.vapi.ai');
ws.onopen = () => console.log('✅ WebSocket connected');
ws.onerror = (e) => console.error('❌ WebSocket error:', e);
```

## 📝 Key Differences: Local vs Pi

| Feature | Local (Mac) | Pi |
|---------|-------------|-----|
| Browser | Chrome/Safari | Chromium |
| Audio | Works automatically | Needs flags |
| WebSocket | Works automatically | May need flags |
| User Gesture | Click works | Physical button doesn't count |

## ✅ What's Fixed in Code

1. ✅ Event listeners set up before `vapi.start()` 
2. ✅ Better error handling and logging
3. ✅ AudioContext resume handling
4. ✅ CORS headers for hardware service
5. ✅ Debug panel in UI
6. ✅ Chromium launch script with correct flags

The code is ready - you just need to deploy it to the Pi and use the correct Chromium flags!

