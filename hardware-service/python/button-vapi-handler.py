#!/usr/bin/env python3
"""
Cogito Button Handler for Vapi Integration
- Press button: Toggle Radio <-> AI Mode
- AI Mode: Frontend (Chromium) handles Vapi conversation
- Auto-return to radio after 10s of silence
"""

import RPi.GPIO as GPIO
import requests
import time
import threading
import sys
import signal

# Configuration
BUTTON_PIN = 17  # GPIO 17 (BCM numbering)
HARDWARE_SERVICE_URL = "http://localhost:3001"
DEBOUNCE_TIME = 0.3  # seconds
AI_TIMEOUT = 10  # seconds
ACTIVITY_CHECK_INTERVAL = 1.0  # seconds

# State
current_mode = 'radio'
stop_activity_check = threading.Event()

# Setup GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

def check_speech_activity():
    """Background thread to check for speech activity and auto-timeout"""
    global current_mode

    while not stop_activity_check.is_set():
        if current_mode == 'ai':
            try:
                resp = requests.get(
                    f"{HARDWARE_SERVICE_URL}/api/ai/activity",
                    timeout=1.5
                )
                data = resp.json()
                seconds_since = data.get('seconds_since_speech', AI_TIMEOUT + 1)

                if seconds_since >= AI_TIMEOUT:
                    print(f"\n⏱️  Timeout ({AI_TIMEOUT}s) reached, returning to RADIO mode")
                    set_mode('radio')

            except requests.exceptions.RequestException:
                pass  # Silently ignore connection errors

        time.sleep(ACTIVITY_CHECK_INTERVAL)

def set_mode(mode):
    """Set the current mode (radio or ai)"""
    global current_mode

    if mode == current_mode:
        return

    try:
        resp = requests.post(
            f"{HARDWARE_SERVICE_URL}/api/mode/set",
            json={'mode': mode},
            timeout=2
        )

        if resp.ok:
            current_mode = mode

            if mode == 'ai':
                print("\n" + "="*50)
                print("🎤 AI MODE")
                print("="*50)
                print("  Radio muted")
                print("  Vapi conversation started in Chromium")
                print(f"  Auto-return after {AI_TIMEOUT}s of silence")
                print("="*50)

            else:
                print("\n" + "="*50)
                print("📻 RADIO MODE")
                print("="*50)
                print("  Radio resumed")
                print("  Vapi conversation stopped")
                print("  Press button to talk to AI")
                print("="*50)
        else:
            print(f"\n❌ Mode change failed: {resp.text}")

    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error connecting to hardware-service: {e}")
        print("  Is hardware-service.js running on port 3001?")

def toggle_mode():
    """Toggle between radio and AI mode"""
    new_mode = 'ai' if current_mode == 'radio' else 'radio'
    set_mode(new_mode)

def cleanup(signum=None, frame=None):
    """Cleanup on exit"""
    print("\n\n🧹 Cleaning up...")

    # Return to radio mode before exiting
    if current_mode == 'ai':
        print("  Returning to radio mode...")
        set_mode('radio')

    stop_activity_check.set()
    GPIO.cleanup()
    print("✅ Cleanup complete")
    sys.exit(0)

def main():
    print("=" * 60)
    print("COGITO BUTTON HANDLER - Vapi Integration")
    print("=" * 60)
    print(f"Button Pin:     GPIO {BUTTON_PIN} (BCM)")
    print(f"Service URL:    {HARDWARE_SERVICE_URL}")
    print(f"AI Timeout:     {AI_TIMEOUT}s")
    print("=" * 60)
    print("\n📻 Starting in RADIO MODE")
    print("Press button to talk to AI\n")

    # Test connection to hardware service
    try:
        resp = requests.get(f"{HARDWARE_SERVICE_URL}/health", timeout=2)
        if resp.ok:
            print(f"✅ Connected to hardware service: {resp.json()}")
        else:
            print(f"⚠️  Warning: Hardware service responded with error")
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to hardware service: {e}")
        print("Please start hardware-service.js first!")
        sys.exit(1)

    # Setup signal handlers
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    # Start activity monitoring thread
    activity_thread = threading.Thread(target=check_speech_activity, daemon=True)
    activity_thread.start()

    last_state = GPIO.HIGH
    last_press_time = 0.0

    print("\n👂 Listening for button press...\n")

    try:
        while True:
            state = GPIO.input(BUTTON_PIN)
            now = time.time()

            # Detect button press (HIGH -> LOW with pull-up resistor)
            if state == GPIO.LOW and last_state == GPIO.HIGH:
                if now - last_press_time > DEBOUNCE_TIME:
                    print(f"\n🔘 Button pressed! (GPIO {BUTTON_PIN})")
                    toggle_mode()
                    last_press_time = now

            last_state = state
            time.sleep(0.01)  # 10ms polling

    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
