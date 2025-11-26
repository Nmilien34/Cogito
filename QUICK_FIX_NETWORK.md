# Quick Network Fix - Same IP on Mac and Pi

## The Situation

Both your Mac and Pi are showing the same IP address (`172.20.20.20`). This means you have two options:

## ✅ Option 1: Run Backend on the Pi (Recommended)

**This is the easiest solution!** Just run everything on the Pi.

### On the Pi:

1. **Make sure backend is installed:**
```bash
cd ~/Desktop/Cogito/backend
npm install
```

2. **Start the backend:**
```bash
npm run dev
```

3. **Keep `localhost` in frontend `.env`:**
```bash
cd ~/Desktop/Cogito/frontend
nano .env
```

Add:
```env
# Backend API (running on Pi - use localhost)
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000

# Hardware Service (running on Pi)
VITE_HARDWARE_SERVICE_URL=http://localhost:3001

# Vapi Configuration
VITE_VAPI_PUBLIC_KEY=your-public-key-here
VITE_VAPI_ASSISTANT_ID=df2a9bc2-b7e1-4640-af14-1e69930712c5
```

4. **Restart frontend:**
```bash
npm run dev
```

**Done!** Everything runs on the Pi, so `localhost` works perfectly.

---

## Option 2: Find Mac's Real Local IP

If you want to keep the backend on your Mac, you need to find your Mac's actual local network IP (not the VPN/shared IP).

### On your Mac:

1. **Check System Settings:**
   - System Settings → Network
   - Click on your active connection (Wi-Fi or Ethernet)
   - Look for the IP address (should be different from `172.20.20.20`)

2. **Or check via Terminal:**
```bash
# Check Wi-Fi IP
ipconfig getifaddr en0

# Check Ethernet IP (if connected)
ipconfig getifaddr en1

# Or see all IPs
ifconfig | grep "inet " | grep -v 127.0.0.1
```

3. **Once you find the Mac's IP (e.g., `192.168.1.100`), update Pi's `.env`:**
```env
VITE_API_URL=http://192.168.1.100:4000/api
VITE_SOCKET_URL=http://192.168.1.100:4000
```

4. **Make sure Mac's firewall allows connections on port 4000**

---

## 🎯 Recommendation

**Use Option 1** - it's simpler and everything runs in one place. The Pi is powerful enough to run both the frontend and backend.

