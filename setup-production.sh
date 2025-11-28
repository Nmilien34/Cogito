#!/bin/bash

###############################################################################
# Cogito Production Setup Script
#
# This script prepares the Cogito system for production deployment on Pi:
# 1. Builds backend TypeScript
# 2. Builds frontend React app
# 3. Creates logs directory
# 4. Installs PM2 if needed
# 5. Sets up PM2 to run on boot
###############################################################################

set -e  # Exit on error

echo "=================================================="
echo "  Cogito Production Setup"
echo "=================================================="
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if running on Raspberry Pi
if [ -f /proc/device-tree/model ]; then
    PI_MODEL=$(cat /proc/device-tree/model)
    echo "🍓 Detected: $PI_MODEL"
fi

echo ""
echo "This script will:"
echo "  1. Build the backend (TypeScript)"
echo "  2. Build the frontend (React + Vite)"
echo "  3. Create logs directory"
echo "  4. Install PM2 process manager"
echo "  5. Configure PM2 to start on boot"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled"
    exit 1
fi

###############################################################################
# Step 1: Build Backend
###############################################################################
echo ""
echo "=================================================="
echo "  Step 1: Building Backend"
echo "=================================================="
echo ""

cd "$SCRIPT_DIR/backend"

if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
else
    echo "✅ Backend dependencies already installed"
fi

echo "🔨 Building backend TypeScript..."
npm run build

if [ -f "dist/index.js" ]; then
    echo "✅ Backend built successfully"
else
    echo "❌ Backend build failed"
    exit 1
fi

###############################################################################
# Step 2: Build Frontend
###############################################################################
echo ""
echo "=================================================="
echo "  Step 2: Building Frontend"
echo "=================================================="
echo ""

cd "$SCRIPT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

echo "🔨 Building frontend React app..."
npm run build

if [ -d "dist" ]; then
    echo "✅ Frontend built successfully"
else
    echo "❌ Frontend build failed"
    exit 1
fi

###############################################################################
# Step 3: Setup Hardware Service
###############################################################################
echo ""
echo "=================================================="
echo "  Step 3: Setting up Hardware Service"
echo "=================================================="
echo ""

cd "$SCRIPT_DIR/hardware-service"

if [ ! -d "node_modules" ]; then
    echo "📦 Installing hardware service dependencies..."
    npm install
else
    echo "✅ Hardware service dependencies already installed"
fi

# Check Python dependencies
echo "🐍 Checking Python dependencies..."
python3 -c "import RPi.GPIO" 2>/dev/null || {
    echo "⚠️  RPi.GPIO not found (this is OK if not on Pi)"
}

###############################################################################
# Step 4: Create Logs Directory
###############################################################################
echo ""
echo "=================================================="
echo "  Step 4: Creating Logs Directory"
echo "=================================================="
echo ""

cd "$SCRIPT_DIR"
mkdir -p logs
echo "✅ Logs directory created at $SCRIPT_DIR/logs"

###############################################################################
# Step 5: Install PM2
###############################################################################
echo ""
echo "=================================================="
echo "  Step 5: Installing PM2"
echo "=================================================="
echo ""

if command -v pm2 >/dev/null 2>&1; then
    echo "✅ PM2 already installed ($(pm2 --version))"
else
    echo "📦 Installing PM2 globally (requires sudo)..."
    sudo npm install -g pm2
    echo "✅ PM2 installed successfully"
fi

###############################################################################
# Step 6: Setup PM2 Startup
###############################################################################
echo ""
echo "=================================================="
echo "  Step 6: PM2 Startup Configuration"
echo "=================================================="
echo ""

echo "Setting up PM2 to start on boot..."
echo ""
echo "⚠️  IMPORTANT: You'll need to run the command that PM2 outputs"
echo "   Copy and paste the command it shows (starts with 'sudo env...')"
echo ""
read -p "Press Enter to continue..."

pm2 startup

echo ""
echo "=================================================="
echo "  ✅ Production Setup Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start all services:"
echo "   pm2 start ecosystem.config.js"
echo ""
echo "2. Check status:"
echo "   pm2 status"
echo ""
echo "3. View logs:"
echo "   pm2 logs"
echo ""
echo "4. Save PM2 config (so it starts on boot):"
echo "   pm2 save"
echo ""
echo "5. Setup kiosk mode (browser auto-start):"
echo "   ./setup-kiosk.sh"
echo ""
