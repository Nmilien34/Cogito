#!/bin/bash

###############################################################################
# Cogito Kiosk Mode Setup Script
#
# This script configures the Raspberry Pi to:
# 1. Auto-login to desktop
# 2. Launch Firefox in kiosk mode on startup
# 3. Open the Cogito web app automatically
# 4. Disable screen blanking/sleep
###############################################################################

set -e

echo "=================================================="
echo "  Cogito Kiosk Mode Setup"
echo "=================================================="
echo ""

# Check if running on Raspberry Pi
if [ ! -f /proc/device-tree/model ]; then
    echo "⚠️  This script is designed for Raspberry Pi"
    echo "   It may not work correctly on other systems"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "This script will configure your Pi for kiosk mode:"
echo "  - Auto-login to desktop"
echo "  - Launch Firefox in fullscreen kiosk mode"
echo "  - Open Cogito web app automatically"
echo "  - Disable screen blanking"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled"
    exit 1
fi

###############################################################################
# Step 1: Install Firefox if needed
###############################################################################
echo ""
echo "Step 1: Checking Firefox..."

if ! command -v firefox >/dev/null 2>&1; then
    echo "📦 Installing Firefox..."
    sudo apt-get update
    sudo apt-get install -y firefox-esr
    echo "✅ Firefox installed"
else
    echo "✅ Firefox already installed"
fi

###############################################################################
# Step 2: Create kiosk startup script
###############################################################################
echo ""
echo "Step 2: Creating kiosk startup script..."

cat > "$SCRIPT_DIR/start-kiosk.sh" << 'EOF'
#!/bin/bash

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Wait for backend to be ready
echo "⏳ Waiting for backend (port 4000)..."
for i in {1..30}; do
    if curl -s http://localhost:4000 >/dev/null 2>&1; then
        echo "✅ Backend is ready"
        break
    fi
    sleep 1
done

# Wait for frontend to be ready
echo "⏳ Waiting for frontend (port 5174)..."
for i in {1..30}; do
    if curl -s http://localhost:5174 >/dev/null 2>&1; then
        echo "✅ Frontend is ready"
        break
    fi
    sleep 1
done

# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Hide cursor
unclutter -idle 0.1 -root &

# Launch Firefox in kiosk mode
echo "🚀 Launching Firefox in kiosk mode..."
firefox --kiosk http://localhost:5174 &

# Keep the script running
wait
EOF

chmod +x "$SCRIPT_DIR/start-kiosk.sh"
echo "✅ Kiosk script created: $SCRIPT_DIR/start-kiosk.sh"

###############################################################################
# Step 3: Install unclutter (hide cursor)
###############################################################################
echo ""
echo "Step 3: Installing cursor hider..."

if ! command -v unclutter >/dev/null 2>&1; then
    echo "📦 Installing unclutter..."
    sudo apt-get install -y unclutter
    echo "✅ unclutter installed"
else
    echo "✅ unclutter already installed"
fi

###############################################################################
# Step 4: Create autostart entry
###############################################################################
echo ""
echo "Step 4: Setting up autostart..."

# Create autostart directory if it doesn't exist
mkdir -p ~/.config/autostart

# Create desktop entry for kiosk mode
cat > ~/.config/autostart/cogito-kiosk.desktop << EOF
[Desktop Entry]
Type=Application
Name=Cogito Kiosk
Exec=$SCRIPT_DIR/start-kiosk.sh
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

echo "✅ Autostart entry created"

###############################################################################
# Step 5: Configure auto-login (optional)
###############################################################################
echo ""
echo "Step 5: Auto-login configuration..."
echo ""
echo "Do you want to enable auto-login to desktop?"
echo "(Recommended for kiosk mode)"
read -p "Enable auto-login? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Get current username
    CURRENT_USER=$(whoami)

    echo "Configuring auto-login for user: $CURRENT_USER"

    # Configure LightDM for auto-login
    sudo mkdir -p /etc/lightdm/lightdm.conf.d/

    sudo tee /etc/lightdm/lightdm.conf.d/50-autologin.conf > /dev/null << LIGHTDM_EOF
[Seat:*]
autologin-user=$CURRENT_USER
autologin-user-timeout=0
LIGHTDM_EOF

    echo "✅ Auto-login configured"
else
    echo "⏭️  Auto-login skipped"
fi

###############################################################################
# Summary
###############################################################################
echo ""
echo "=================================================="
echo "  ✅ Kiosk Mode Setup Complete!"
echo "=================================================="
echo ""
echo "Configuration summary:"
echo "  - Firefox will launch in kiosk mode on startup"
echo "  - URL: http://localhost:5174"
echo "  - Screen blanking disabled"
echo "  - Cursor will be hidden"
echo ""
echo "To test without rebooting:"
echo "  $SCRIPT_DIR/start-kiosk.sh"
echo ""
echo "To enable everything on boot:"
echo "  sudo reboot"
echo ""
echo "To disable kiosk mode:"
echo "  rm ~/.config/autostart/cogito-kiosk.desktop"
echo ""
