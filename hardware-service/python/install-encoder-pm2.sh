#!/bin/bash
##############################################################################
# Cogito ANO Encoder - PM2 Installation Script
#
# Quick setup for ANO Rotary Encoder with PM2 process management
#
# Usage:
#   chmod +x install-encoder-pm2.sh
#   ./install-encoder-pm2.sh
##############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  ANO Encoder - PM2 Installation                              ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

##############################################################################
# Check Prerequisites
##############################################################################

echo -e "${YELLOW}[1/5]${NC} Checking prerequisites..."

# Check I2C
if ! lsmod | grep -q "i2c"; then
    echo -e "${RED}❌ I2C not enabled. Please run: sudo raspi-config${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} I2C enabled"

# Check Python3
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Python 3 found"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 not found${NC}"
    echo "Install PM2 with: npm install -g pm2"
    exit 1
fi
echo -e "${GREEN}✓${NC} PM2 found"

##############################################################################
# Install Dependencies
##############################################################################

echo ""
echo -e "${YELLOW}[2/5]${NC} Installing system dependencies..."

sudo apt-get update -qq
sudo apt-get install -y i2c-tools alsa-utils python3-pip python3-dev

echo -e "${GREEN}✓${NC} System dependencies installed"

##############################################################################
# Detect Encoder
##############################################################################

echo ""
echo -e "${YELLOW}[3/5]${NC} Detecting ANO encoder..."

if sudo i2cdetect -y 1 | grep -q "49"; then
    echo -e "${GREEN}✓${NC} Encoder detected at 0x49"
else
    echo -e "${YELLOW}⚠️  Encoder not detected (this is OK if not connected yet)${NC}"
fi

##############################################################################
# Install Python Dependencies
##############################################################################

echo ""
echo -e "${YELLOW}[4/5]${NC} Installing Python dependencies..."

pip3 install -r "$SCRIPT_DIR/requirements-encoder.txt"

echo -e "${GREEN}✓${NC} Python dependencies installed"

##############################################################################
# Configure Permissions
##############################################################################

echo ""
echo -e "${YELLOW}[5/5]${NC} Configuring permissions..."

CURRENT_USER=$(whoami)
NEED_REBOOT=false

if ! groups $CURRENT_USER | grep -q "i2c"; then
    sudo usermod -aG i2c $CURRENT_USER
    NEED_REBOOT=true
    echo "Added $CURRENT_USER to i2c group"
fi

if ! groups $CURRENT_USER | grep -q "gpio"; then
    sudo usermod -aG gpio $CURRENT_USER
    NEED_REBOOT=true
    echo "Added $CURRENT_USER to gpio group"
fi

echo -e "${GREEN}✓${NC} Permissions configured"

##############################################################################
# Complete
##############################################################################

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  Installation Complete!                                       ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$NEED_REBOOT" = true ]; then
    echo -e "${YELLOW}⚠️  Group permissions updated - reboot required${NC}"
    echo ""
    echo "After reboot, start the encoder service:"
    echo ""
    echo -e "${GREEN}cd $PROJECT_ROOT${NC}"
    echo -e "${GREEN}pm2 reload ecosystem.config.js${NC}"
    echo -e "${GREEN}pm2 save${NC}"
    echo ""
    read -p "Reboot now? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo reboot
    fi
else
    echo -e "${GREEN}Next steps:${NC}"
    echo ""
    echo "1. Navigate to project root:"
    echo -e "   ${BLUE}cd $PROJECT_ROOT${NC}"
    echo ""
    echo "2. Reload PM2 with new encoder service:"
    echo -e "   ${BLUE}pm2 reload ecosystem.config.js${NC}"
    echo ""
    echo "3. Save PM2 configuration:"
    echo -e "   ${BLUE}pm2 save${NC}"
    echo ""
    echo "4. Check service status:"
    echo -e "   ${BLUE}pm2 status${NC}"
    echo ""
    echo "5. View encoder logs:"
    echo -e "   ${BLUE}pm2 logs encoder-service${NC}"
    echo ""
    echo -e "${YELLOW}💡 Tip: Run 'pm2 monit' for live monitoring of all services${NC}"
fi

echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  PM2 Guide:    $SCRIPT_DIR/PM2_SETUP.md"
echo "  Full Setup:   $SCRIPT_DIR/ENCODER_SETUP.md"
echo "  Quick Start:  $SCRIPT_DIR/README_ENCODER.md"
