# 🎛️ ANO Encoder - Quick Start Guide

## ⚡ Super Quick Setup (3 Commands)

On your Raspberry Pi:

```bash
# 1. Install
cd /home/radioassistant/Desktop/Cogito/hardware-service/python
./install-encoder-pm2.sh

# 2. Start with PM2
cd /home/radioassistant/Desktop/Cogito
pm2 reload ecosystem.config.js
pm2 save

# 3. Done! Check it's working
pm2 logs encoder-service
```

**Turn the dial** → Volume changes
**Press Up/Down buttons** → Radio scans

---

## 📊 PM2 Quick Commands

```bash
# View all services
pm2 status

# View encoder logs (real-time)
pm2 logs encoder-service

# Restart encoder
pm2 restart encoder-service

# Stop encoder
pm2 stop encoder-service

# Live monitoring (CPU, memory, logs)
pm2 monit
```

---

## 🔧 What Was Added to PM2

Your `ecosystem.config.js` now includes:

```javascript
{
  name: 'encoder-service',
  script: 'encoder_service.py',
  interpreter: 'python3',
  autorestart: true,
  // Logs: ./logs/encoder-out.log & encoder-error.log
}
```

---

## 🎮 Controls

| Action | Result |
|--------|--------|
| 🔄 Turn clockwise | Volume UP |
| 🔄 Turn counter-clockwise | Volume DOWN |
| ⬆️ Press Up/Right | Scan radio UP |
| ⬇️ Press Down/Left | Scan radio DOWN |

---

## 🚀 Auto-Start on Reboot

Your encoder service will **automatically start** when your Raspberry Pi boots, along with all your other services (backend, frontend, etc.).

To verify auto-start is configured:

```bash
# Check PM2 startup is enabled
pm2 startup

# If not enabled, run the command it provides, then:
pm2 save
```

---

## 🔍 Troubleshooting

### Encoder not working?

```bash
# Check service is running
pm2 status encoder-service
# Should show "online"

# Check for errors
pm2 logs encoder-service --err

# Verify encoder is connected
sudo i2cdetect -y 1
# Should show "49" in the grid
```

### Common Fixes

**Service shows "errored":**
```bash
# Check I2C permissions
groups
# Should include "i2c"

# If not, run:
sudo usermod -aG i2c $USER
# Then reboot
```

**Volume not changing:**
```bash
# Test amixer directly
amixer set Master 50%
amixer get Master
```

**Radio not scanning:**
```bash
# Check backend is running
pm2 status backend

# Test radio script
python3 /path/to/radio-control.py status
```

---

## 📁 Files Created

```
cogito/
├── ecosystem.config.js         ← Updated with encoder-service
└── hardware-service/python/
    ├── ano_encoder.py         ← Main encoder class
    ├── encoder_service.py     ← Background service
    ├── install-encoder-pm2.sh ← PM2 installer
    ├── requirements-encoder.txt
    ├── PM2_SETUP.md          ← Detailed PM2 guide
    └── ENCODER_SETUP.md      ← Full setup guide
```

---

## 💡 Tips

- **Live monitoring**: `pm2 monit` shows CPU, memory, and logs in real-time
- **Clear logs**: `pm2 flush encoder-service` clears old logs
- **Restart all**: `pm2 restart all` restarts all Cogito services
- **Stop all**: `pm2 stop all` stops all services
- **Save changes**: Always run `pm2 save` after making changes

---

## 📚 Documentation

- **PM2 Commands**: `PM2_SETUP.md`
- **Full Setup**: `ENCODER_SETUP.md`
- **This Guide**: `ENCODER_QUICK_START.md`

---

## ✅ Verify Everything Works

```bash
# 1. Check all services
pm2 status
# ✓ encoder-service should show "online"

# 2. Watch encoder logs
pm2 logs encoder-service

# 3. Turn the dial
# ✓ Logs should show: "🔊 Volume UP: XX%"

# 4. Press a button
# ✓ Logs should show: "📻 Scanning UP ▲"

# 5. Reboot to test auto-start
sudo reboot

# 6. After reboot, check services auto-started
pm2 status
# ✓ All 5 services should show "online"
```

---

**Need help?** Check the detailed guides in `hardware-service/python/`

**All working?** 🎉 Your encoder is now integrated with PM2 and will auto-start on every boot!
