# Implementation Notes - For Tomorrow

## 🎯 What We're Building

Three-layer architecture:
1. **Python GUI (Tkinter)** - What user sees on 7" display
2. **Node.js Hardware Service** - Coordinates everything, handles GPIO/I2C
3. **Headless Chromium** - Handles VAPI audio only

---

## 📝 Code Locations to Create

### **1. Hardware Service**
**File:** `hardware-service/hardware-service.js`
- WebSocket server (port 8080)
- HTTP server (port 3001)
- GPIO button handling
- FM Radio control
- Message routing between GUI and Browser

### **2. Python GUI**
**File:** `display-gui/display_gui.py`
- Tkinter fullscreen app
- WebSocket client to hardware service
- UI updates based on messages
- Large fonts for seniors

### **3. Frontend Update**
**File:** `frontend/app/radio.tsx`
- Add WebSocket client connection
- Send VAPI events to hardware service
- Receive START_VOICE command
- Hide UI or minimal display

### **4. Startup Script**
**File:** `start-cogito.sh`
- Starts all three services
- Handles process management
- Auto-launches on boot

---

## 🔑 Key Implementation Details

### **WebSocket Messages**

**Hardware Service receives from Browser:**
- `VOICE_STARTED` - VAPI call started
- `VOICE_STOPPED` - VAPI call ended
- `USER_SPEAKING` - User started speaking
- `USER_STOPPED_SPEAKING` - User stopped speaking
- `AI_SPEAKING` - AI is responding

**Hardware Service sends to Browser:**
- `START_VOICE` - Start VAPI conversation

**Hardware Service sends to Python GUI:**
- `VOICE_STARTED` - Voice AI started
- `VOICE_STOPPED` - Voice AI stopped
- `USER_SPEAKING` - User is speaking
- `AI_SPEAKING` - AI is speaking
- `NEW_MESSAGE` - Caregiver message
- `REMINDER` - Medication reminder

### **GPIO Button**
- Pin: 17
- Action: Falling edge trigger
- When pressed: Send `START_VOICE` to browser

### **FM Radio Control**
- Method: I2C
- Bus: 1 (Raspberry Pi default)
- Commands:
  - Duck: Set volume to 20%
  - Mute: Set volume to 0%
  - Restore: Set volume back to saved level

### **Python GUI UI Elements**
- Status indicator (colored dot)
- Status text (large font)
- Activity display
- Messages area
- Time display

---

## 🧪 Testing Order

1. **Test Hardware Service alone**
   - Start service
   - Check health endpoint
   - Test WebSocket connections

2. **Test Python GUI alone**
   - Start GUI
   - Connect to hardware service
   - Verify UI updates

3. **Test Browser alone**
   - Start frontend
   - Connect to hardware service
   - Verify VAPI events sent

4. **Test Full Integration**
   - Start all services
   - Press GPIO button
   - Verify voice starts
   - Verify UI updates
   - Verify radio ducks

---

## 📋 Files to Reference

- `hardware-service/SETUP_GUIDE.md` - Complete step-by-step guide
- `hardware-service/hardware-service.js` - Base code (already created)
- Architecture diagram in SETUP_GUIDE.md

---

**When you're ready tomorrow, just say "implement the hardware service" and I'll have all this context! 🚀**

