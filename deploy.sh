#!/bin/bash

###############################################################################
# Cogito One-Command Deployment
#
# This is the ONLY script you need to run for a complete setup!
# It handles everything: build, PM2 setup, kiosk mode, everything.
###############################################################################

set -e

echo "╔══════════════════════════════════════════════════╗"
echo "║                                                  ║"
echo "║     Cogito Smart Radio - Complete Deployment    ║"
echo "║                                                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if running on Raspberry Pi
if [ -f /proc/device-tree/model ]; then
    PI_MODEL=$(cat /proc/device-tree/model)
    echo "🍓 Detected: $PI_MODEL"
    IS_PI=true
else
    echo "💻 Detected: Desktop/Laptop (not Raspberry Pi)"
    IS_PI=false
fi

echo ""
echo "This script will set up EVERYTHING automatically:"
echo ""
echo "✅ Build backend & frontend"
echo "✅ Install and configure PM2"
echo "✅ Start all services in background"
echo "✅ Set services to auto-start on boot"
if [ "$IS_PI" = true ]; then
    echo "✅ Configure Firefox kiosk mode (Pi only)"
fi
echo ""
echo "After this runs, your system will:"
echo "  - Start all services automatically on boot"
echo "  - No terminals needed"
echo "  - Just plug in power and go!"
echo ""
read -p "Ready to deploy? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

###############################################################################
# Run production setup
###############################################################################
echo ""
echo "══════════════════════════════════════════════════"
echo "  Running Production Setup"
echo "══════════════════════════════════════════════════"
echo ""

# Make sure scripts are executable
chmod +x setup-production.sh setup-kiosk.sh

# Run production setup (non-interactive mode)
export DEBIAN_FRONTEND=noninteractive

# Build backend
echo "🔨 Building backend..."
cd "$SCRIPT_DIR/backend"
if [ ! -d "node_modules" ]; then
    npm install --silent
fi
npm run build
echo "✅ Backend built"

# Build frontend
echo "🔨 Building frontend..."
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install --silent
fi
npm run build
echo "✅ Frontend built"

# Setup hardware service
echo "🔧 Setting up hardware service..."
cd "$SCRIPT_DIR/hardware-service"
if [ ! -d "node_modules" ]; then
    npm install --silent
fi
echo "✅ Hardware service ready"

# Create logs directory
mkdir -p "$SCRIPT_DIR/logs"
echo "✅ Logs directory created"

# Install PM2 if needed
if ! command -v pm2 >/dev/null 2>&1; then
    echo "📦 Installing PM2..."
    npm install -g pm2
    echo "✅ PM2 installed"
else
    echo "✅ PM2 already installed"
fi

###############################################################################
# Start services with PM2
###############################################################################
echo ""
echo "══════════════════════════════════════════════════"
echo "  Starting Services"
echo "══════════════════════════════════════════════════"
echo ""

cd "$SCRIPT_DIR"

# Stop any existing PM2 processes
pm2 delete all 2>/dev/null || true

# Start all services
echo "🚀 Starting all services..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save --force

echo "✅ All services started"

###############################################################################
# Configure PM2 startup
###############################################################################
echo ""
echo "══════════════════════════════════════════════════"
echo "  Configuring Auto-Start on Boot"
echo "══════════════════════════════════════════════════"
echo ""

# Get the PM2 startup command
STARTUP_CMD=$(pm2 startup systemd | grep "sudo env" || true)

if [ -n "$STARTUP_CMD" ]; then
    echo "Enabling PM2 on boot..."
    echo "You may be asked for your sudo password..."
    eval "$STARTUP_CMD"
    pm2 save --force
    echo "✅ PM2 will start on boot"
else
    echo "⚠️  Could not configure PM2 startup automatically"
    echo "   Run this manually after deployment:"
    echo "   pm2 startup"
fi

###############################################################################
# Display status
###############################################################################
echo ""
echo "══════════════════════════════════════════════════"
echo "  Service Status"
echo "══════════════════════════════════════════════════"
echo ""

sleep 2
pm2 status

###############################################################################
# Kiosk mode setup (Pi only)
###############################################################################
if [ "$IS_PI" = true ]; then
    echo ""
    echo "══════════════════════════════════════════════════"
    echo "  Kiosk Mode Setup (Optional)"
    echo "══════════════════════════════════════════════════"
    echo ""
    echo "Do you want to setup Firefox kiosk mode?"
    echo "(Browser will auto-launch fullscreen on boot)"
    echo ""
    read -p "Setup kiosk mode? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Install Firefox if needed
        if ! command -v firefox >/dev/null 2>&1; then
            echo "📦 Installing Firefox..."
            sudo apt-get update -qq
            sudo apt-get install -y firefox-esr
        fi

        # Create kiosk startup script
        cat > "$SCRIPT_DIR/start-kiosk.sh" << 'KIOSK_EOF'
#!/bin/bash
sleep 10
for i in {1..30}; do
    curl -s http://localhost:4000 >/dev/null 2>&1 && break
    sleep 1
done
for i in {1..30}; do
    curl -s http://localhost:5174 >/dev/null 2>&1 && break
    sleep 1
done
xset s off 2>/dev/null
xset -dpms 2>/dev/null
xset s noblank 2>/dev/null
unclutter -idle 0.1 -root 2>/dev/null &
firefox --kiosk http://localhost:5174 &
wait
KIOSK_EOF

        chmod +x "$SCRIPT_DIR/start-kiosk.sh"

        # Install unclutter
        if ! command -v unclutter >/dev/null 2>&1; then
            sudo apt-get install -y unclutter
        fi

        # Create autostart
        mkdir -p ~/.config/autostart
        cat > ~/.config/autostart/cogito-kiosk.desktop << DESKTOP_EOF
[Desktop Entry]
Type=Application
Name=Cogito Kiosk
Exec=$SCRIPT_DIR/start-kiosk.sh
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
DESKTOP_EOF

        echo "✅ Kiosk mode configured"
    fi
fi

###############################################################################
# Final summary
###############################################################################
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║                                                  ║"
echo "║          ✅ Deployment Complete! ✅              ║"
echo "║                                                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "🎉 Cogito is now running!"
echo ""
echo "📊 View status:"
echo "   pm2 status"
echo ""
echo "📝 View logs:"
echo "   pm2 logs"
echo ""
echo "🌐 Access web interface:"
echo "   http://localhost:5174"
echo ""
if [ "$IS_PI" = true ]; then
    echo "🔄 To enable kiosk mode on boot:"
    echo "   sudo reboot"
    echo ""
fi
echo "📖 Full documentation:"
echo "   cat PRODUCTION_DEPLOYMENT.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Demo Day Checklist:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. ✅ All services auto-start on boot"
echo "2. ✅ PM2 manages everything in background"
if [ "$IS_PI" = true ]; then
    echo "3. ✅ Firefox opens fullscreen automatically"
fi
echo ""
echo "On demo day: Just plug in power & HDMI. Done! 🚀"
echo ""
