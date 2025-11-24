#!/bin/bash

# Set Card 2 as the default microphone input device
# This ensures Chromium/Vapi uses the correct microphone

echo "🎤 Setting Card 2 as default microphone..."
echo "=========================================="
echo ""

# Method 1: Set ALSA default (if using ALSA directly)
echo "1️⃣ Setting ALSA default to Card 2..."
if [ -f ~/.asoundrc ]; then
    echo "⚠️  ~/.asoundrc already exists. Backing up to ~/.asoundrc.backup"
    cp ~/.asoundrc ~/.asoundrc.backup
fi

cat > ~/.asoundrc << 'EOF'
# Default audio device - Card 2 (USB Microphone)
pcm.!default {
    type hw
    card 2
    device 0
}

ctl.!default {
    type hw
    card 2
}
EOF

echo "✅ Created ~/.asoundrc with Card 2 as default"
echo ""

# Method 2: Set PulseAudio default (if using PulseAudio)
echo "2️⃣ Setting PulseAudio default source to Card 2..."
if command -v pactl &> /dev/null; then
    # Get the source name for Card 2
    SOURCE=$(pactl list sources short | grep -i "card.*2" | head -1 | awk '{print $2}')
    
    if [ -n "$SOURCE" ]; then
        echo "Found source: $SOURCE"
        pactl set-default-source "$SOURCE"
        echo "✅ Set PulseAudio default source to: $SOURCE"
    else
        echo "⚠️  Could not find Card 2 in PulseAudio sources"
        echo "Available sources:"
        pactl list sources short
    fi
else
    echo "⚠️  PulseAudio not installed (this is OK if using ALSA directly)"
fi

echo ""
echo "3️⃣ Verifying default device..."
echo "-----------------------------------"

# Test recording with default device
echo "Testing default device (3 seconds)..."
timeout 3 arecord -d 3 -f cd /tmp/test-default.wav 2>&1 | head -5

if [ -f /tmp/test-default.wav ]; then
    echo "✅ Default device is working!"
    rm -f /tmp/test-default.wav
else
    echo "⚠️  Could not record with default device"
fi

echo ""
echo "4️⃣ Current ALSA devices:"
arecord -l

echo ""
echo "=========================================="
echo "✅ Configuration complete!"
echo ""
echo "Next steps:"
echo "1. Restart Chromium browser"
echo "2. Test microphone in browser"
echo "3. If using PulseAudio, you may need to restart PulseAudio:"
echo "   pulseaudio -k && pulseaudio --start"
echo ""
echo "To test:"
echo "  arecord -d 2 test.wav && aplay test.wav"


