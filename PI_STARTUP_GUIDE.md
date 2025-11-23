# 🍓 Raspberry Pi Complete Startup Guide

## ⚠️ CRITICAL: You Need 3 Processes Running!

Your system has **3 separate components** that must ALL be running:

```
┌─────────────────────────────────────────────────────────┐
│ 1. Hardware Service (Node.js)                          │
│    - Port 3001                                          │
│    - API endpoints                                      │
│    - WebSocket server                                   │
└─────────────────────────────────────────────────────────┘
              ↕ (API calls)
┌─────────────────────────────────────────────────────────┐
│ 2. Button Handler (Python)                             │
│    - Monitors GPIO pin 17                              │
│    - Calls hardware service API when button pressed    │
└─────────────────────────────────────────────────────────┘
              ↕ (WebSocket events)
┌─────────────────────────────────────────────────────────┐
│ 3. Frontend (Chromium)                                  │
│    - http://localhost:8081                              │
│    - Vapi Web SDK                                       │
│    - Receives WebSocket events                          │
│    - Starts/stops voice conversation                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Step-by-Step Startup on Raspberry Pi

### Step 1: Create Environment Files

#### Frontend .env
```bash
cd ~/cogito/frontend
nano .env
```

Add:
```env
# Backend API URL
EXPO_PUBLIC_API_URL=http://localhost:3000

# Vapi Configuration
EXPO_PUBLIC_VAPI_PUBLIC_KEY=0976fe03-c53e-4a18-a033-d9677d4214cf
EXPO_PUBLIC_VAPI_ASSISTANT_ID=df2a9bc2-b7e1-4640-af14-1e69930712c5

# Hardware Service URL (running on Pi)
EXPO_PUBLIC_HARDWARE_SERVICE_URL=http://localhost:3001
```

#### Hardware Service .env
```bash
cd ~/cogito/hardware-service
nano .env
```

Add:
```env
# Server Configuration
PORT=3001

# Device Information
DEVICE_ID=cogito-radio-001
DEVICE_NAME=Cogito FM Radio

# Hardware Settings
BUTTON_GPIO_PIN=17
I2C_BUS=1
RADIO_I2C_ADDRESS=0x60

# AI Mode Settings
AI_TIMEOUT_SECONDS=10
ACTIVITY_CHECK_INTERVAL=1

# Logging
LOG_LEVEL=debug
```

---

### Step 2: Open 3 Terminal Windows

You need **3 separate terminal sessions** (use tmux or screen, or 3 SSH sessions).

#### Terminal 1: Hardware Service

```bash
cd ~/cogito/hardware-service
node hardware-service.js
```

**Expected output:**
```
Cogito Hardware Service Starting...
Hardware service running on port 3001
Current mode: radio
```

**⚠️ KEEP THIS RUNNING! Don't close this terminal.**

---

#### Terminal 2: Button Handler

```bash
cd ~/cogito/hardware-service
python3 python/button-vapi-handler-debug.py
```

**Expected output:**
```
======================================================================
COGITO BUTTON HANDLER - Vapi Integration (DEBUG MODE)
======================================================================
Button Pin:     GPIO 17 (BCM)
Service URL:    http://localhost:3001
AI Timeout:     10s
======================================================================

✅ GPIO initialized: Pin 17 (BCM mode, PULL-UP)
✅ Hardware service is running: {'status': 'ok', 'mode': 'radio'}
📻 Starting in RADIO MODE
🔘 Press button to talk to AI

👂 Listening for button press...
```

**⚠️ KEEP THIS RUNNING! Don't close this terminal.**

---

#### Terminal 3: Frontend

```bash
cd ~/cogito/frontend
npx expo start --web
```

Wait for it to build (30-60 seconds), then you'll see:
```
Waiting on http://localhost:8081
Web Bundled 5753ms
```

**Then open Chromium:**
```bash
chromium-browser --kiosk \
  --autoplay-policy=no-user-gesture-required \
  --use-fake-ui-for-media-stream \
  --disable-features=AudioServiceOutOfProcess \
  http://localhost:8081
```

**Chromium flags explained:**
- `--kiosk` - Full screen mode
- `--autoplay-policy=no-user-gesture-required` - Allow audio without click
- `--use-fake-ui-for-media-stream` - Auto-grant microphone permission
- `--disable-features=AudioServiceOutOfProcess` - Fix audio on Pi

---

## 🧪 Testing the System

### Test 1: Check All Services Are Running

In a new terminal:
```bash
# Check hardware service
curl http://localhost:3001/health

