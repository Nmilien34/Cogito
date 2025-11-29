# ANO Encoder - PM2 Setup Guide

The encoder service is now integrated with your existing PM2 configuration for auto-start on reboot.

## 🚀 Quick Start

### On Your Raspberry Pi:

```bash
# 1. Navigate to project root
cd /home/radioassistant/Desktop/Cogito

# 2. Install Python dependencies
pip3 install -r hardware-service/python/requirements-encoder.txt

# 3. Restart all PM2 services with new config
pm2 reload ecosystem.config.js

# 4. Save PM2 configuration (for auto-start on reboot)
pm2 save

# 5. Verify encoder service is running
pm2 status
```

## 📊 PM2 Commands

### View All Services
```bash
pm2 status
# You should see:
# - hardware-service
# - button-handler
# - encoder-service  ← NEW!
# - backend
# - frontend
```

### View Encoder Logs
```bash
# Real-time logs
pm2 logs encoder-service

# Last 100 lines
pm2 logs encoder-service --lines 100

# Error logs only
pm2 logs encoder-service --err

# Clear logs
pm2 flush encoder-service
```

### Control Encoder Service
```bash
# Stop encoder
pm2 stop encoder-service

# Start encoder
pm2 start encoder-service

# Restart encoder
pm2 restart encoder-service

# Delete encoder from PM2
pm2 delete encoder-service
```

### Monitor All Services
```bash
# Interactive dashboard
pm2 monit

# Shows CPU, memory, logs in real-time
# Press Ctrl+C to exit
```

## 🔄 Auto-Start on Reboot

### First Time Setup (Only Once)
```bash
# Generate PM2 startup script
pm2 startup

# This will print a command like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u radioassistant --hp /home/radioassistant

# Copy and run that command
# Then save current PM2 configuration:
pm2 save
```

### After Making Changes
```bash
# Whenever you update ecosystem.config.js:
pm2 reload ecosystem.config.js

# Save the new configuration:
pm2 save
```

## 🧪 Testing

### Test Encoder Before Adding to PM2
```bash
# Test manually first
cd /home/radioassistant/Desktop/Cogito/hardware-service/python
python3 encoder_service.py

# If it works (you see volume/radio changes), press Ctrl+C
# Then add to PM2
```

### Verify Encoder in PM2
```bash
# Check status
pm2 status encoder-service

# Should show:
# status: online
# restarts: 0 (or low number)
# uptime: increasing

# Check logs for errors
pm2 logs encoder-service --lines 50
```

## 📁 Log Files

PM2 stores logs in the project's `logs/` directory:

```bash
# Encoder output logs
tail -f /home/radioassistant/Desktop/Cogito/logs/encoder-out.log

# Encoder error logs
tail -f /home/radioassistant/Desktop/Cogito/logs/encoder-error.log
```

## 🔧 Troubleshooting

### Service Shows "Errored" Status
```bash
# Check error logs
pm2 logs encoder-service --err --lines 50

# Common issues:
# 1. Python dependencies not installed
#    → pip3 install -r hardware-service/python/requirements-encoder.txt
#
# 2. I2C permissions
#    → sudo usermod -aG i2c $USER
#    → Reboot
#
# 3. Encoder not connected
#    → sudo i2cdetect -y 1
#    → Should show "49"
```

### Service Keeps Restarting
```bash
# Check restart count
pm2 status

# If restarts > 10, check logs
pm2 logs encoder-service

# Look for:
# - "Failed to initialize encoder"
# - "Permission denied"
# - "Module not found"
```

### Backend API Not Reachable
```bash
# Check backend is running
pm2 status backend

# Should show "online"
# If not, start it:
pm2 start backend

# Verify backend health
curl http://localhost:4000/health
```

## 🎛️ Configuration

### Change PM2 Settings

Edit `ecosystem.config.js` in project root:

```javascript
{
  name: 'encoder-service',
  cwd: './hardware-service/python',
  script: 'encoder_service.py',
  interpreter: 'python3',
  instances: 1,
  autorestart: true,
  max_memory_restart: '100M',  // Restart if uses > 100MB
  // ... other settings
}
```

After editing:
```bash
pm2 reload ecosystem.config.js
pm2 save
```

### Disable Auto-Restart (for debugging)

```bash
# Stop auto-restart temporarily
pm2 stop encoder-service

# Run manually for debugging
cd /home/radioassistant/Desktop/Cogito/hardware-service/python
python3 encoder_service.py

# Re-enable auto-restart
pm2 start encoder-service
```

## 📊 PM2 vs Systemd

**Why PM2 is better for this project:**
- ✅ Consistent with other services (button-handler, backend, frontend)
- ✅ Easy log management (`pm2 logs`)
- ✅ Simple restart/reload commands
- ✅ Built-in monitoring (`pm2 monit`)
- ✅ Works cross-platform (not just Linux)
- ✅ Easier to manage multiple services at once

**Systemd service file is still provided** in case you prefer it, but PM2 is recommended.

## 🔍 Useful PM2 Commands

```bash
# Restart everything
pm2 restart all

# Stop everything
pm2 stop all

# Start only encoder
pm2 start encoder-service

# View detailed info
pm2 info encoder-service

# Show environment variables
pm2 env 0  # Where 0 is the process ID from pm2 status

# Reset restart counter
pm2 reset encoder-service

# Update PM2 itself
npm install -g pm2@latest
pm2 update
```

## 🆘 Emergency Recovery

If everything breaks:

```bash
# 1. Stop all PM2 processes
pm2 stop all

# 2. Delete all PM2 processes
pm2 delete all

# 3. Start fresh from config
pm2 start ecosystem.config.js

# 4. Save new configuration
pm2 save

# 5. Verify
pm2 status
```

## 📝 Complete Startup Sequence

When Raspberry Pi boots:

1. **PM2 startup script** runs (configured via `pm2 startup`)
2. **PM2 loads saved configuration** (from `pm2 save`)
3. **All services start in order:**
   - hardware-service
   - button-handler
   - **encoder-service** ← NEW!
   - backend
   - frontend
4. **Auto-restart** if any service crashes

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] `pm2 status` shows all 5 services as "online"
- [ ] `pm2 logs encoder-service` shows "Service started - monitoring encoder events..."
- [ ] Turn encoder → volume changes
- [ ] Press buttons → radio scans up/down
- [ ] Backend at http://localhost:4000/health returns "ok"
- [ ] Reboot Pi → all services auto-start
- [ ] `pm2 logs` shows no errors

## 🎉 Done!

Your encoder service is now:
- ✅ Managed by PM2
- ✅ Auto-starts on reboot
- ✅ Auto-restarts on crash
- ✅ Integrated with backend
- ✅ Logged to files
- ✅ Easy to monitor and control

---

**Quick Reference:**
```bash
pm2 status                    # Check all services
pm2 logs encoder-service      # View encoder logs
pm2 restart encoder-service   # Restart encoder
pm2 monit                     # Live monitoring
pm2 save                      # Save configuration
```
