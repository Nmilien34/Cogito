# Cogito Production Deployment Guide

This guide will help you set up Cogito to run automatically on your Raspberry Pi without needing to open terminals or connect to a monitor after the initial setup.

## Overview

The system uses **PM2** (process manager) to run all services automatically on boot, and **Firefox in kiosk mode** to display the web interface fullscreen.

## Services Managed by PM2

1. **hardware-service** - GPIO button management and radio control
2. **button-handler** - Python script for hardware events
3. **backend** - Express API with Socket.io (port 4000)
4. **frontend** - React web app (port 5174)

## FM Radio Auto-Start

The FM radio is configured to automatically start at boot and tune to **98.5 FM (WBLS)** using a systemd service.

---

## Initial Setup (One-Time)

### Step 1: Build Everything & Install PM2

Run the production setup script:

```bash
cd /path/to/cogito
./setup-production.sh
```

This will:
- Build the backend (TypeScript → JavaScript)
- Build the frontend (React → optimized production bundle)
- Install PM2 globally
- Create logs directory
- Configure PM2 startup

**IMPORTANT:** After running `setup-production.sh`, PM2 will show a command like:

```bash
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u pi --hp /home/pi
```

**Copy and run that exact command** to enable PM2 on boot.

### Step 2: Start All Services

```bash
cd /path/to/cogito
pm2 start ecosystem.config.js
```

This starts all 4 services in the background.

### Step 3: Save PM2 Configuration

```bash
pm2 save
```

This saves the current PM2 process list so it starts on boot.

### Step 4: Setup FM Radio Auto-Start

Install the radio startup service:

```bash
# Copy service file to systemd
sudo cp cogito-radio.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable radio to start on boot
sudo systemctl enable cogito-radio.service

# Start radio now (optional - to test)
sudo systemctl start cogito-radio.service

# Check status
sudo systemctl status cogito-radio.service
```

This will automatically tune to **98.5 FM (WBLS)** and turn the radio ON every time the Pi boots.

### Step 5: Setup Kiosk Mode (Optional but Recommended)

```bash
./setup-kiosk.sh
```

This will:
- Install Firefox if needed
- Configure auto-login to desktop
- Set Firefox to launch in fullscreen kiosk mode on startup
- Disable screen blanking
- Hide the mouse cursor

---

## PM2 Commands Reference

### View Status
```bash
pm2 status
```

### View Logs (All Services)
```bash
pm2 logs
```

### View Logs (Specific Service)
```bash
pm2 logs hardware-service
pm2 logs backend
pm2 logs frontend
pm2 logs button-handler
```

### Restart a Service
```bash
pm2 restart backend
```

### Restart All Services
```bash
pm2 restart all
```

### Stop All Services
```bash
pm2 stop all
```

### Delete All Services
```bash
pm2 delete all
```

### Monitor Resource Usage
```bash
pm2 monit
```

---

## Kiosk Mode

### Test Kiosk Mode Without Rebooting
```bash
./start-kiosk.sh
```

### Disable Kiosk Mode
```bash
rm ~/.config/autostart/cogito-kiosk.desktop
```

### Change Kiosk URL
Edit `start-kiosk.sh` and change the Firefox URL:
```bash
firefox --kiosk http://localhost:5174
```

---

## File Locations

- **PM2 Config:** `ecosystem.config.js`
- **Logs:** `logs/` directory
  - `hardware-out.log` / `hardware-error.log`
  - `button-out.log` / `button-error.log`
  - `backend-out.log` / `backend-error.log`
  - `frontend-out.log` / `frontend-error.log`
- **Kiosk Script:** `start-kiosk.sh`
- **Setup Scripts:**
  - `setup-production.sh`
  - `setup-kiosk.sh`

---

## Troubleshooting

### Services Won't Start

Check logs:
```bash
pm2 logs
```

Or check specific service:
```bash
pm2 logs backend
```

### Port Already in Use

Kill existing processes:
```bash
# Kill process on port 4000 (backend)
lsof -ti:4000 | xargs kill -9

# Kill process on port 5174 (frontend)
lsof -ti:5174 | xargs kill -9

# Restart PM2 services
pm2 restart all
```

### Frontend Not Loading

Make sure you built it first:
```bash
cd frontend
npm run build
pm2 restart frontend
```

### Backend Not Connecting

Check if MongoDB is running (if you use it):
```bash
sudo systemctl status mongodb
```

Rebuild backend:
```bash
cd backend
npm run build
pm2 restart backend
```

### Kiosk Not Starting

Check autostart file exists:
```bash
ls -la ~/.config/autostart/cogito-kiosk.desktop
```

Test manually:
```bash
./start-kiosk.sh
```

---

## Demo Day Workflow

### Before You Leave Home

1. Make sure everything is built and PM2 is configured:
   ```bash
   ./setup-production.sh
   pm2 start ecosystem.config.js
   pm2 save
   ```

2. Test kiosk mode:
   ```bash
   ./setup-kiosk.sh
   sudo reboot
   ```

3. After reboot, verify everything auto-starts

### On Demo Day

1. **Plug in Pi** (power + HDMI to screen)
2. **Wait 30-60 seconds** for boot
3. **FM Radio auto-starts** at 98.5 FM (WBLS) 📻
4. **Firefox auto-launches** in fullscreen showing the Cogito app
5. **Hardware buttons work** immediately

**That's it!** No terminals, no manual starting, no SSH needed. Radio plays automatically!

### If Something Goes Wrong

Connect keyboard/mouse and press `F11` to exit kiosk mode, then:

```bash
# Check what's running
pm2 status

# Restart everything
pm2 restart all

# Check logs
pm2 logs
```

---

## Updating Code

If you make changes to the code:

### Backend Changes
```bash
cd backend
npm run build
pm2 restart backend
```

### Frontend Changes
```bash
cd frontend
npm run build
pm2 restart frontend
```

### Hardware Service Changes
```bash
pm2 restart hardware-service
```

### Python Button Handler Changes
```bash
pm2 restart button-handler
```

---

## Complete Reset

To start fresh:

```bash
# Stop and delete all PM2 processes
pm2 delete all

# Remove saved PM2 config
pm2 save --force

# Disable PM2 startup
pm2 unstartup systemd

# Re-run setup
./setup-production.sh
pm2 start ecosystem.config.js
pm2 save
```

---

## Browser Compatibility

- **Firefox** ✅ Recommended (works with AudioContext fix)
- **Chromium** ❌ Has issues with hardware button → AudioContext

Always use **Firefox** for demos!

---

## Summary

**One-time setup:**
1. `./setup-production.sh` → Build everything, install PM2
2. `pm2 start ecosystem.config.js` → Start all services
3. `pm2 save` → Save configuration
4. Setup radio systemd service → Radio auto-starts at 98.5 FM
5. `./setup-kiosk.sh` → Auto-start Firefox on boot

**Result:**
- Plug in Pi → Everything starts automatically → Ready for demo!
- FM Radio automatically tunes to 98.5 FM (WBLS) and starts playing 📻
- No terminals needed
- No SSH needed
- Just power + screen + wait 60 seconds

---

Good luck with your demo! 🚀
