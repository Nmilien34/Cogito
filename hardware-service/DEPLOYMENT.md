# Cogito Hardware Deployment Guide

Complete guide for deploying Cogito on Raspberry Pi with button-controlled Vapi integration.

## Hardware Configuration

### Verified Pin Configuration
- **Button**: GPIO 17 (BCM numbering) with internal pull-up resistor
- **I2C Bus 1**: TEA5767 FM Radio at address 0x60
- **Microphone**: SPH0645 I2S at `plughw:1,0`
- **Audio Output**: Pi audio jack at `plughw:0,0`

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│           RASPBERRY PI (Local)               │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ Chromium (Kiosk Mode)                  │ │
│  │ - Frontend (React Native Web)          │ │
│  │ - Vapi Web SDK                         │ │
│  │ - WebSocket to hardware-service        │ │
│  └────────────────────────────────────────┘ │
│                    ↕                         │
│  ┌────────────────────────────────────────┐ │
│  │ hardware-service.js (Node.js)          │ │
│  │ - Port 3001                            │ │
│  │ - WebSocket server                     │ │
│  │ - Mode coordination                    │ │
│  └────────────────────────────────────────┘ │
│         ↕                 ↕                  │
│  ┌──────────────┐  ┌────────────────────┐  │
│  │ Button (GPIO)│  │ Radio (I2C)        │  │
│  │ Pin 17       │  │ TEA5767 @ 0x60     │  │
│  └──────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────┘
                    ↕
         Internet → Vapi Platform
```

## Flow Diagram

```
1. User presses button (GPIO 17)
   ↓
2. button-vapi-handler.py detects press
   ↓
3. POST to hardware-service → /api/mode/set
   ↓
4. hardware-service executes:
   - python3 radio-control.py stop (mute radio)
   - io.emit('start-voice') → WebSocket
   ↓
5. Frontend (Chromium) receives 'start-voice'
   ↓
6. VapiService.startConversation()
   ↓
7. User speaks → Mic → Browser → Vapi
   ↓
8. Vapi responds → Browser → Pi audio jack
   ↓
9. After 10s silence → auto-return to radio
   ↓
10. hardware-service → io.emit('stop-voice')
    ↓
11. Frontend → VapiService.stopConversation()
    ↓
12. Radio resumes
```

## Prerequisites

### 1. System Packages

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js (v18+ recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3 and pip
sudo apt-get install -y python3 python3-pip

# Install Chromium
sudo apt-get install -y chromium-browser

# Install I2C tools
sudo apt-get install -y i2c-tools

# Install audio tools
sudo apt-get install -y alsa-utils
```

### 2. Enable Hardware Interfaces

```bash
# Enable I2C and audio
sudo raspi-config
# Navigate to: Interface Options
# Enable: I2C
# Enable: Audio (if not already enabled)
```

Add to `/boot/config.txt`:
```
# I2C
dtparam=i2c_arm=on

# I2S Microphone (SPH0645)
dtoverlay=i2s-mmap
dtoverlay=googlevoicehat-soundcard

# Audio output
dtparam=audio=on
```

Reboot after changes:
```bash
sudo reboot
```

### 3. User Permissions

```bash
# Add user to required groups
sudo usermod -a -G gpio pi
sudo usermod -a -G i2c pi
sudo usermod -a -G audio pi

# Logout and login for changes to take effect
```

## Installation

### 1. Clone and Setup Repository

```bash
cd ~
git clone <your-repo-url> cogito
cd cogito
```

### 2. Install Hardware Service Dependencies

```bash
cd ~/cogito/hardware-service
npm install

# Install Python dependencies
pip3 install -r python/requirements.txt
```

### 3. Install Frontend Dependencies

```bash
cd ~/cogito/frontend
npm install
```

### 4. Configure Environment Variables

#### Hardware Service

```bash
cd ~/cogito/hardware-service
cp .env.example .env
nano .env
```

The `.env` file is already configured with correct defaults.

#### Frontend

```bash
cd ~/cogito/frontend
nano .env
```

**IMPORTANT**: Update these values:
```env
EXPO_PUBLIC_VAPI_PUBLIC_KEY=your-actual-vapi-public-key
EXPO_PUBLIC_VAPI_ASSISTANT_ID=df2a9bc2-b7e1-4640-af14-1e69930712c5
EXPO_PUBLIC_HARDWARE_SERVICE_URL=http://localhost:3001
```

Get your Vapi public key from: https://vapi.ai/dashboard

### 5. Test Hardware Components

```bash
# Test I2C devices
i2cdetect -y 1
# Should show device at 0x60 (TEA5767)

# Test radio control
cd ~/cogito/hardware-service
python3 python/radio-control.py status
python3 python/radio-control.py set 99.1
python3 python/radio-control.py off

# Test button (should print press detections)
python3 python/test-button.py
```

### 6. Test Services Manually

#### Terminal 1: Hardware Service
```bash
cd ~/cogito/hardware-service
node hardware-service.js
```

