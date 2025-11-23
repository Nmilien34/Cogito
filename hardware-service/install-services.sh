#!/bin/bash
# Cogito Service Installation Script
# Run this on the Raspberry Pi to install systemd services

set -e

echo "========================================"
echo "Cogito Service Installer"
echo "========================================"
echo ""

# Check if running on Raspberry Pi
if [ ! -f /proc/device-tree/model ]; then
    echo "⚠️  Warning: This doesn't appear to be a Raspberry Pi"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if running as non-root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please run as regular user (not sudo)"
    echo "   Usage: ./install-services.sh"
    exit 1
fi

echo "📋 Pre-installation checks..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check Python3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found"
    exit 1
fi
echo "✅ Python3 $(python3 --version)"

# Check Chromium
if ! command -v chromium-browser &> /dev/null; then
    echo "❌ Chromium not found"
    exit 1
fi
echo "✅ Chromium browser installed"

# Check user groups
echo ""
echo "👤 Checking user permissions..."
if groups | grep -q gpio; then
    echo "✅ User in 'gpio' group"
else
    echo "⚠️  User not in 'gpio' group"
    echo "   Run: sudo usermod -a -G gpio $USER"
    echo "   Then logout and login again"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if groups | grep -q i2c; then
    echo "✅ User in 'i2c' group"
else
    echo "⚠️  User not in 'i2c' group"
    echo "   Run: sudo usermod -a -G i2c $USER"
fi

# Check if services already exist
echo ""
echo "🔍 Checking existing services..."
if systemctl list-unit-files | grep -q cogito-hardware.service; then
    echo "⚠️  Cogito services already installed"
    read -p "Reinstall? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi

    echo "🛑 Stopping existing services..."
    sudo systemctl stop cogito-hardware.service 2>/dev/null || true
    sudo systemctl stop cogito-button.service 2>/dev/null || true
    sudo systemctl stop cogito-frontend.service 2>/dev/null || true
fi

# Install service files
echo ""
echo "📦 Installing systemd services..."

sudo cp systemd/cogito-hardware.service /etc/systemd/system/
echo "✅ Installed cogito-hardware.service"

sudo cp systemd/cogito-button.service /etc/systemd/system/
echo "✅ Installed cogito-button.service"

sudo cp systemd/cogito-frontend.service /etc/systemd/system/
echo "✅ Installed cogito-frontend.service"

# Reload systemd
echo ""
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

# Enable services
echo ""
echo "✅ Enabling services to start on boot..."
sudo systemctl enable cogito-hardware.service
sudo systemctl enable cogito-button.service
sudo systemctl enable cogito-frontend.service

echo ""
echo "========================================"
echo "✅ Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Update frontend .env file with your Vapi public key:"
echo "   nano ~/cogito/frontend/.env"
echo ""
echo "2. Start services:"
echo "   sudo systemctl start cogito-hardware.service"
echo "   sudo systemctl start cogito-button.service"
echo "   sudo systemctl start cogito-frontend.service"
echo ""
echo "3. Check status:"
echo "   sudo systemctl status cogito-hardware.service"
echo "   sudo systemctl status cogito-button.service"
echo "   sudo systemctl status cogito-frontend.service"
echo ""
echo "4. View logs:"
echo "   sudo journalctl -u cogito-hardware.service -f"
echo ""
echo "5. Test button press!"
echo ""
echo "To start all services now, run:"
echo "  sudo systemctl start cogito-hardware.service cogito-button.service"
echo ""