# Check frontend (should see HTML)
curl http://localhost:8081
```

### Test 2: Simulate Button Press (Without Physical Button)

```bash
# Switch to AI mode
curl -X POST http://localhost:3001/api/mode/set \
  -H "Content-Type: application/json" \
  -d '{"mode":"ai"}'

# Switch back to Radio mode
curl -X POST http://localhost:3001/api/mode/set \
  -H "Content-Type: application/json" \
  -d '{"mode":"radio"}'
```

**Expected:**
- Hardware service logs show mode change
- Button handler logs show mode change
- Frontend UI updates mode indicator
- Vapi starts/stops conversation

### Test 3: Press Physical Button

1. Make sure all 3 processes are running
2. Press the physical button connected to GPIO 17
3. Watch the button handler logs - you should see:
   ```
   🔘 BUTTON PRESSED! (GPIO 17 went LOW)
   🔄 Attempting to switch mode: radio → ai
   ```

### Test 4: Speak to the AI

1. Press button (or use curl to switch to AI mode)
2. Wait for Vapi to connect (you'll hear a beep or see status change)
3. **Speak into the microphone**
4. AI should respond through the speakers

---

## 🐛 Troubleshooting

### Problem: Physical button doesn't work

**Check button handler logs:**
```bash
# In the button handler terminal, you should see:
💓 Heartbeat: Still monitoring button (GPIO 17=1)
```

**If you see errors:**
1. Check GPIO wiring (pin 17 to button, button to ground)
2. Test button manually:
   ```bash
   python3 -c "
   import RPi.GPIO as GPIO
   GPIO.setmode(GPIO.BCM)
   GPIO.setup(17, GPIO.IN, pull_up_down=GPIO.PUD_UP)
   print('Button state:', GPIO.input(17))
   GPIO.cleanup()
   "
   ```
   Should print `1` when not pressed, `0` when pressed.

### Problem: AI doesn't speak when mode switches

**Check browser console (F12 in Chromium):**
1. Open Developer Tools (F12)
2. Look for Vapi logs:
   ```
   🚀 Starting Vapi conversation...
   📞 Vapi call started
   ```

**If you see microphone permission errors:**
- Make sure Chromium was launched with `--use-fake-ui-for-media-stream`
- Or manually grant permission in browser

**If Vapi doesn't start at all:**
- Check frontend terminal for errors
- Verify `.env` has correct `EXPO_PUBLIC_VAPI_PUBLIC_KEY` and `EXPO_PUBLIC_VAPI_ASSISTANT_ID`
- Check browser console for WebSocket connection errors

### Problem: "Client connected" never appears in hardware service logs

**This means frontend isn't connecting via WebSocket.**

1. Check frontend is actually running in browser
2. Check browser console (F12) for connection errors
3. Verify `EXPO_PUBLIC_HARDWARE_SERVICE_URL=http://localhost:3001` in frontend `.env`

### Problem: Button handler can't connect to hardware service

**You'll see:**
```
❌ Cannot connect to http://localhost:3001
```

**Fix:**
- Make sure hardware-service.js is running in Terminal 1
- Check `curl http://localhost:3001/health` works

---

## ✅ Quick Checklist

Before testing, verify:

- [ ] All 3 `.env` files created with correct values
- [ ] Terminal 1: `node hardware-service.js` running
- [ ] Terminal 2: `python3 button-vapi-handler-debug.py` running
- [ ] Terminal 3: Frontend built and Chromium opened to `http://localhost:8081`
- [ ] Hardware service shows "Client connected"
- [ ] Button handler shows "Hardware service is running"
- [ ] GPIO button wired correctly (pin 17 to button to ground)
- [ ] Microphone and speakers connected to Pi
- [ ] Chromium has microphone access

---

## 🎯 Expected Complete Flow

1. **Press button** → Button handler detects GPIO LOW
2. **Button handler** → Calls `POST /api/mode/set` with `{mode: "ai"}`
3. **Hardware service** → Emits WebSocket event `start-voice`
4. **Frontend** → Receives event, calls `vapiService.startConversation()`
5. **Vapi SDK** → Requests mic, connects to Vapi cloud
6. **You speak** → Mic captures audio, sends to Vapi
7. **AI responds** → Vapi sends audio back, plays through speakers
8. **After 10s silence** → Auto-returns to radio mode

---

Good luck! 🚀
