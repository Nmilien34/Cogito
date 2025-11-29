# ANO Rotary Encoder Setup Guide

## Hardware Overview

**Device**: Adafruit ANO Rotary Encoder
**I2C Address**: 0x49
**Connection**: Raspberry Pi I2C Bus (SDA/SCL)

### Features
- **Rotary Encoder**: Volume control (clockwise = up, counter-clockwise = down)
- **4 Buttons**:
  - Pin 1 (Up): Scan radio station up
  - Pin 2 (Down): Scan radio station down
  - Pin 3 (Left): Scan radio station down (same as down)
  - Pin 4 (Right): Scan radio station up (same as up)

---

## Installation Steps

### 1. Hardware Connection

Connect the ANO encoder to your Raspberry Pi:
- **VCC** → 3.3V or 5V
- **GND** → Ground
- **SDA** → GPIO 2 (Pin 3)
- **SCL** → GPIO 3 (Pin 5)

### 2. Enable I2C

```bash
# Enable I2C interface
sudo raspi-config
# Navigate to: Interfacing Options → I2C → Enable

# Verify I2C is enabled
lsmod | grep i2c
```

### 3. Install System Dependencies

```bash
# Update package list
sudo apt-get update

# Install I2C tools
sudo apt-get install -y i2c-tools python3-pip python3-dev

# Install audio tools (for volume control)
sudo apt-get install -y alsa-utils

# Verify encoder is detected
sudo i2cdetect -y 1
# You should see "49" in the output grid
```

### 4. Install Python Dependencies

```bash
# Navigate to the hardware service directory
cd /home/radioassistant/Desktop/Cogito/hardware-service/python

# Install Python packages
pip3 install -r requirements-encoder.txt

# For system-wide installation (recommended for services)
sudo pip3 install -r requirements-encoder.txt
```

### 5. Configure I2C Permissions

```bash
# Add your user to the i2c group
sudo usermod -aG i2c $USER
sudo usermod -aG gpio $USER

# Reboot for permissions to take effect
sudo reboot
```

### 6. Test the Encoder

After rebooting, test the encoder module:

```bash
# Test the ANO encoder class
python3 ano_encoder.py

# You should see:
# - Volume changes when rotating
# - "Scanning UP/DOWN" when pressing buttons
```

---

## Running as a Service

### 1. Install the Systemd Service

```bash
# Copy service file to systemd directory
sudo cp cogito-encoder.service /etc/systemd/system/

# Reload systemd to recognize new service
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable cogito-encoder

# Start the service now
sudo systemctl start cogito-encoder
```

### 2. Check Service Status

```bash
# View service status
sudo systemctl status cogito-encoder

# View real-time logs
sudo journalctl -u cogito-encoder -f

# View recent logs
sudo journalctl -u cogito-encoder -n 50
```

### 3. Service Management Commands

```bash
# Start service
sudo systemctl start cogito-encoder

# Stop service
sudo systemctl stop cogito-encoder

# Restart service
sudo systemctl restart cogito-encoder

# Disable service (won't start on boot)
sudo systemctl disable cogito-encoder

# Check if service is running
sudo systemctl is-active cogito-encoder
```

---

## Troubleshooting

### Encoder Not Detected

```bash
# Check I2C bus
sudo i2cdetect -y 1

# If 0x49 is not shown:
# 1. Check physical connections
# 2. Check power supply (3.3V or 5V)
# 3. Try different I2C address if configured differently
```

### Permission Denied Error

```bash
# Ensure user is in i2c group
groups $USER

# If "i2c" is not listed:
sudo usermod -aG i2c $USER
sudo reboot
```

### Hardware ID Error

The `RelaxedSeesaw` class automatically handles the Raspberry Pi clock-stretching bug. If you still see hardware ID errors:

1. Check that you're using the custom `RelaxedSeesaw` class (not standard `Seesaw`)
2. Verify I2C connections are solid
3. Try adding a small delay in initialization

