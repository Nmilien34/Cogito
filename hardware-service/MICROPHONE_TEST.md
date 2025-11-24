# 🎤 Microphone Testing Guide

Quick guide to test if your microphones are working on the Raspberry Pi.

---

## Test 1: System-Level Test (Terminal)

**Run this in a terminal on the Pi:**

```bash
cd ~/Desktop/Cogito/hardware-service
chmod +x test-microphone.sh
./test-microphone.sh
```

**What it does:**
- Lists all audio input devices
- Records 3 seconds of audio
- Plays it back so you can hear yourself

**Expected output:**
```
🎤 Microphone Diagnostic Test
============================

1️⃣ Checking audio input devices...
card 0: Headphones [bcm2835 Headphones], device 0: bcm2835 Headphones [bcm2835 Headphones]
card 1: USB [USB Audio Device], device 0: USB Audio [USB Audio]

2️⃣ Testing microphone with arecord (3 seconds)...
📢 Speak into the microphone now!
Recording WAVE 'test-mic.wav' : Signed 16 bit Little Endian, Rate 44100 Hz, Stereo

3️⃣ Playing back recording...
Playing WAVE 'test-mic.wav' : Signed 16 bit Little Endian, Rate 44100 Hz, Stereo
✅ Playback successful! You should hear your voice.
```

**If it fails:**
- No microphone detected → Check USB mic is plugged in
- Permission denied → Run with `sudo` (not recommended) or check permissions
- No sound on playback → Check speakers/headphones

---

## Test 2: Browser-Level Test (Chromium)

### Option A: Use Test HTML Page

```bash
# Open test page in Chromium
chromium-browser ~/Desktop/Cogito/hardware-service/test-browser-mic.html
```

**What to do:**
1. Click "Start Test" button
2. Grant microphone permission if prompted
3. Speak into the microphone
4. Watch the audio level bar - it should move when you speak
5. Check the log for device information

**Expected:**
- Green status: "✅ Microphone is working!"
- Audio level bar moves when you speak
- Log shows your microphone device name

### Option B: Test in Browser Console

**In Chromium (F12 → Console), run:**

```javascript
// Test microphone access
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Mic access granted!');
    console.log('Audio tracks:', stream.getAudioTracks());
    stream.getAudioTracks().forEach(track => {
      console.log('Track:', track.label);
      console.log('Settings:', track.getSettings());
    });
    // Stop after 5 seconds
    setTimeout(() => {
      stream.getTracks().forEach(track => track.stop());
      console.log('🛑 Stopped');
    }, 5000);
  })
  .catch(err => {
    console.error('❌ Mic error:', err.name, err.message);
    if (err.name === 'NotAllowedError') {
      console.log('💡 Grant permission in: chrome://settings/content/microphone');
    }
  });
```

**Expected:**
- Console shows: `✅ Mic access granted!`
- Lists your microphone device
- No errors

---

## Test 3: Check Microphone Permissions

**In Chromium:**
1. Go to: `chrome://settings/content/microphone`
2. Check if `http://localhost:8081` is in the "Allowed" list
3. If not, add it or set to "Ask"

**Or check via command:**
```bash
# Check Chromium preferences
cat ~/.config/chromium/Default/Preferences | grep -A 5 microphone
```

---

## Test 4: List All Audio Devices

```bash
# List ALSA devices
arecord -l

# List PulseAudio sources (if using PulseAudio)
pactl list sources short

# List all audio devices with details
cat /proc/asound/cards
```

**Expected:**
- Should see your USB microphone listed
- Example: `card 1: USB [USB Audio Device]`

---

## Test 5: Quick Record & Playback

```bash
# Record 3 seconds
arecord -d 3 -f cd test.wav

# Play it back
aplay test.wav

# Clean up
rm test.wav
```

**If you hear your voice:** ✅ Microphone hardware is working!

---

## Common Issues & Fixes

### Issue: "No microphone found"

**Check:**
```bash
# Is USB mic plugged in?
lsusb | grep -i audio

# Is it detected?
arecord -l
```

**Fix:**
- Unplug and replug USB microphone
- Try different USB port
- Check if mic works on another device

### Issue: "Permission denied"

**Fix:**
- Make sure you're not running as root
- Check user is in `audio` group: `groups | grep audio`
- If not, add user: `sudo usermod -a -G audio $USER` (then logout/login)

### Issue: "Microphone works in terminal but not in browser"

**Fix:**
1. Grant permission in Chromium: `chrome://settings/content/microphone`
2. Launch Chromium with: `--use-fake-ui-for-media-stream`
3. Check browser console for errors (F12)

### Issue: "Vapi can't access microphone"

**Check:**
1. Browser console (F12) for Vapi errors
2. Vapi SDK is requesting mic: Look for `getUserMedia` calls
3. Microphone permission is granted

**Fix:**
- Make sure Chromium was launched with microphone flags
- Or manually grant permission in browser settings
- Check Vapi configuration in frontend `.env`

---

## Quick Diagnostic Commands

```bash
# Full diagnostic
cd ~/Desktop/Cogito/hardware-service
./test-microphone.sh

# Quick test
arecord -d 2 test.wav && aplay test.wav && rm test.wav

# Check devices
arecord -l

# Check permissions
groups | grep audio
```

---

## What to Check Next

After confirming microphone works:

1. ✅ **System level** - `arecord` works
2. ✅ **Browser level** - `getUserMedia` works in Chromium
3. ✅ **Vapi level** - Vapi SDK can access microphone
4. ✅ **Hardware service** - Button triggers Vapi start
5. ✅ **WebSocket** - Frontend receives `start-voice` event

If all tests pass but Vapi still doesn't work, check:
- Vapi SDK initialization
- WebSocket connection between frontend and hardware service
- Browser console for Vapi-specific errors

---

**Good luck! 🎤**


