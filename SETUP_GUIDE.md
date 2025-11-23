# 🚀 Complete Setup Guide - From Clone to Running

This guide will walk you through setting up the entire Cogito system, from cloning the repository to running it on your Raspberry Pi.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone the Repository](#clone-the-repository)
3. [Backend Setup (Server/Cloud)](#backend-setup-servercloud)
4. [Hardware Service Setup (Raspberry Pi)](#hardware-service-setup-raspberry-pi)
5. [Testing](#testing)
6. [Running Everything](#running-everything)

---

## 🔧 Prerequisites

### For Backend (Server/Cloud):
- **Node.js** (v18 or higher)
- **MongoDB** (local or Atlas cloud)
- **Git**
- **npm** or **yarn**

### For Raspberry Pi:
- **Raspberry Pi 4** (or compatible)
- **Raspberry Pi OS** (latest)
- **Node.js** (v18 or higher)
- **Python 3** (usually pre-installed)
- **Git**
- **I2C enabled** (for TEA5767 radio)
- **GPIO access** (for buttons)

---

## 📥 Clone the Repository

### Option 1: Full Clone (Recommended for Development)

```bash
# Clone the entire repository
git clone <your-repo-url> cogito
cd cogito
```

### Option 2: Sparse Checkout (Only Hardware Service)

If you only want the hardware service on Raspberry Pi:

```bash
# Clone with sparse checkout
git clone --filter=blob:none --sparse <your-repo-url> cogito
cd cogito
git sparse-checkout set hardware-service
```

---

## 🖥️ Backend Setup (Server/Cloud)

The backend runs on your server or cloud platform and handles API requests, database, and VAPI webhooks.

### Step 1: Navigate to Backend

```bash
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# Copy example (if you have one)
cp .env.example .env

# Or create new .env file
nano .env
```

Add the following to `.env`:

```env
# Server
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/cogito
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cogito

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# VAPI (Required)
VAPI_API_KEY=your-vapi-api-key-here
VAPI_ASSISTANT_CONFIG_ID=df2a9bc2-b7e1-4640-af14-1e69930712c5
VAPI_PHONE_NUMBER_ID=2bb402a3-149e-4027-ad03-6f04e4d33a15

# CORS (allow frontend and hardware service)
CORS_ORIGIN=http://localhost:8081,http://localhost:3001

# Optional: Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@cogito.ai

# Optional: Twilio (SMS)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Step 4: Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB (varies by OS)
# Ubuntu/Debian:
sudo apt-get install mongodb

# macOS:
brew install mongodb-community

# Start MongoDB
sudo systemctl start mongodb  # Linux
brew services start mongodb-community  # macOS
```

**Option B: MongoDB Atlas (Cloud - Recommended)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free cluster
3. Get your connection string
4. Add it to `.env` as `MONGODB_URI`

### Step 5: Build and Run Backend

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
# Build TypeScript
npm run build

# Run production server
npm start
```

The backend will start at `http://localhost:3000`

### Step 6: Verify Backend is Running

```bash
curl http://localhost:3000/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

---

## 🍓 Hardware Service Setup (Raspberry Pi)

The hardware service runs on your Raspberry Pi and coordinates GPIO, radio control, and communication between Python GUI and browser.

### Step 1: Enable I2C and GPIO on Raspberry Pi

```bash
# Enable I2C
sudo raspi-config
# Navigate to: Interfacing Options > I2C > Enable

# Or manually:
sudo echo "dtparam=i2c_arm=on" >> /boot/config.txt
sudo reboot
```

### Step 2: Verify I2C is Enabled

```bash
# Check if I2C is loaded
lsmod | grep i2c

# List I2C devices (should see TEA5767 at 0x60)
sudo i2cdetect -y 1
```

You should see something like:
```
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
00:          -- -- -- -- -- -- -- -- -- -- -- -- -- 
10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
20: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
30: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
40: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
50: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
60: 60 -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
70: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
```

### Step 3: Navigate to Hardware Service

```bash
cd hardware-service
```

### Step 4: Install Python Dependencies

```bash
# Install Python package for I2C
pip3 install -r python/requirements.txt
```

This will install:
- `smbus2` (for I2C communication)

### Step 5: Install Node.js Dependencies

```bash
# Install Node.js packages
npm install
```

This will install:
- `express` (HTTP server)
- `ws` (WebSocket server)
- `onoff` (GPIO control)

### Step 6: Test Python Radio Control

Before running the full service, test the Python script directly:

```bash
# Test setting frequency to 97.1 MHz
python3 python/radio-control.py 97.1

# Test stopping radio
python3 python/radio-control.py stop

# Test another frequency
python3 python/radio-control.py 101.5
```

You should see:
```
Tuned to 97.1 MHz
```

### Step 7: Run Hardware Service

```bash
# Start the hardware service
node hardware-service.js
```

You should see:
```
🚀 Hardware Service started
📡 WebSocket server: ws://localhost:8080
🌐 HTTP server: http://localhost:3001

✅ GPIO initialized (pin 17)
✅ Ready to coordinate hardware!

Waiting for clients:
  - Python GUI: ws://localhost:8080?client=display
  - Browser: ws://localhost:8080?client=browser

Radio endpoints:
  - GET  http://localhost:3001/radio/status
  - POST http://localhost:3001/radio/frequency

Python radio control: python/radio-control.py
```

### Step 8: Test Hardware Service Endpoints

**In another terminal, test the endpoints:**

```bash
# Health check
curl http://localhost:3001/health

# Get radio status
curl http://localhost:3001/radio/status

# Set radio frequency
curl -X POST http://localhost:3001/radio/frequency \
  -H "Content-Type: application/json" \
  -d '{"frequency": 97.1}'
```

---

## 🧪 Testing

### Test 1: Python Radio Control

```bash
cd hardware-service
python3 python/radio-control.py 97.1
```

**Expected:** Radio tunes to 97.1 MHz

### Test 2: Hardware Service HTTP Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Set frequency via HTTP
curl -X POST http://localhost:3001/radio/frequency \
  -H "Content-Type: application/json" \
  -d '{"frequency": 101.5}'

# Check status
curl http://localhost:3001/radio/status
```

**Expected:** JSON response with radio status

### Test 3: GPIO Button (if connected)

1. Press the button connected to GPIO pin 17
2. Check hardware service logs
3. Should see: `🔘 Voice button pressed!`

### Test 4: Backend Health

```bash
curl http://localhost:3000/health
```

**Expected:** `{"status": "ok", ...}`

---

## 🚀 Running Everything

### On Server/Cloud (Backend):

```bash
cd backend
npm run build
npm start
```

### On Raspberry Pi (Hardware Service):

```bash
cd hardware-service
node hardware-service.js
```

### Auto-Start on Raspberry Pi (Optional)

Create a systemd service to auto-start the hardware service:

```bash
# Create service file
sudo nano /etc/systemd/system/cogito-hardware.service
```

Add:
```ini
[Unit]
Description=Cogito Hardware Service
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/cogito/hardware-service
ExecStart=/usr/bin/node hardware-service.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable cogito-hardware
sudo systemctl start cogito-hardware

# Check status
sudo systemctl status cogito-hardware

# View logs
journalctl -u cogito-hardware -f
```

---

## 🔍 Troubleshooting

### Problem: I2C not detected

**Solution:**
```bash
# Check if I2C is enabled
sudo raspi-config
# Interfacing Options > I2C > Enable

# Reboot
sudo reboot

# Check again
sudo i2cdetect -y 1
```

### Problem: GPIO permission denied

**Solution:**
```bash
# Add user to gpio group
sudo usermod -a -G gpio $USER

# Logout and login again
```

### Problem: Python script can't find smbus2

**Solution:**
```bash
# Reinstall
pip3 install --user smbus2

# Or use system-wide
sudo pip3 install smbus2
```

### Problem: Node.js onoff module fails

**Solution:**
```bash
# Rebuild native modules
npm rebuild onoff

# Or reinstall
npm uninstall onoff
npm install onoff
```

### Problem: Radio not responding

**Solution:**
1. Check I2C connection (wiring)
2. Verify TEA5767 is at address 0x60
3. Test Python script directly first
4. Check hardware service logs

### Problem: Backend can't connect to MongoDB

**Solution:**
```bash
# Check MongoDB is running
sudo systemctl status mongodb

# Check connection string in .env
# Test connection
mongosh "your-mongodb-uri"
```

---

## 📝 Next Steps

1. **Python GUI**: Implement the display GUI that connects to `ws://localhost:8080?client=display`
2. **Browser Setup**: Set up headless Chromium with VAPI Web SDK
3. **Wiring**: Connect GPIO button to pin 17
4. **Testing**: Test full voice interaction flow

---

## 📞 Support

If you encounter issues:
1. Check the logs
2. Verify all dependencies are installed
3. Test each component individually
4. Check wiring and hardware connections

---

## ✅ Checklist

- [ ] Repository cloned
- [ ] Backend dependencies installed
- [ ] Backend `.env` configured
- [ ] MongoDB running
- [ ] Backend server running
- [ ] Raspberry Pi I2C enabled
- [ ] Python dependencies installed
- [ ] Node.js dependencies installed
- [ ] Python radio control tested
- [ ] Hardware service running
- [ ] Hardware service endpoints tested
- [ ] GPIO button connected (optional)
- [ ] Auto-start configured (optional)

---

**You're all set! 🎉**

The system is now ready to coordinate between backend, hardware service, Python GUI, and browser.

