#!/bin/bash

# Microphone Testing Script for Raspberry Pi
# Run this to test if microphones are working

echo "🎤 Microphone Diagnostic Test"
echo "============================"
echo ""

# Test 1: List audio devices
echo "1️⃣ Checking audio input devices..."
echo "-----------------------------------"
arecord -l 2>/dev/null || echo "❌ arecord not found. Install: sudo apt-get install alsa-utils"

echo ""
echo "2️⃣ Testing microphone with arecord (3 seconds)..."
echo "-----------------------------------"
echo "📢 Speak into the microphone now!"
timeout 3 arecord -d 3 -f cd test-mic.wav 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Recording successful!"
    echo ""
    echo "3️⃣ Playing back recording..."
    aplay test-mic.wav 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Playback successful! You should hear your voice."
    else
        echo "❌ Playback failed"
    fi
    rm -f test-mic.wav
else
    echo "❌ Recording failed - microphone may not be working"
fi

echo ""
echo "4️⃣ Checking PulseAudio devices..."
echo "-----------------------------------"
pactl list sources short 2>/dev/null || echo "⚠️  PulseAudio not running (this is OK if using ALSA directly)"

echo ""
echo "5️⃣ Testing with Python (if available)..."
echo "-----------------------------------"
python3 -c "
import pyaudio
p = pyaudio.PyAudio()
print('Available input devices:')
for i in range(p.get_device_count()):
    info = p.get_device_info_by_index(i)
    if info['maxInputChannels'] > 0:
        print(f\"  Device {i}: {info['name']} ({info['maxInputChannels']} channels)\")
p.terminate()
" 2>/dev/null || echo "⚠️  pyaudio not installed (optional)"

echo ""
echo "============================"
echo "✅ Diagnostic complete!"
echo ""
echo "Next steps:"
echo "1. If recording worked, mic hardware is OK"
echo "2. Test in Chromium browser (F12 → Console)"
echo "3. Check Vapi microphone access"


