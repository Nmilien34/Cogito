# Quick Start - FM Radio + Voice AI Companion

## What is This?

CogitoSmartRadio is now an **FM Radio Controller + Voice AI Companion** designed for elderly care (specifically Ruth).

- **Physical FM Radio:** TEA5767 chip on Raspberry Pi plays actual FM radio
- **Web Interface:** Shows current station, lets you tune, and provides voice AI companion
- **NOT a music streaming app:** Audio comes from hardware, not the browser

---

## Quick Setup

### 1. Install Client Dependencies
```bash
cd client
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The client will run on http://localhost:5173

### 3. Start Hardware Service (Raspberry Pi)
```bash
cd ../hardware-service
npm install
node hardware-service.js
```

Hardware service runs on http://localhost:3001

### 4. Start Backend API (if needed)
```bash
cd ../server
npm install
npm run dev
```

Backend runs on http://localhost:4000

---

## Features

### FM Radio Controller
- **Frequency Display:** Large, accessible display showing current frequency
- **Tune Up/Down:** Simple +/- buttons to scan stations
- **Station Presets:** 6 pre-configured stations for quick access
- **Manual Tuning:** Click frequency to enter custom value
- **Volume Control:** Adjust radio volume
- **Signal Strength:** Shows reception quality (when available)

### Voice AI Companion (Vapi)
- Press button to talk to AI companion
- Get medication reminders
- Ask questions, have conversations
- Voice commands for radio control (future)

### Medication Reminders
- Schedule medication times
- Voice and visual reminders
- Snooze functionality
- Track adherence

---

## Using the FM Radio

### Tuning Stations
1. Click the **+** button to tune up by 0.1 MHz
2. Click the **-** button to tune down by 0.1 MHz
3. Click the **frequency number** (e.g., 99.1) to enter a specific frequency

### Station Presets
1. Click "Station Presets ▶" to expand
2. Click any preset to jump to that station
3. Presets include:
   - NPR News (88.5)
   - Classical (90.7)
   - Jazz FM (99.1)
   - Easy Listening (101.9)
   - Oldies (103.5)
   - Talk Radio (106.7)

### Volume Control
- Drag the volume slider to adjust
- Volume is shown as a percentage (0-100%)

---

## Understanding Radio vs. AI Mode

### Radio Mode (Default)
- Physical FM radio is playing
- You hear audio from the TEA5767 chip
- Can tune, change volume, select presets

### AI Mode (Voice Companion Active)
- Radio is muted/paused
- Voice AI (Vapi) is listening
- Have a conversation with the companion
- Get medication reminders

### Switching Modes
- Press the physical button on Raspberry Pi
- Or click "Play/Pause" in the interface
- System automatically switches between radio and AI

---

## Hardware Setup (Raspberry Pi)

### Required Hardware
- Raspberry Pi (any model with I2C)
- TEA5767 FM Radio Module
- Speaker/Amplifier
- Button (for voice activation)
- Microphone (for voice AI)

### Connections
```
TEA5767 → Raspberry Pi
- SDA → GPIO 2 (Pin 3)
- SCL → GPIO 3 (Pin 5)
- VCC → 3.3V
- GND → Ground

Button → GPIO 17 (for voice activation)
Microphone → USB or I2S
Speaker → 3.5mm jack or I2S DAC
```

### Enable I2C
```bash
sudo raspi-config
# Interface Options → I2C → Enable
sudo reboot
```

### Test Radio
```bash
cd hardware-service/python
python3 radio-control.py status
python3 radio-control.py set 99.1
```

---

## Configuration

### Environment Variables

Edit `client/.env`:
```bash
# API URLs
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000

# FM Radio
VITE_FM_DEFAULT_FREQUENCY=99.1

# Voice AI
VITE_VAPI_PUBLIC_KEY=your-key-here
VITE_VAPI_ASSISTANT_ID=your-assistant-id

# Hardware Service
VITE_HARDWARE_SERVICE_URL=http://localhost:3001
```

### For Raspberry Pi Deployment
Change URLs to Raspberry Pi IP:
```bash
VITE_HARDWARE_SERVICE_URL=http://192.168.1.100:3001
```

---

## Common Tasks

### Change Default Station
Edit `client/.env`:
```bash
VITE_FM_DEFAULT_FREQUENCY=101.9
```

### Add Custom Presets
Presets are stored in browser localStorage. Click presets to select, or modify in DevTools:
```javascript
localStorage.setItem('fm_radio_presets', JSON.stringify([
  { id: '1', name: 'My Station', frequency: 95.5 }
]));
```

### Test Without Hardware
The interface will work without the Raspberry Pi, but radio controls won't do anything. Useful for UI development.

---

## Troubleshooting

### Radio not responding
```bash
# Check I2C device
i2cdetect -y 1
# Should show device at address 0x60

# Test radio script directly
python3 hardware-service/python/radio-control.py status
```

### "Cannot connect to hardware service"
- Check hardware service is running: `node hardware-service/hardware-service.js`
- Verify URL in `.env` matches where service is running
- Check firewall allows port 3001

### Voice AI not working
- Verify Vapi keys in `.env`
- Check microphone permissions in browser
- Test microphone in system settings

### No audio from radio
- Check speaker is connected
- Verify TEA5767 wiring
- Test with `speaker-test -t wav -c 2`
- Check volume levels: `alsamixer`

---

## Development Tips

### Hot Reload
Vite dev server has hot module replacement. Edit files and see changes instantly.

### TypeScript
Project uses TypeScript. Check types with:
```bash
npm run build  # Runs tsc check
```

### Linting
```bash
npm run lint
```

### Testing
```bash
npm test
npm run cy:open  # Cypress E2E tests
```

---

## Project Structure

```
CogitoSmartRadio/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── RadioPlayer.tsx       # FM radio controller UI
│   │   │   ├── VapiControls.tsx      # Voice AI controls
│   │   │   └── ReminderList.tsx      # Medication reminders
│   │   ├── services/
│   │   │   └── FMRadioService.ts     # Hardware communication
│   │   ├── pages/
│   │   │   └── RuthDashboard.tsx     # Main interface
│   │   └── types.ts                  # TypeScript types
│   └── package.json
├── hardware-service/          # Raspberry Pi service
│   ├── hardware-service.js    # Node.js server
│   └── python/
│       └── radio-control.py   # TEA5767 control script
└── server/                    # Backend API
    └── (medication reminders, auth, etc.)
```

---

## Next Steps

1. **Customize Presets:** Add Ruth's favorite stations
2. **Test Voice AI:** Ensure Vapi integration works
3. **Set Up Reminders:** Add Ruth's medication schedule
4. **Deploy to Pi:** Follow deployment guide
5. **Test with User:** Have Ruth try the interface

---

## Key Differences from Before

### Old (Streaming App)
- Played music from web (YouTube, URLs)
- Audio came from browser
- Playlist panel with songs

### New (FM Radio Controller)
- Controls physical radio hardware
- Audio comes from radio chip
- Station presets for FM frequencies
- Companion interface, not player

---

## Support

For issues:
1. Check hardware connections
2. Test Python script directly
3. Review browser console
4. Check hardware service logs
5. Verify environment variables

**Remember:** This is a **control interface** for a **physical FM radio**, not an audio player!

---

## Resources

- **Hardware:** TEA5767 FM Radio Module
- **Voice AI:** Vapi.ai documentation
- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + Socket.io
- **Target User:** Elderly care (Ruth's companion radio)
