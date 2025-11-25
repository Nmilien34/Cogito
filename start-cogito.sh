#!/bin/bash

# Cogito Smart Radio - Startup Script
# This script starts all three required services

echo "=================================================="
echo "  Starting Cogito Smart Radio System"
echo "=================================================="
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if running on Raspberry Pi
if [ -f /proc/device-tree/model ]; then
    PI_MODEL=$(cat /proc/device-tree/model)
    echo "🍓 Detected: $PI_MODEL"
fi

echo ""
echo "This will start 3 processes:"
echo "  1. Hardware Service (Node.js)"
echo "  2. Button Handler (Python)"
echo "  3. Web Interface (React)"
echo ""
echo "Press Ctrl+C in any terminal to stop"
echo ""
read -p "Press Enter to continue..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo ""
echo "Checking dependencies..."

if ! command_exists node; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

if ! command_exists python3; then
    echo "❌ Python 3 not found. Please install Python 3 first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

echo "✅ All dependencies found"
echo ""

# Kill any existing processes on these ports
echo "Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

# Check if we're using tmux or screen
if command_exists tmux; then
    echo "✅ tmux found - using tmux for session management"
    echo ""

    # Kill existing session if it exists
    tmux kill-session -t cogito 2>/dev/null

    # Create new tmux session
    tmux new-session -d -s cogito -n "hardware"

    # Window 1: Hardware Service
    tmux send-keys -t cogito:hardware "cd '$SCRIPT_DIR/hardware-service' && node hardware-service.js" C-m

    # Window 2: Button Handler
    tmux new-window -t cogito -n "button"
    tmux send-keys -t cogito:button "cd '$SCRIPT_DIR/hardware-service/python' && python3 button-vapi-handler.py" C-m

    # Window 3: Web Interface
    tmux new-window -t cogito -n "webapp"
    tmux send-keys -t cogito:webapp "cd '$SCRIPT_DIR/frontend' && npm run dev" C-m

    # Select first window
    tmux select-window -t cogito:hardware

    echo ""
    echo "=================================================="
    echo "  ✅ Cogito is starting in tmux!"
    echo "=================================================="
    echo ""
    echo "To view the session:"
    echo "  tmux attach -t cogito"
    echo ""
    echo "To switch windows inside tmux:"
    echo "  Ctrl+B then 0  (Hardware Service)"
    echo "  Ctrl+B then 1  (Button Handler)"
    echo "  Ctrl+B then 2  (Web Interface)"
    echo ""
    echo "To detach from tmux:"
    echo "  Ctrl+B then D"
    echo ""
    echo "To stop everything:"
    echo "  tmux kill-session -t cogito"
    echo ""
    echo "Web interface will be at: http://localhost:5173"
    echo ""

    # Wait a moment for services to start
    sleep 3

    # Attach to tmux session
    tmux attach -t cogito

elif command_exists screen; then
    echo "✅ screen found - using screen for session management"
    echo ""
    echo "Starting services in screen session 'cogito'..."

    # Kill existing session if it exists
    screen -S cogito -X quit 2>/dev/null

    # Start screen session with hardware service
    screen -dmS cogito -t hardware bash -c "cd '$SCRIPT_DIR/hardware-service' && node hardware-service.js"

    # Add button handler window
    screen -S cogito -X screen -t button bash -c "cd '$SCRIPT_DIR/hardware-service/python' && python3 button-vapi-handler.py"

    # Add web interface window
    screen -S cogito -X screen -t webapp bash -c "cd '$SCRIPT_DIR/frontend' && npm run dev"

    echo ""
    echo "=================================================="
    echo "  ✅ Cogito is running in screen!"
    echo "=================================================="
    echo ""
    echo "To view the session:"
    echo "  screen -r cogito"
    echo ""
    echo "To switch windows inside screen:"
    echo "  Ctrl+A then 0  (Hardware Service)"
    echo "  Ctrl+A then 1  (Button Handler)"
    echo "  Ctrl+A then 2  (Web Interface)"
    echo ""
    echo "To detach from screen:"
    echo "  Ctrl+A then D"
    echo ""
    echo "To stop everything:"
    echo "  screen -S cogito -X quit"
    echo ""
    echo "Web interface will be at: http://localhost:5173"
    echo ""

    # Attach to screen session
    screen -r cogito

else
    echo "⚠️  Neither tmux nor screen found"
    echo ""
    echo "Please install tmux or screen for easier management:"
    echo "  sudo apt-get install tmux"
    echo ""
    echo "Or run these commands in 3 separate terminals:"
    echo ""
    echo "Terminal 1:"
    echo "  cd '$SCRIPT_DIR/hardware-service'"
    echo "  node hardware-service.js"
    echo ""
    echo "Terminal 2:"
    echo "  cd '$SCRIPT_DIR/hardware-service/python'"
    echo "  python3 button-vapi-handler.py"
    echo ""
    echo "Terminal 3:"
    echo "  cd '$SCRIPT_DIR/frontend'"
    echo "  npm run dev"
    echo ""
fi
