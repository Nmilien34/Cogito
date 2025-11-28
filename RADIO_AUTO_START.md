# FM Radio Auto-Start Setup

The FM radio is configured to automatically start at boot and tune to **98.5 FM (WBLS)**.

## Files Created

1. **start-radio.sh** - Startup script that tunes radio to 98.5 FM
2. **cogito-radio.service** - Systemd service that runs on boot
3. **setup-complete.sh** - All-in-one setup script (includes radio + PM2 + kiosk)

## Quick Setup

### Option 1: Complete Setup (Recommended)

Run everything at once:

```bash
./setup-complete.sh
```

This will:
- Build frontend & backend
- Setup PM2 for all services
- Configure FM radio auto-start
- Setup kiosk mode (optional)

### Option 2: Manual Radio Setup Only

If you already have PM2 configured and just want to add radio auto-start:

```bash
# Make scripts executable
chmod +x start-radio.sh

# Install systemd service
sudo cp cogito-radio.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable cogito-radio.service
sudo systemctl start cogito-radio.service

# Check status
sudo systemctl status cogito-radio.service
```

## How It Works

1. **On boot**, systemd runs `cogito-radio.service`
2. The service executes `start-radio.sh`
3. The script:
   - Waits 2 seconds for I2C bus to be ready
   - Tunes radio to 98.5 FM (WBLS)
   - Turns radio ON

## Manual Radio Control

You can still control the radio manually:

```bash
# Turn radio ON
python3 hardware-service/python/radio-control.py on

# Turn radio OFF
python3 hardware-service/python/radio-control.py off

# Set specific frequency
python3 hardware-service/python/radio-control.py set 98.5

# Scan up/down
python3 hardware-service/python/radio-control.py up
python3 hardware-service/python/radio-control.py down

# Check status
python3 hardware-service/python/radio-control.py status
```

## Changing Default Station

Edit `start-radio.sh` and change the frequency:

```bash
# Change this line:
python3 "$RADIO_SCRIPT" set 98.5

# To your desired frequency:
python3 "$RADIO_SCRIPT" set 99.1
```

Then restart the service:

```bash
sudo systemctl restart cogito-radio.service
```

## Troubleshooting

### Radio Not Starting on Boot

Check service status:
```bash
sudo systemctl status cogito-radio.service
```

View service logs:
```bash
sudo journalctl -u cogito-radio.service -n 50
```

### Test Radio Manually

```bash
# Test the startup script
./start-radio.sh

# Or test radio control directly
python3 hardware-service/python/radio-control.py on
```

### Disable Auto-Start

```bash
sudo systemctl disable cogito-radio.service
sudo systemctl stop cogito-radio.service
```

### Re-enable Auto-Start

```bash
sudo systemctl enable cogito-radio.service
sudo systemctl start cogito-radio.service
```

## Demo Day Sequence

When you boot the Pi:

1. **~5 seconds**: System boots
2. **~7 seconds**: Radio service starts → **98.5 FM (WBLS) begins playing** 📻
3. **~10 seconds**: PM2 services start (hardware-service, backend, frontend)
4. **~15 seconds**: Firefox launches in kiosk mode
5. **~20 seconds**: Everything fully loaded and ready!

**Total boot-to-ready time: ~20-30 seconds**

---

✅ Radio plays automatically!
✅ No manual intervention needed!
✅ Perfect for demo day!
