#!/bin/bash

# Cogito Hardware Service Setup Script
# Run this script on your Raspberry Pi to set up the hardware service

set -e  # Exit on error

echo "🚀 Cogito Hardware Service Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on Raspberry Pi
if [ ! -f /proc/device-tree/model ] || ! grep -q "Raspberry Pi" /proc/device-tree/model; then
    echo -e "${YELLOW}⚠️  Warning: This doesn't appear to be a Raspberry Pi${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if I2C is enabled
echo "🔍 Checking I2C..."
if ! lsmod | grep -q i2c; then
    echo -e "${YELLOW}⚠️  I2C not detected. Enabling I2C...${NC}"
    echo "dtparam=i2c_arm=on" | sudo tee -a /boot/config.txt
    echo -e "${YELLOW}⚠️  I2C enabled. Please reboot and run this script again.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ I2C is enabled${NC}"
fi

# Check for Node.js
echo ""
echo "🔍 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"
fi

# Check for Python 3
echo ""
echo "🔍 Checking Python 3..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found${NC}"
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip
else
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python 3 found: $PYTHON_VERSION${NC}"
fi

# Check for pip3
echo ""
echo "🔍 Checking pip3..."
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}❌ pip3 not found${NC}"
    sudo apt-get install -y python3-pip
else
    echo -e "${GREEN}✅ pip3 found${NC}"
fi

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
if [ -f "python/requirements.txt" ]; then
    pip3 install -r python/requirements.txt
    echo -e "${GREEN}✅ Python dependencies installed${NC}"
else
    echo -e "${RED}❌ python/requirements.txt not found${NC}"
    exit 1
fi

# Install Node.js dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✅ Node.js dependencies installed${NC}"
else
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

# Test I2C detection
echo ""
echo "🔍 Testing I2C devices..."
if command -v i2cdetect &> /dev/null; then
    echo "Scanning I2C bus..."
    sudo i2cdetect -y 1
    echo -e "${GREEN}✅ I2C scan complete${NC}"
    echo -e "${YELLOW}ℹ️  Look for device at 0x60 (TEA5767 radio)${NC}"
else
    echo -e "${YELLOW}⚠️  i2cdetect not found. Install with: sudo apt-get install i2c-tools${NC}"
fi

# Test Python radio control
echo ""
echo "🧪 Testing Python radio control..."
if [ -f "python/radio-control.py" ]; then
    echo "Testing radio control script..."
    python3 python/radio-control.py stop 2>&1 || true
    echo -e "${GREEN}✅ Python script is executable${NC}"
else
    echo -e "${RED}❌ python/radio-control.py not found${NC}"
    exit 1
fi

# Check GPIO permissions
echo ""
echo "🔍 Checking GPIO permissions..."
if groups | grep -q gpio; then
    echo -e "${GREEN}✅ User is in gpio group${NC}"
else
    echo -e "${YELLOW}⚠️  User is not in gpio group${NC}"
    echo "Adding user to gpio group..."
    sudo usermod -a -G gpio $USER
    echo -e "${YELLOW}⚠️  Please logout and login again for GPIO permissions to take effect${NC}"
fi

# Summary
echo ""
echo "================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "================================"
echo ""
echo "Next steps:"
echo "1. If GPIO permissions were changed, logout and login again"
echo "2. Test the hardware service:"
echo "   node hardware-service.js"
echo "3. Test radio control:"
echo "   python3 python/radio-control.py 97.1"
echo "4. Test HTTP endpoints:"
echo "   curl http://localhost:3001/health"
echo ""
echo "For more information, see SETUP_GUIDE.md"
echo ""

