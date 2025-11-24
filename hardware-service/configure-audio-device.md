# 🎤 Configure Audio Device for Vapi

Since Vapi runs in Chromium browser and uses the browser's `getUserMedia` API, it will use the **system default microphone**. We need to set Card 2 as the default.

---

## Quick Setup

**Run this script on the Pi:**

```bash
cd ~/Desktop/Cogito/hardware-service
chmod +x set-default-microphone.sh
./set-default-microphone.sh
```

This will:
1. Set Card 2 as the ALSA default device
2. Set Card 2 as the PulseAudio default source (if PulseAudio is running)
3. Test the default device

---

## Manual Configuration

### Option 1: ALSA Configuration (Recommended)

**Create/edit `~/.asoundrc`:**

```bash
nano ~/.asoundrc
```

**Add this content:**

```conf
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
```

**Test:**
```bash
# Should use Card 2 automatically
arecord -d 2 test.wav
aplay test.wav
rm test.wav
```

### Option 2: PulseAudio Configuration

**If using PulseAudio:**

```bash
# List all sources
pactl list sources short

# Find Card 2 source (look for something like "alsa_input.usb-...")
# Set it as default
pactl set-default-source <source-name>

# Verify
pactl info | grep "Default Source"
```

**Example:**
```bash
# If Card 2 shows as "alsa_input.usb-0d8c_USB_Audio-00.analog-stereo"
pactl set-default-source alsa_input.usb-0d8c_USB_Audio-00.analog-stereo
```

---

## Verify Default Device

**Test the default device:**

```bash
# Record with default device
arecord -d 3 -f cd test-default.wav

# Play it back
aplay test-default.wav

# Clean up
rm test-default.wav
```

**If you hear your voice clearly:** ✅ Default device is set correctly!

---

## Browser-Level Device Selection (Alternative)

If setting system default doesn't work, we can enumerate devices in the browser and select Card 2 before starting Vapi. However, this requires:

1. Getting device list via `navigator.mediaDevices.enumerateDevices()`
2. Finding the device that matches Card 2
3. Requesting that specific device with `getUserMedia({ audio: { deviceId: { exact: '...' } } })`

But this is more complex. Setting the system default is simpler and more reliable.

---

## After Configuration

1. **Restart Chromium** (or just refresh the page)
2. **Test in browser console:**
   ```javascript
   navigator.mediaDevices.getUserMedia({ audio: true })
     .then(stream => {
       console.log('✅ Using device:', stream.getAudioTracks()[0].label);
       stream.getTracks().forEach(t => t.stop());
     });
   ```
3. **Press the button** and test Vapi

---

## Troubleshooting

### Problem: Browser still uses wrong device

**Check:**
```bash
# Verify ALSA default
cat ~/.asoundrc

# Verify PulseAudio default
pactl info | grep "Default Source"

# Test default device
arecord -d 2 test.wav && aplay test.wav
```

**Fix:**
- Restart Chromium completely (kill and reopen)
- If using PulseAudio, restart it: `pulseaudio -k && pulseaudio --start`
- Check browser permissions: `chrome://settings/content/microphone`

### Problem: Card 2 not found

**Check:**
```bash
# List all cards
arecord -l

# Check if Card 2 exists
cat /proc/asound/cards
```

**If Card 2 doesn't exist:**
- USB microphone might not be plugged in
- Try different USB port
- Check `dmesg | tail` for USB device errors

---

## Quick Reference

```bash
# Set ALSA default
cat > ~/.asoundrc << 'EOF'
pcm.!default { type hw; card 2; device 0; }
ctl.!default { type hw; card 2; }
EOF

# Set PulseAudio default
pactl set-default-source $(pactl list sources short | grep -i "card.*2" | head -1 | awk '{print $2}')

# Test
arecord -d 2 test.wav && aplay test.wav && rm test.wav
```

---

**After running the setup script, restart Chromium and test!** 🎤


