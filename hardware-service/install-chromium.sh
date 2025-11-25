#!/bin/bash
# Install Chromium on Raspberry Pi

echo "🔍 Checking for Chromium..."

# Check if already installed
if command -v chromium-browser &> /dev/null; then
    echo "✅ chromium-browser is already installed"
    chromium-browser --version
    exit 0
fi

if command -v chromium &> /dev/null; then
    echo "✅ chromium is already installed"
    chromium --version
    exit 0
fi

echo "📦 Installing Chromium..."

# Update package list
sudo apt-get update

# Install Chromium
sudo apt-get install -y chromium-browser

# Verify installation
if command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium installed successfully!"
    chromium-browser --version
else
    echo "❌ Installation failed. Trying alternative..."
    
    # Try installing chromium (without -browser suffix)
    sudo apt-get install -y chromium
    
    if command -v chromium &> /dev/null; then
        echo "✅ Chromium installed as 'chromium'"
        chromium --version
    else
        echo "❌ Installation failed. Please install manually:"
        echo "   sudo apt-get install -y chromium-browser"
        exit 1
    fi
fi

echo ""
echo "✅ Chromium is ready to use!"
echo "   Command: $(command -v chromium-browser || command -v chromium)"

