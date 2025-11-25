# Chromium Configuration for Vapi on Raspberry Pi

## The Problem

Vapi works on your local machine but not on the Pi. This is because Chromium on the Pi needs specific flags to:
1. Allow WebSocket connections to Vapi servers
2. Allow audio/WebRTC without user gestures
3. Auto-grant microphone permissions

## Solution: Updated Chromium Launch Command

Use this command to launch Chromium on the Pi:

```bash
chromium-browser --kiosk \
  --autoplay-policy=no-user-gesture-required \
  --use-fake-ui-for-media-stream \
  --disable-features=AudioServiceOutOfProcess \
  --enable-features=WebRTC \
  --unsafely-treat-insecure-origin-as-secure=http://localhost:5173 \
  --unsafely-treat-insecure-origin-as-secure=http://localhost:3001 \
  --unsafely-treat-insecure-origin-as-secure=http://localhost:4000 \
  --disable-web-security \
  --user-data-dir=/tmp/chromium-vapi \
  http://localhost:5173
```

## Key Flags Explained

- `--autoplay-policy=no-user-gesture-required` - **CRITICAL**: Allows audio without user click
- `--use-fake-ui-for-media-stream` - Auto-grants microphone permission
- `--disable-features=AudioServiceOutOfProcess` - Fixes audio issues on Pi
- `--enable-features=WebRTC` - Enables WebRTC for Vapi
- `--unsafely-treat-insecure-origin-as-secure` - Allows WebSocket connections
- `--disable-web-security` - Allows cross-origin requests (for development)
- `--user-data-dir=/tmp/chromium-vapi` - Uses a clean profile

## Testing on Pi

1. **Kill any existing Chromium:**
   ```bash
   killall chromium-browser
   ```

2. **Start the frontend:**
   ```bash
   cd ~/cogito/frontend
   npm run dev
   ```

3. **Launch Chromium with the flags above**

4. **Open DevTools (F12) and check:**
   - Console for Vapi connection logs
   - Network tab (filter by "WS") for WebSocket connections to Vapi
   - Look for `wss://api.vapi.ai` or similar connections

## If Still Not Working

1. **Check network connectivity:**
   ```bash
   curl https://api.vapi.ai
   ```

2. **Check firewall:**
   ```bash
   sudo ufw status
   ```

3. **Test WebSocket manually:**
   Open browser console and run:
   ```javascript
   const ws = new WebSocket('wss://api.vapi.ai');
   ws.onopen = () => console.log('✅ WebSocket connected');
   ws.onerror = (e) => console.error('❌ WebSocket error:', e);
   ```

4. **Check Chromium version:**
   ```bash
   chromium-browser --version
   ```
   (Should be recent version for WebRTC support)