#### Terminal 2: Button Handler
```bash
cd ~/cogito/hardware-service
python3 python/button-vapi-handler.py
```

#### Terminal 3: Frontend
```bash
cd ~/cogito/frontend
npm run web
# Or for production: npx serve -s dist -p 8081
```

#### Terminal 4: Chromium
```bash
DISPLAY=:0 chromium-browser --kiosk http://localhost:8081
```

Test button press - should see:
1. Hardware service logs mode change
2. Radio mutes
3. Frontend starts Vapi conversation

## Production Deployment (Systemd Services)

### 1. Install Service Files

```bash
cd ~/cogito/hardware-service

# Copy service files
sudo cp systemd/cogito-hardware.service /etc/systemd/system/
sudo cp systemd/cogito-button.service /etc/systemd/system/
sudo cp systemd/cogito-frontend.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload
```

### 2. Enable and Start Services

```bash
# Enable auto-start on boot
sudo systemctl enable cogito-hardware.service
sudo systemctl enable cogito-button.service
sudo systemctl enable cogito-frontend.service

# Start services now
sudo systemctl start cogito-hardware.service
sudo systemctl start cogito-button.service
sudo systemctl start cogito-frontend.service
```

### 3. Check Service Status

```bash
# Check all services
sudo systemctl status cogito-hardware.service
sudo systemctl status cogito-button.service
sudo systemctl status cogito-frontend.service

# View logs
sudo journalctl -u cogito-hardware.service -f
sudo journalctl -u cogito-button.service -f
sudo journalctl -u cogito-frontend.service -f
```

### 4. Service Management

```bash
# Restart a service
sudo systemctl restart cogito-hardware.service

# Stop a service
sudo systemctl stop cogito-button.service

# Disable auto-start
sudo systemctl disable cogito-frontend.service

# View recent logs
sudo journalctl -u cogito-hardware.service -n 50
```

## Troubleshooting

### Button Not Working

```bash
# Check GPIO permissions
groups
# Should include 'gpio'

# Test button directly
cd ~/cogito/hardware-service
python3 python/test-button.py
```

### Radio Not Working

```bash
# Check I2C
i2cdetect -y 1

# Check permissions
groups
# Should include 'i2c'

# Test radio
python3 python/radio-control.py status
```

### Frontend Can't Connect to Vapi

1. Check `.env` file has correct Vapi public key
2. Check internet connection
3. Check browser console (F12 in Chromium)
4. Verify assistant ID is correct

### WebSocket Connection Failed

```bash
# Check hardware service is running
sudo systemctl status cogito-hardware.service

# Check port 3001 is listening
sudo netstat -tlnp | grep 3001

# Test WebSocket manually
curl http://localhost:3001/health
```

### Audio Issues

```bash
# List audio devices
arecord -l
aplay -l

# Test microphone
arecord -D plughw:1,0 -f S32_LE -r 48000 -c 1 -d 3 test.wav
aplay test.wav

# Adjust volume
alsamixer
```

## Update Deployment

```bash
# On your computer
git add .
git commit -m "Update code"
git push

# On Raspberry Pi
cd ~/cogito
git pull

# Restart services
sudo systemctl restart cogito-hardware.service
sudo systemctl restart cogito-button.service
sudo systemctl restart cogito-frontend.service
```

## Auto-Start on Boot

All services are configured to auto-start after boot. Boot sequence:

1. System starts
2. `cogito-hardware.service` starts (Node.js server)
3. `cogito-button.service` starts (waits for hardware service)
4. X11 desktop loads
5. `cogito-frontend.service` starts (Chromium kiosk mode)

## Performance Tips

### Disable Unnecessary Services

```bash
# Disable Bluetooth (if not needed)
sudo systemctl disable bluetooth.service

# Disable WiFi (if using Ethernet)
sudo systemctl disable wpa_supplicant.service
```

### Optimize Boot Time

Add to `/boot/config.txt`:
```
disable_splash=1
boot_delay=0
```

### Reduce Chromium Memory Usage

Edit `systemd/cogito-frontend.service`:
```
--disk-cache-size=50000000 \
--media-cache-size=50000000
```

## Security

### Lock Down SSH

```bash
# Change default password
passwd

# Disable password auth (use keys only)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart ssh
```

### Firewall

```bash
sudo apt-get install ufw
sudo ufw allow 22/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
```

## Monitoring

### Check System Resources

```bash
# CPU/Memory
htop

# Temperature
vcgencmd measure_temp

# Disk space
df -h
```

### Service Logs

```bash
# All Cogito services
sudo journalctl -u cogito-* -f

# Last hour
sudo journalctl -u cogito-hardware.service --since "1 hour ago"
```

## Support

For issues, check:
1. Service logs: `sudo journalctl -u cogito-hardware.service -n 100`
2. Hardware connections (GPIO 17, I2C bus)
3. Internet connectivity (for Vapi)
4. Vapi dashboard for API errors

## Assistant ID

Your Vapi assistant ID is: `df2a9bc2-b7e1-4640-af14-1e69930712c5`

All prompt engineering is done on the Vapi platform dashboard.
