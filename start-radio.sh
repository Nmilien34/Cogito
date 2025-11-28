#!/bin/bash
# Start FM Radio at boot
# Tunes to 98.5 FM (WBLS) and turns radio ON

RADIO_SCRIPT="/home/pi/cogito/hardware-service/python/radio-control.py"

echo "📻 Starting FM Radio at boot..."

# Wait for I2C bus to be ready
sleep 2

# Set to 98.5 FM (WBLS) - as shown in the UI
python3 "$RADIO_SCRIPT" set 98.5

# Turn radio ON
python3 "$RADIO_SCRIPT" on

echo "✅ Radio started at 98.5 FM (WBLS)"
