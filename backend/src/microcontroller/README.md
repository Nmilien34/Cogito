# Microcontroller Module - Raspberry Pi Integration

## 📋 Overview

This module handles communication between Raspberry Pi devices and the backend, including:
- Device registration and authentication
- Status monitoring and health checks
- Audio streaming for voice AI
- Configuration management

---

## 🎯 Two Approaches for Audio

### Option 1: Browser-Based (EASIER) ✅ Recommended

**See:** `AUDIO_ARCHITECTURE.md` for full details

**Quick Setup:**
```bash
# On Raspberry Pi
sudo apt-get install chromium-browser
chromium-browser --kiosk --app=http://your-backend.com/radio
```

**Why it's easier:**
- Browser handles microphone/speaker automatically
- VAPI Web SDK handles all audio streaming
- No code needed for audio handling
- Can be running in 30 minutes

---

### Option 2: Full Code Infrastructure

**See:** `AUDIO_ARCHITECTURE.md` and `raspberry_pi_example.py`

**Requirements:**
- Python 3.7+
- pyaudio
- python-socketio

**Installation:**
```bash
sudo apt-get install python3-pyaudio
pip3 install python-socketio pyaudio
```

**Usage:**
```python
from raspberry_pi_example import RaspberryPiAudioStreamer

streamer = RaspberryPiAudioStreamer()
streamer.start_streaming()
```

---

## 🔌 API Endpoints

### Device Management

#### Register Device
```http
POST /api/microcontroller/register
Content-Type: application/json

{
  "deviceId": "raspberry-pi-123",
  "deviceName": "FM Radio Device #1",
  "deviceType": "microcontroller",
  "firmwareVersion": "1.0.0",
  "macAddress": "AA:BB:CC:DD:EE:FF"
}
```

**Response:**
```json
{
  "success": true,
  "deviceId": "raspberry-pi-123",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 604800,
  "deviceInfo": { ... }
}
```

#### Get Device Status
```http
GET /api/microcontroller/status
Authorization: Bearer <device-token>
```

#### Update Device Status (Heartbeat)
```http
POST /api/microcontroller/status
Authorization: Bearer <device-token>
Content-Type: application/json

{
  "status": "online",
  "batteryLevel": 85,
  "signalStrength": -45,
  "uptime": 3600
}
```

#### Get Device Configuration
```http
GET /api/microcontroller/config
Authorization: Bearer <device-token>
```

#### Update Device Configuration
```http
PUT /api/microcontroller/config
Authorization: Bearer <device-token>
Content-Type: application/json

{
  "volume": 70,
  "brightness": 50,
  "autoStart": true
}
```

---

## 🔌 WebSocket Events (Socket.io)

### Client → Server

#### Authenticate Device
```javascript
socket.emit('device_authenticate', {
  deviceId: 'raspberry-pi-123',
  token: 'device-access-token'
});
```

#### Start Audio Stream
```javascript
socket.emit('start_audio_stream', {
  deviceId: 'raspberry-pi-123'
});
```

#### Send Audio Chunk
```javascript
socket.emit('audio_chunk', {
  deviceId: 'raspberry-pi-123',
  audio: 'base64_encoded_audio',
  timestamp: 1234567890,
  sequence: 42,
  sampleRate: 16000,
  channels: 1,
  format: 'pcm16'
});
```

#### Stop Audio Stream
```javascript
socket.emit('stop_audio_stream', {
  deviceId: 'raspberry-pi-123'
});
```

### Server → Client

#### Audio Response
```javascript
socket.on('audio_response', (data) => {
  // data.audio = base64 encoded audio
  // data.sequence = sequence number
  // data.timestamp = timestamp
});
```

#### Stream Started
```javascript
socket.on('stream_started', (data) => {
  // Audio stream started successfully
});
```

#### Stream Stopped
```javascript
socket.on('stream_stopped', (data) => {
  // Audio stream stopped
});
```

---

## 🎤 Audio Streaming Flow

```
┌─────────────┐
│ Raspberry Pi│
│  Microphone │
│      ↓      │
│ Audio Chunk │ (16-bit PCM, 16kHz, mono)
│      ↓      │
│ Base64 Encode│
│      ↓      │
│ WebSocket   │
└─────────────┘
      │
      ▼
┌─────────────┐
│   Backend   │
│      ↓      │
│ Audio Chunk │
│      ↓      │
│ Forward VAPI│
│      ↓      │
│ Audio Response│
│      ↓      │
│ WebSocket   │
└─────────────┘
      │
      ▼
┌─────────────┐
│ Raspberry Pi│
│      ↓      │
│ Base64 Decode│
│      ↓      │
│   Speaker   │
└─────────────┘
```

---

## 📦 Installation on Raspberry Pi

### Option 1: Browser (Easiest)

```bash
# Install Chromium
sudo apt-get update
sudo apt-get install -y chromium-browser

# Create auto-start script
cat > /home/pi/start-radio.sh << EOF
#!/bin/bash
chromium-browser --kiosk --app=http://your-backend.com/radio
EOF

chmod +x /home/pi/start-radio.sh

# Add to autostart
echo "@lxterminal -e /home/pi/start-radio.sh" >> ~/.config/lxsession/LXDE-pi/autostart
```

### Option 2: Python Code

```bash
# Install dependencies
sudo apt-get install -y python3-pyaudio portaudio19-dev
pip3 install python-socketio pyaudio

# Clone your code
git clone your-repo
cd your-repo

# Configure
cp .env.example .env
# Edit .env with your backend URL and device token

# Run
python3 raspberry_pi_example.py
```

---

## 🔧 Troubleshooting

### Microphone Not Found
```python
# List all audio devices
import pyaudio
audio = pyaudio.PyAudio()
for i in range(audio.get_device_count()):
    print(audio.get_device_info_by_index(i))
```

### Audio Quality Issues
- Check sample rate (should be 16000 Hz)
- Check chunk size (1600 samples = 100ms)
- Check audio format (16-bit PCM)
- Verify microphone permissions

### WebSocket Connection Issues
- Check backend URL is correct
- Verify device token is valid
- Check firewall settings
- Ensure backend is running

---

## 📚 Next Steps

1. **Choose your approach:** Browser (easier) or Full Code (more control)
2. **Set up Raspberry Pi:** Install dependencies
3. **Register device:** Get device token from backend
4. **Test audio streaming:** Verify microphone and speaker work
5. **Integrate with VAPI:** Connect to voice AI assistant

---

## 🎯 Recommendation

**Start with Browser-Based approach** for quick MVP, then migrate to Full Code if you need custom features!

