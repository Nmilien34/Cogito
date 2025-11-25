#!/bin/bash
# Launch Chromium with Vapi-compatible flags for Raspberry Pi

# Kill any existing Chromium instances
killall chromium-browser 2>/dev/null || true
killall chromium 2>/dev/null || true

# Wait a moment
sleep 1

# Check if Chromium is installed
if ! command -v chromium-browser &> /dev/null && ! command -v chromium &> /dev/null; then
    echo "❌ Chromium not found!"
    echo ""
    echo "📦 Installing Chromium..."
    sudo apt-get update
    sudo apt-get install -y chromium-browser || sudo apt-get install -y chromium
    
    # Check again
    if ! command -v chromium-browser &> /dev/null && ! command -v chromium &> /dev/null; then
        echo "❌ Failed to install Chromium!"
        echo "Please install manually: sudo apt-get install -y chromium-browser"
        exit 1
    fi
    echo "✅ Chromium installed!"
fi

# Determine which Chromium command to use
if command -v chromium-browser &> /dev/null; then
    CHROMIUM_CMD="chromium-browser"
elif command -v chromium &> /dev/null; then
    CHROMIUM_CMD="chromium"
else
    echo "❌ Chromium not found!"
    exit 1
fi

echo "🚀 Launching Chromium with Vapi-compatible flags..."
echo "📡 URL: http://localhost:5173"

# Launch Chromium with all necessary flags for Vapi
$CHROMIUM_CMD \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
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

