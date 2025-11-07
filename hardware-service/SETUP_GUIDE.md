# Hardware Service Setup Guide - Step by Step

## 🎯 Architecture Overview

```
┌────────────────────────────────────────────────┐
│           RASPBERRY PI 4                       │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │  Python GUI (Tkinter)                │     │
│  │  • 7" Display                        │     │
│  │  • Shows status, messages            │     │
│  │  • Connects: ws://localhost:8080     │     │
│  └──────────────────────────────────────┘     │
│              ↕ WebSocket                       │
│  ┌──────────────────────────────────────┐     │
│  │  Node.js Hardware Service            │     │
│  │  • GPIO buttons                      │     │
│  │  • FM radio control                  │     │
│  │  • WebSocket server: port 8080       │     │
│  │  • HTTP server: port 3001            │     │
│  └──────────────────────────────────────┘     │
│              ↕ WebSocket                       │
│  ┌──────────────────────────────────────┐     │
│  │  Chromium Browser (HEADLESS)         │     │
│  │  • VAPI Web SDK                      │     │
│  │  • Audio only (no GUI)               │     │
│  │  • Connects: ws://localhost:8080     │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  Output: 7" Display = Python GUI ✅            │
│  Audio: Speaker = VAPI + Radio ✅              │
└────────────────────────────────────────────────┘
```

---

## 📋 Step-by-Step Implementation

### **Step 1: Create Node.js Hardware Service**

**Location:** `hardware-service/hardware-service.js`

**What it does:**
- WebSocket server on port 8080 (for Python GUI and Browser)
- HTTP server on port 3001 (for health checks)
- GPIO button handling (voice button on pin 17)
- FM Radio control (I2C commands)
- Coordinates messages between GUI and Browser

**Key Features:**
- Accepts connections from `?client=display` (Python GUI)
- Accepts connections from `?client=browser` (Chromium)
- Routes messages between clients
- Handles GPIO button presses
- Controls FM radio volume (duck/mute/restore)

**Dependencies:**
```bash
npm install ws onoff express
```

---

### **Step 2: Create Python GUI (Tkinter)**

**Location:** `display-gui/display_gui.py`

**What it does:**
- Fullscreen Tkinter app on 7" display
- Large fonts for seniors
- Shows radio status, messages, reminders
- Connects to hardware service via WebSocket
- Updates UI based on messages

**Key Features:**
- Fullscreen mode
- Status indicator (green/gray/orange/red)
- Current activity text
- Messages display area
- Time display
- WebSocket client to `ws://localhost:8080?client=display`

**Dependencies:**
```bash
pip3 install websockets
# Tkinter is built-in
```

**UI Components:**
- Title: "Cogito Radio"
- Status indicator: Color-coded dot (●)
- Status text: "Radio Playing" / "Voice AI Active" / etc.
- Activity: Current action (e.g., "🎤 Listening...")
- Messages: Caregiver messages and reminders
- Time: Current time

---

### **Step 3: Update Frontend for Headless Browser**

**Location:** `frontend/app/radio.tsx`

**What it does:**
- Connects to hardware service via WebSocket
- Handles VAPI audio (no UI needed)
- Sends events to hardware service
- Receives commands from hardware service

**Key Changes:**
- Connect to `ws://localhost:8080?client=browser`
- Listen for `START_VOICE` command
- Send VAPI events: `VOICE_STARTED`, `VOICE_STOPPED`, `USER_SPEAKING`, `AI_SPEAKING`
- Hide UI or render minimal debug view

**Events to Send:**
- `VOICE_STARTED` - When VAPI call starts
- `VOICE_STOPPED` - When VAPI call ends
- `USER_SPEAKING` - When user starts speaking
- `USER_STOPPED_SPEAKING` - When user stops speaking
- `AI_SPEAKING` - When AI is responding
- `NEW_MESSAGE` - When caregiver message received

---

### **Step 4: Create Startup Script**

**Location:** `start-cogito.sh`

**What it does:**
- Starts hardware service (Node.js)
- Starts Python GUI (fullscreen)
- Starts frontend dev server
- Launches headless Chromium browser
- Keeps all processes running

**Execution Order:**
1. Start hardware service (port 8080 WebSocket, port 3001 HTTP)
2. Wait 3 seconds
3. Start Python GUI (fullscreen on display 0)
4. Wait 2 seconds
5. Start frontend dev server (port 8081)
6. Wait 10 seconds (for build)
7. Launch Chromium in headless mode

**Chromium Flags:**
```bash
chromium-browser \
  --headless \
  --disable-gpu \
  --no-sandbox \
  --disable-dev-shm-usage \
  --enable-audio-service-audio-streams \
  --autoplay-policy=no-user-gesture-required \
  http://localhost:8081
```

---

### **Step 5: GPIO Button Setup**

**Hardware:**
- Voice button connected to GPIO pin 17
- Pull-down resistor (or use internal pull-down)
- Button connects GPIO 17 to 3.3V when pressed

**Code (in hardware-service.js):**
```javascript
const { Gpio } = require('onoff');
const voiceButton = new Gpio(17, 'in', 'falling', { debounceTimeout: 10 });

voiceButton.watch((err, value) => {
  if (err) throw err;
  console.log('Voice button pressed!');
  sendToBrowser({ type: 'START_VOICE' });
});
```

---

### **Step 6: FM Radio Control (I2C)**

**Hardware:**
- FM Radio module connected via I2C
- Address: TBD (check module docs)
- Volume control via I2C commands

**Code (in hardware-service.js):**
```javascript
// Example I2C control (adjust based on your module)
const i2c = require('i2c-bus');
const bus = i2c.openSync(1); // I2C bus 1 on Raspberry Pi
const RADIO_ADDRESS = 0x60; // Check your module

function setRadioVolume(volume) {
  bus.writeByteSync(RADIO_ADDRESS, 0x05, volume); // Adjust based on module
}
```