### Noise / Erratic Behavior

The encoder module includes noise filtering that ignores jumps > +/- 10 steps. If you still experience issues:

1. Check I2C cable length (keep it short)
2. Add a 4.7kΩ pull-up resistor on SDA and SCL if needed
3. Check for electrical interference near the encoder

### Backend API Not Reachable

If the service can't reach the backend:

```bash
# Check backend is running
curl http://localhost:4000/health

# Check backend logs
cd /path/to/backend
npm run dev  # or check systemd logs if running as service

# Service will fallback to direct radio control if backend is down
```

### Service Won't Start

```bash
# Check service logs
sudo journalctl -u cogito-encoder -n 100

# Common issues:
# 1. Wrong file paths in service file
# 2. Missing Python dependencies
# 3. User permissions

# Verify service file paths match your installation
sudo nano /etc/systemd/system/cogito-encoder.service

# After editing, reload
sudo systemctl daemon-reload
sudo systemctl restart cogito-encoder
```

---

## File Structure

```
hardware-service/python/
├── ano_encoder.py              # Main encoder class with RelaxedSeesaw
├── encoder_service.py          # Background service that monitors encoder
├── radio-control.py            # Radio control script (existing)
├── requirements-encoder.txt    # Python dependencies
├── cogito-encoder.service      # Systemd service file
└── ENCODER_SETUP.md           # This file
```

---

## Configuration

### Adjust Volume Step Size

Edit `encoder_service.py`:

```python
# Change volume_step parameter (default is 5%)
self.encoder = ANOEncoder(volume_step=10)  # Faster volume changes
```

### Change Backend URL

Edit `encoder_service.py`:

```python
# Change BACKEND_URL constant
BACKEND_URL = "http://localhost:4000/api"  # Default
# or
BACKEND_URL = "http://192.168.1.100:4000/api"  # Remote backend
```

### Adjust Polling Interval

Edit `encoder_service.py`:

```python
# Change POLL_INTERVAL (default is 0.01 = 10ms)
POLL_INTERVAL = 0.02  # 20ms - lower CPU usage
POLL_INTERVAL = 0.005  # 5ms - more responsive
```

---

## Integration with Frontend

The encoder service automatically calls the backend API endpoints:

- **Volume changes**: Handled locally via `amixer`
- **Radio scanning**: Calls `POST /api/radio/scan-up` or `/api/radio/scan-down`

The frontend React app will automatically receive updates via the existing Socket.io connection when radio stations change.

---

## Logs and Monitoring

### Log Files

- **Service logs**: `sudo journalctl -u cogito-encoder`
- **Application log**: `/tmp/encoder-service.log`

### Real-time Monitoring

```bash
# Watch service logs
sudo journalctl -u cogito-encoder -f

# Watch application log
tail -f /tmp/encoder-service.log

# Check system volume
amixer get Master
```

---

## Performance Notes

- **CPU Usage**: ~1-2% (with 10ms polling)
- **Memory**: ~50MB
- **I2C Bandwidth**: Minimal (only on events)
- **Noise Filtering**: Automatically filters I2C garbage values

---

## Safety Features

1. **Auto-recovery**: Service automatically restarts on I2C errors
2. **Noise filtering**: Ignores invalid rotary readings (>+/- 10 steps)
3. **Button debouncing**: 200ms debounce prevents accidental triggers
4. **API fallback**: Falls back to direct radio control if backend is unreachable
5. **Volume clamping**: Volume stays in 0-100% range

---

## Support

For issues or questions:

1. Check service status: `sudo systemctl status cogito-encoder`
2. Review logs: `sudo journalctl -u cogito-encoder -n 100`
3. Test encoder directly: `python3 ano_encoder.py`
4. Verify I2C connection: `sudo i2cdetect -y 1`

---

## License

Part of the Cogito project.
