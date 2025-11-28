#!/bin/bash
# Complete Cogito Setup Script
# Sets up PM2, builds everything, and configures radio auto-start

set -e  # Exit on error

echo "================================"
echo "🚀 Cogito Complete Setup"
echo "================================"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Run production setup (PM2, builds)
echo -e "${BLUE}Step 1: Building and setting up PM2...${NC}"
./setup-production.sh

# Step 2: Start PM2 services
echo ""
echo -e "${BLUE}Step 2: Starting all services with PM2...${NC}"
pm2 start ecosystem.config.js

# Step 3: Save PM2 configuration
echo ""
echo -e "${BLUE}Step 3: Saving PM2 configuration...${NC}"
pm2 save

# Step 4: Setup FM Radio auto-start
echo ""
echo -e "${BLUE}Step 4: Setting up FM Radio auto-start...${NC}"

# Make radio startup script executable
chmod +x start-radio.sh

# Copy systemd service file
echo "Copying radio service to /etc/systemd/system/..."
sudo cp cogito-radio.service /etc/systemd/system/

# Reload systemd
echo "Reloading systemd..."
sudo systemctl daemon-reload

# Enable service
echo "Enabling radio service..."
sudo systemctl enable cogito-radio.service

# Start service now to test
echo "Starting radio service..."
sudo systemctl start cogito-radio.service

# Check status
echo ""
echo "Radio service status:"
sudo systemctl status cogito-radio.service --no-pager

# Step 5: Setup kiosk mode
echo ""
echo -e "${YELLOW}Step 5: Do you want to setup kiosk mode (Firefox auto-start)? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    ./setup-kiosk.sh
else
    echo "Skipping kiosk mode setup. You can run ./setup-kiosk.sh later."
fi

# Final summary
echo ""
echo "================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "================================"
echo ""
echo "Services running:"
pm2 list
echo ""
echo "Radio status:"
sudo systemctl status cogito-radio.service --no-pager | head -n 5
echo ""
echo -e "${GREEN}Everything is ready for demo day!${NC}"
echo ""
echo "What happens on boot:"
echo "  1. FM Radio auto-starts at 98.5 FM (WBLS) 📻"
echo "  2. All services start automatically (PM2)"
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "  3. Firefox launches in kiosk mode"
fi
echo ""
echo "To test, run: sudo reboot"
echo ""
