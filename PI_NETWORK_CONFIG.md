# Network Configuration for Pi → Mac Connection

## The Problem

Your frontend runs on the **Pi**, but your backend server (port 4000) runs on your **Mac**. When the Pi tries to connect to `localhost:4000`, it's looking for a server on the Pi itself, not on your Mac.

**Note:** If both your Mac and Pi show the same IP address (e.g., `172.20.20.20`), you may be on a VPN or special network. In that case, you can still use `localhost` if the backend is running on the Pi, OR you need to find the Mac's actual local network IP.

## Solution: Use Your Mac's IP Address

### Step 1: Find Your Mac's IP Address

**On your Mac, run:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Or:
```bash
ipconfig getifaddr en0
```

**Important:** If your Mac and Pi show the same IP (e.g., both are `172.20.20.20`), you have two options:

**Option A: Run backend on the Pi** (easiest)
- Just keep `localhost:4000` in the Pi's `.env` file
- Run the backend on the Pi instead of the Mac

**Option B: Find Mac's actual local IP**
- Check your Mac's System Settings → Network
- Look for the IP address of your Wi-Fi or Ethernet connection
- It should be different from the Pi's IP (e.g., `192.168.1.100` vs `172.20.20.20`)

### Step 2: Update Pi's Frontend Configuration

**On the Pi, create/update `.env` file:**
```bash
cd ~/Desktop/Cogito/frontend
nano .env
```

**Add these lines (replace `172.20.20.20` with your Mac's actual IP if different):**
```env
# Backend API (running on your Mac)
VITE_API_URL=http://172.20.20.20:4000/api
VITE_SOCKET_URL=http://172.20.20.20:4000

# Hardware Service (running on Pi - keep as localhost)
VITE_HARDWARE_SERVICE_URL=http://localhost:3001

# Vapi Configuration
VITE_VAPI_PUBLIC_KEY=your-public-key-here
VITE_VAPI_ASSISTANT_ID=df2a9bc2-b7e1-4640-af14-1e69930712c5
```

### Step 3: Make Sure Backend is Running on Mac

**On your Mac:**
```bash
cd backend
npm run dev
```

The backend should be running on `http://localhost:4000`

### Step 4: Allow Firewall Access on Mac

**On your Mac, allow incoming connections to port 4000:**

**macOS Firewall:**
1. System Settings → Network → Firewall
2. Click "Options" or "Firewall Options"
3. Make sure "Block all incoming connections" is OFF
4. Or add a rule to allow port 4000

**Or via Terminal:**
```bash
# Check if firewall is blocking
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Allow Node.js (if needed)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

### Step 5: Test Connection from Pi

**On the Pi, test if it can reach your Mac:**
```bash
# Replace 172.20.20.20 with your Mac's IP if different
curl http://172.20.20.20:4000/health
```

If you get a response, the connection works!

## Important Notes

### Vapi Doesn't Need the Backend

**Vapi connects directly from the browser to Vapi's servers** - it doesn't go through your backend. So:
- ✅ Vapi should work even if backend (port 4000) is down
- ❌ But reminders and other features need the backend

### What Each Service Does

| Service | Port | Location | Purpose |
|---------|------|----------|---------|
| **Frontend** | 5173 | Pi | React app |
| **Hardware Service** | 3001 | Pi | Radio control, button handling |
| **Backend** | 4000 | **Mac** | Reminders, database, API |
| **Vapi** | N/A | Cloud | Voice AI (direct from browser) |

### Quick Test

1. **On Mac:** Make sure backend is running on port 4000
2. **On Pi:** Update `.env` with Mac's IP address
3. **On Pi:** Restart frontend (`npm run dev`)
4. **On Pi:** Open Chromium and check console - should see successful connections

## Alternative: Run Backend on Pi Too

If you want everything on the Pi, you can also run the backend on the Pi:
```bash
# On Pi
cd ~/Desktop/Cogito/backend
npm install
npm run dev
```

Then keep `localhost:4000` in the Pi's `.env` file.

