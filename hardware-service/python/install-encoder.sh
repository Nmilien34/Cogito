#!/bin/bash
##############################################################################
# Cogito ANO Encoder - Quick Installation Script
#
# This script automates the installation and setup of the ANO rotary encoder
# service on Raspberry Pi.
#
# Usage:
#   chmod +x install-encoder.sh
#   ./install-encoder.sh
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="cogito-encoder"
PYTHON_CMD="python3"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  Cogito ANO Rotary Encoder - Installation Script            ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

##############################################################################
# Check Prerequisites
##############################################################################

echo -e "${YELLOW}[1/7]${NC} Checking prerequisites..."

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: This doesn't appear to be a Raspberry Pi${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if I2C is enabled
if ! lsmod | grep -q "i2c"; then
    echo -e "${RED}❌ I2C is not enabled${NC}"
    echo "Please enable I2C:"
    echo "  sudo raspi-config"
    echo "  → Interfacing Options → I2C → Enable"
    exit 1
fi

echo -e "${GREEN}✓${NC} I2C is enabled"

# Check for Python3
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Python 3 is available"

##############################################################################
# Install System Dependencies
##############################################################################

echo ""
echo -e "${YELLOW}[2/7]${NC} Installing system dependencies..."

sudo apt-get update -qq

# Install I2C tools
if ! command -v i2cdetect &> /dev/null; then
    echo "Installing i2c-tools..."
    sudo apt-get install -y i2c-tools
fi

# Install audio tools
if ! command -v amixer &> /dev/null; then
    echo "Installing alsa-utils..."
    sudo apt-get install -y alsa-utils
fi

# Install Python dev tools
sudo apt-get install -y python3-pip python3-dev

echo -e "${GREEN}✓${NC} System dependencies installed"

##############################################################################
# Detect Encoder
##############################################################################

echo ""
echo -e "${YELLOW}[3/7]${NC} Detecting ANO encoder..."

if sudo i2cdetect -y 1 | grep -q "49"; then
    echo -e "${GREEN}✓${NC} ANO encoder detected at address 0x49"
else
    echo -e "${RED}❌ ANO encoder not detected at address 0x49${NC}"
    echo ""
    echo "I2C devices found:"
    sudo i2cdetect -y 1
    echo ""
    echo "Please check:"
    echo "  1. Encoder is properly connected"
    echo "  2. Power supply is connected"
    echo "  3. I2C wiring (SDA to GPIO2, SCL to GPIO3)"
    echo ""
    read -p "Continue installation anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

##############################################################################
# Install Python Dependencies
##############################################################################

echo ""
echo -e "${YELLOW}[4/7]${NC} Installing Python dependencies..."

# Install for current user
pip3 install -r "$SCRIPT_DIR/requirements-encoder.txt" --quiet

# Also install system-wide for service
echo "Installing system-wide packages (requires sudo)..."
sudo pip3 install -r "$SCRIPT_DIR/requirements-encoder.txt" --quiet

echo -e "${GREEN}✓${NC} Python dependencies installed"

##############################################################################
# Configure Permissions
##############################################################################

echo ""
echo -e "${YELLOW}[5/7]${NC} Configuring permissions..."

# Add user to i2c and gpio groups
CURRENT_USER=$(whoami)

if ! groups $CURRENT_USER | grep -q "i2c"; then
    echo "Adding $CURRENT_USER to i2c group..."
    sudo usermod -aG i2c $CURRENT_USER
    NEED_REBOOT=true
fi

if ! groups $CURRENT_USER | grep -q "gpio"; then
    echo "Adding $CURRENT_USER to gpio group..."
    sudo usermod -aG gpio $CURRENT_USER
    NEED_REBOOT=true
fi

echo -e "${GREEN}✓${NC} Permissions configured"

##############################################################################
# Make Scripts Executable
##############################################################################

echo ""
echo -e "${YELLOW}[6/7]${NC} Making scripts executable..."

chmod +x "$SCRIPT_DIR/ano_encoder.py"
chmod +x "$SCRIPT_DIR/encoder_service.py"
chmod +x "$SCRIPT_DIR/radio-control.py"

echo -e "${GREEN}✓${NC} Scripts are executable"

##############################################################################
# Install Systemd Service
##############################################################################

echo ""
echo -e "${YELLOW}[7/7]${NC} Installing systemd service..."

# Update service file with correct paths
SERVICE_FILE="$SCRIPT_DIR/cogito-encoder.service"
TEMP_SERVICE="/tmp/cogito-encoder.service"

# Replace paths in service file
sed "s|/home/radioassistant/Desktop/Cogito|$SCRIPT_DIR/../../..|g" "$SERVICE_FILE" > "$TEMP_SERVICE"
sed -i "s|User=radioassistant|User=$CURRENT_USER|g" "$TEMP_SERVICE"
sed -i "s|Group=radioassistant|Group=$CURRENT_USER|g" "$TEMP_SERVICE"

# Copy to systemd directory
sudo cp "$TEMP_SERVICE" /etc/systemd/system/$SERVICE_NAME.service

# Reload systemd
sudo systemctl daemon-reload

echo -e "${GREEN}✓${NC} Service installed"

##############################################################################
# Test Installation
##############################################################################

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  Installation Complete!                                       ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$NEED_REBOOT" = true ]; then
    echo -e "${YELLOW}⚠️  You need to reboot for group permissions to take effect${NC}"
    echo ""
    echo "After rebooting, start the service with:"
    echo "  sudo systemctl start $SERVICE_NAME"
    echo "  sudo systemctl enable $SERVICE_NAME  # Start on boot"
    echo ""
    read -p "Reboot now? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo reboot
    fi
else
    echo -e "${GREEN}Testing encoder module...${NC}"
    echo ""

    if python3 "$SCRIPT_DIR/ano_encoder.py" <<< "" 2>&1 | grep -q "ANO Encoder initialized"; then
        echo -e "${GREEN}✓${NC} Encoder test passed!"
    else
        echo -e "${YELLOW}⚠️  Encoder test inconclusive (this is OK if hardware isn't connected)${NC}"
    fi

    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo ""
    echo "1. Test the encoder manually:"
    echo "   python3 $SCRIPT_DIR/ano_encoder.py"
    echo ""
    echo "2. Start the service:"
    echo "   sudo systemctl start $SERVICE_NAME"
    echo ""
    echo "3. Enable service to start on boot:"
    echo "   sudo systemctl enable $SERVICE_NAME"
    echo ""
    echo "4. Check service status:"
    echo "   sudo systemctl status $SERVICE_NAME"
    echo ""
    echo "5. View service logs:"
    echo "   sudo journalctl -u $SERVICE_NAME -f"
    echo ""
fi

echo -e "${BLUE}Full documentation: $SCRIPT_DIR/ENCODER_SETUP.md${NC}"
