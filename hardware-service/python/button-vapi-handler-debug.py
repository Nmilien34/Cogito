#!/usr/bin/env python3
"""
Cogito Button Handler for Vapi Integration - DEBUG VERSION
With extensive logging for troubleshooting
"""

import RPi.GPIO as GPIO
import requests
import time
import threading
import sys
import signal
from datetime import datetime

# Configuration
BUTTON_PIN = 17  # GPIO 17 (BCM numbering)
HARDWARE_SERVICE_URL = "http://localhost:3001"
DEBOUNCE_TIME = 0.3  # seconds
AI_TIMEOUT = 10  # seconds
ACTIVITY_CHECK_INTERVAL = 1.0  # seconds

# State
current_mode = 'radio'
stop_activity_check = threading.Event()
button_press_count = 0

def log(message, level="INFO"):
    """Enhanced logging with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    print(f"[{timestamp}] [{level}] {message}")
    sys.stdout.flush()

# Setup GPIO
log("🔧 Setting up GPIO...")
try:
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    log(f"✅ GPIO initialized: Pin {BUTTON_PIN} (BCM mode, PULL-UP)", "SUCCESS")
except Exception as e:
    log(f"❌ GPIO setup failed: {e}", "ERROR")
    sys.exit(1)

def check_speech_activity():
    """Background thread to check for speech activity and auto-timeout"""
    global current_mode

    log("🔄 Activity monitor thread started", "THREAD")

    while not stop_activity_check.is_set():
        if current_mode == 'ai':
            try:
                resp = requests.get(
                    f"{HARDWARE_SERVICE_URL}/api/ai/activity",
                    timeout=1.5
                )
                data = resp.json()
                seconds_since = data.get('seconds_since_speech', AI_TIMEOUT + 1)

                log(f"📊 Activity check: {seconds_since:.1f}s since speech (timeout: {AI_TIMEOUT}s)", "DEBUG")

                if seconds_since >= AI_TIMEOUT:
                    log(f"⏱️  TIMEOUT: {AI_TIMEOUT}s reached, switching to RADIO mode", "WARN")
                    set_mode('radio')

            except requests.exceptions.Timeout:
                log("⚠️  Activity check timeout (service slow)", "WARN")
            except requests.exceptions.ConnectionError:
                log("❌ Cannot connect to hardware service for activity check", "ERROR")
            except Exception as e:
                log(f"❌ Activity check error: {e}", "ERROR")

        time.sleep(ACTIVITY_CHECK_INTERVAL)

    log("🔄 Activity monitor thread stopped", "THREAD")

def set_mode(mode):
    """Set the current mode (radio or ai)"""
    global current_mode

    if mode == current_mode:
        log(f"ℹ️  Already in {mode} mode, skipping", "INFO")
        return

    log(f"🔄 Attempting to switch mode: {current_mode} → {mode}", "INFO")

    try:
        resp = requests.post(
            f"{HARDWARE_SERVICE_URL}/api/mode/set",
            json={'mode': mode},
            timeout=2
        )

        log(f"📡 API Response: {resp.status_code} - {resp.text}", "DEBUG")

        if resp.ok:
            current_mode = mode

            if mode == 'ai':
                log("=" * 60, "INFO")
                log("🎤 AI MODE ACTIVATED", "SUCCESS")
                log("=" * 60, "INFO")
                log("  📻 Radio muted", "INFO")
                log("  🌐 Vapi conversation started in Chromium", "INFO")
                log(f"  ⏱️  Auto-return after {AI_TIMEOUT}s of silence", "INFO")
                log("  🔘 Press button again to return to radio", "INFO")
                log("=" * 60, "INFO")
            else:
                log("=" * 60, "INFO")
                log("📻 RADIO MODE ACTIVATED", "SUCCESS")
                log("=" * 60, "INFO")
                log("  📻 Radio resumed", "INFO")
                log("  🛑 Vapi conversation stopped", "INFO")
                log("  🔘 Press button to talk to AI", "INFO")
                log("=" * 60, "INFO")
        else:
            log(f"❌ Mode change failed: HTTP {resp.status_code}", "ERROR")
            log(f"   Response: {resp.text}", "ERROR")

    except requests.exceptions.ConnectionError as e:
        log(f"❌ Cannot connect to hardware-service: {e}", "ERROR")
        log(f"   URL: {HARDWARE_SERVICE_URL}/api/mode/set", "ERROR")
        log("   Is hardware-service.js running on port 3001?", "ERROR")
    except requests.exceptions.Timeout:
        log("❌ Request timeout - hardware service not responding", "ERROR")
    except Exception as e:
        log(f"❌ Unexpected error: {e}", "ERROR")

def toggle_mode():
    """Toggle between radio and AI mode"""
    global button_press_count
    button_press_count += 1

    new_mode = 'ai' if current_mode == 'radio' else 'radio'
    log(f"🔘 BUTTON PRESS #{button_press_count}: Toggling {current_mode} → {new_mode}", "INFO")
    set_mode(new_mode)

def cleanup(signum=None, frame=None):
    """Cleanup on exit"""
    log("\n", "INFO")
    log("🧹 Cleanup initiated...", "INFO")

    # Return to radio mode before exiting
    if current_mode == 'ai':
        log("  Returning to radio mode before exit...", "INFO")
        set_mode('radio')

    stop_activity_check.set()
    log("  Cleaning up GPIO...", "DEBUG")
    GPIO.cleanup()
    log("✅ Cleanup complete - Goodbye!", "SUCCESS")
    sys.exit(0)

def test_hardware_service():
    """Test connection to hardware service"""
    log("🧪 Testing hardware service connection...", "INFO")

    try:
        resp = requests.get(f"{HARDWARE_SERVICE_URL}/health", timeout=2)
        if resp.ok:
            log(f"✅ Hardware service is running: {resp.json()}", "SUCCESS")
            return True
        else:
            log(f"⚠️  Hardware service returned error: {resp.status_code}", "WARN")
            return False
    except requests.exceptions.ConnectionError:
        log(f"❌ Cannot connect to {HARDWARE_SERVICE_URL}", "ERROR")
        log("   Make sure hardware-service.js is running!", "ERROR")
        return False
    except Exception as e:
        log(f"❌ Connection test failed: {e}", "ERROR")
        return False

def test_gpio():
    """Test GPIO button reading"""
    log("🧪 Testing GPIO button (read current state)...", "INFO")
    try:
        state = GPIO.input(BUTTON_PIN)
        state_str = "HIGH (not pressed)" if state == GPIO.HIGH else "LOW (pressed)"
        log(f"✅ GPIO {BUTTON_PIN} current state: {state_str}", "SUCCESS")
        return True
    except Exception as e:
        log(f"❌ GPIO test failed: {e}", "ERROR")
        return False

def main():
    log("=" * 70, "INFO")
    log("COGITO BUTTON HANDLER - Vapi Integration (DEBUG MODE)", "INFO")
    log("=" * 70, "INFO")
    log(f"Button Pin:     GPIO {BUTTON_PIN} (BCM)", "INFO")
    log(f"Service URL:    {HARDWARE_SERVICE_URL}", "INFO")
    log(f"AI Timeout:     {AI_TIMEOUT}s", "INFO")
    log(f"Debounce:       {DEBOUNCE_TIME}s", "INFO")
    log("=" * 70, "INFO")
    log("", "INFO")

    # Test GPIO
    if not test_gpio():
        log("⚠️  GPIO test failed, but continuing anyway...", "WARN")

    # Test connection to hardware service
    log("", "INFO")
    if not test_hardware_service():
        log("", "ERROR")
        log("❌ CRITICAL: Hardware service is not reachable!", "ERROR")
        log("", "ERROR")
        log("Please start hardware-service.js first:", "ERROR")
        log("  cd hardware-service", "ERROR")
        log("  node hardware-service.js", "ERROR")
        log("", "ERROR")
        sys.exit(1)

    # Setup signal handlers
    log("🔧 Setting up signal handlers...", "DEBUG")
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    # Start activity monitoring thread
    log("🔄 Starting activity monitoring thread...", "INFO")
    activity_thread = threading.Thread(target=check_speech_activity, daemon=True)
    activity_thread.start()

    log("", "INFO")
    log("📻 Starting in RADIO MODE", "SUCCESS")
    log("🔘 Press button to talk to AI", "INFO")
    log("", "INFO")
    log("👂 Listening for button press...", "INFO")
    log("", "INFO")

    last_state = GPIO.HIGH
    last_press_time = 0.0
    loop_count = 0

    try:
        while True:
            state = GPIO.input(BUTTON_PIN)
            now = time.time()

            # Log every 10 seconds to show we're alive
            loop_count += 1
            if loop_count % 1000 == 0:  # Every ~10 seconds (10ms * 1000)
                log(f"💓 Heartbeat: Still monitoring button (GPIO {BUTTON_PIN}={state})", "DEBUG")

            # Detect button press (HIGH -> LOW with pull-up resistor)
            if state == GPIO.LOW and last_state == GPIO.HIGH:
                if now - last_press_time > DEBOUNCE_TIME:
                    log(f"", "INFO")
                    log(f"🔘 BUTTON PRESSED! (GPIO {BUTTON_PIN} went LOW)", "SUCCESS")
                    log(f"   Time since last press: {now - last_press_time:.2f}s", "DEBUG")
                    toggle_mode()
                    last_press_time = now
                else:
                    log(f"⚠️  Button bounce detected (ignored, too soon)", "WARN")

            last_state = state
            time.sleep(0.01)  # 10ms polling

    except KeyboardInterrupt:
        log("", "INFO")
        log("⌨️  Keyboard interrupt received", "INFO")
        cleanup()
    except Exception as e:
        log(f"❌ Unexpected error in main loop: {e}", "ERROR")
        cleanup()

if __name__ == "__main__":
    main()