**Note:** Adjust I2C address and commands based on your FM radio module.

---

## 📁 Directory Structure

```
cogito/
├── hardware-service/
│   ├── hardware-service.js      # Node.js coordinator ⭐
│   ├── package.json             # Dependencies
│   └── SETUP_GUIDE.md           # This file
│
├── display-gui/
│   ├── display_gui.py           # Python Tkinter GUI ⭐
│   ├── requirements.txt         # Python dependencies
│   └── assets/                  # Fonts, images (optional)
│
├── frontend/
│   ├── app/
│   │   └── radio.tsx            # Updated for headless ⭐
│   └── package.json
│
└── start-cogito.sh              # Startup script ⭐
```

---

## 🔌 WebSocket Protocol

### **Python GUI → Hardware Service**

**Connect:**
```
ws://localhost:8080?client=display
```

**Messages Received:**
```json
{"type": "VOICE_STARTED"}
{"type": "VOICE_STOPPED"}
{"type": "USER_SPEAKING"}
{"type": "USER_STOPPED_SPEAKING"}
{"type": "AI_SPEAKING"}
{"type": "NEW_MESSAGE", "message": {...}}
{"type": "REMINDER", "reminder": {...}}
{"type": "ERROR", "error": "..."}
```

**Messages Sent:**
```json
// GUI doesn't send commands, only receives updates
```

---

### **Browser → Hardware Service**

**Connect:**
```
ws://localhost:8080?client=browser
```

**Messages Received:**
```json
{"type": "START_VOICE"}
```

**Messages Sent:**
```json
{"type": "VOICE_STARTED"}
{"type": "VOICE_STOPPED"}
{"type": "USER_SPEAKING"}
{"type": "USER_STOPPED_SPEAKING"}
{"type": "AI_SPEAKING"}
{"type": "NEW_MESSAGE", "message": {...}}
{"type": "ERROR", "error": "..."}
```

---

## 🚀 Installation Steps

### **1. Install Node.js Dependencies**
```bash
cd hardware-service
npm install ws onoff express i2c-bus
```

### **2. Install Python Dependencies**
```bash
cd display-gui
pip3 install websockets
# Tkinter is built-in, no install needed
```

### **3. Install Chromium**
```bash
sudo apt-get update
sudo apt-get install chromium-browser
```

### **4. Set Permissions**
```bash
# Add user to gpio group
sudo usermod -a -G gpio pi
sudo usermod -a -G i2c pi

# Log out and back in for groups to take effect
```

### **5. Make Startup Script Executable**
```bash
chmod +x start-cogito.sh
```

---

## 🧪 Testing Without Hardware

### **Test Hardware Service:**
```bash
cd hardware-service
node hardware-service.js

# In another terminal:
curl http://localhost:3001/health
```

### **Test WebSocket Connection:**
```javascript
// In Node.js or browser console
const ws = new WebSocket('ws://localhost:8080?client=display');
ws.on('open', () => console.log('Connected!'));
ws.send(JSON.stringify({type: 'VOICE_STARTED'}));
```

### **Test Python GUI (without display):**
```bash
cd display-gui
python3 display_gui.py
# Should connect to hardware service
# UI will show in window (not fullscreen if no display)
```

---

## 🔧 Configuration

### **Hardware Service:**
- WebSocket port: 8080
- HTTP port: 3001
- GPIO pin: 17 (voice button)
- I2C bus: 1 (Raspberry Pi default)
- Radio I2C address: TBD (check module)

### **Python GUI:**
- Display: `:0` (default)
- Fullscreen: Yes
- WebSocket: `ws://localhost:8080?client=display`
- Font sizes: Large (48pt title, 32pt status, 24pt text)

### **Browser:**
- URL: `http://localhost:8081` (or your frontend URL)
- Headless: Yes
- Audio: Enabled
- WebSocket: `ws://localhost:8080?client=browser`

---

## 📝 Implementation Checklist

**When implementing tomorrow:**

- [ ] Create `hardware-service.js` with WebSocket server
- [ ] Add GPIO button handling
- [ ] Add FM radio control (I2C)
- [ ] Create `display_gui.py` with Tkinter
- [ ] Implement WebSocket client in Python
- [ ] Update `frontend/app/radio.tsx` for headless
- [ ] Add WebSocket client in browser
- [ ] Create `start-cogito.sh` startup script
- [ ] Test each component individually
- [ ] Test full integration
- [ ] Configure auto-start on boot

---

## 🎯 Key Points to Remember

1. **Hardware Service** is the coordinator - everything goes through it
2. **Python GUI** only displays - receives updates, doesn't send commands
3. **Browser** handles VAPI - sends events, receives START_VOICE command
4. **GPIO button** triggers voice via hardware service
5. **FM Radio** is controlled by hardware service (duck/mute/restore)
6. **WebSocket** is the communication layer between all components
7. **Headless browser** means no GUI shown, only audio processing

---

## 🆘 Troubleshooting

**Python GUI not connecting?**
- Check hardware service is running
- Check WebSocket URL: `ws://localhost:8080?client=display`
- Check firewall/port 8080

**Browser not connecting?**
- Check hardware service is running
- Check WebSocket URL: `ws://localhost:8080?client=browser`
- Check browser console for errors

**GPIO not working?**
- Check user is in `gpio` group
- Check pin number (17)
- Check wiring
- Test with: `gpio readall` (if installed)

**Audio not working?**
- Check Chromium audio permissions
- Check ALSA devices: `aplay -l`
- Test audio: `speaker-test -t wav`

---

**This guide provides all the context needed for implementation! 🚀**

