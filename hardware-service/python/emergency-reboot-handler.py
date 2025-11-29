#!/usr/bin/env python3
"""
Emergency Reboot Button Handler

Hardware:
- Button: Red button module (same type as mode button)
- GPIO: GPIO 27 (Pin 13)
- Mode: INPUT with PULL_UP (Active LOW)

Safety Features:
- Requires holding button for 5 seconds (prevents accidental reboots)
- Debouncing
- Logging all reboot attempts
- Visual countdown feedback

Wiring:
  VCC (3.3V)  →  Pin 17 (3.3V)
  GND         →  Pin 9 or 14 (GND)
  SIG/OUT     →  Pin 13 (GPIO 27)
"""

import RPi.GPIO as GPIO
import time
import os
import logging
from datetime import datetime

# Configuration
REBOOT_BUTTON = 27  # GPIO 27 (BCM numbering)
HOLD_TIME = 5.0     # Seconds to hold for reboot (safety feature)
DEBOUNCE_TIME = 0.1 # Debounce delay in seconds
CHECK_INTERVAL = 0.05  # How often to check button state

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/tmp/emergency-reboot.log')
    ]
)
logger = logging.getLogger('emergency-reboot')


def init_gpio():
    """Initialize GPIO for emergency reboot button."""
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(REBOOT_BUTTON, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    logger.info("🚨 Emergency Reboot Button initialized on GPIO %d", REBOOT_BUTTON)
    logger.info("⏱️  Hold button for %.1f seconds to trigger reboot", HOLD_TIME)


def is_button_pressed():
    """Check if button is currently pressed (active LOW)."""
    return GPIO.input(REBOOT_BUTTON) == GPIO.LOW


def wait_for_button_release():
    """Wait until button is released."""
    while is_button_pressed():
        time.sleep(0.01)


def trigger_reboot():
    """Trigger system reboot with logging."""
    logger.critical("🚨 EMERGENCY REBOOT TRIGGERED!")
    logger.critical("⏰ Reboot time: %s", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

    # Flush logs
    for handler in logger.handlers:
        handler.flush()

    # Give logs time to write
    time.sleep(0.5)

    # Trigger reboot
    print("\n" + "="*60)
    print("🚨 EMERGENCY REBOOT ACTIVATED")
    print("="*60)
    print("System will reboot NOW...")
    print("")

    os.system('sudo reboot')


def countdown_display(elapsed, total):
    """Display countdown progress."""
    remaining = total - elapsed
    progress = int((elapsed / total) * 20)
    bar = "█" * progress + "░" * (20 - progress)

    print(f"\r🚨 HOLD TO REBOOT: [{bar}] {remaining:.1f}s ", end="", flush=True)


def monitor_button():
    """Main monitoring loop with hold-to-confirm logic."""
    logger.info("✅ Monitoring emergency reboot button...")
    logger.info("📍 Listening on GPIO %d (Pin 13)", REBOOT_BUTTON)
    logger.info("")

    button_pressed = False
    press_start_time = 0
    last_check_time = 0

    try:
        while True:
            current_time = time.time()

            # Check button state
            if is_button_pressed():
                if not button_pressed:
                    # Button just pressed
                    button_pressed = True
                    press_start_time = current_time
                    logger.info("🔴 Emergency button PRESSED - hold for %.1fs to reboot", HOLD_TIME)
                    print("")  # New line for countdown

                # Calculate how long button has been held
                hold_duration = current_time - press_start_time

                # Show countdown every 0.1s
                if current_time - last_check_time >= 0.1:
                    countdown_display(hold_duration, HOLD_TIME)
                    last_check_time = current_time

                # Check if held long enough
                if hold_duration >= HOLD_TIME:
                    print("\n")  # New line after countdown
                    logger.warning("⚠️  REBOOT THRESHOLD REACHED!")

                    # Double-check button is still pressed
                    time.sleep(0.1)
                    if is_button_pressed():
                        trigger_reboot()
                        # Function above calls reboot, but just in case:
                        break
                    else:
                        logger.info("✋ Button released just before reboot - cancelled")
                        button_pressed = False
                        print("")

            else:
                # Button not pressed or released
                if button_pressed:
                    # Button was just released
                    hold_duration = current_time - press_start_time
                    print("\n")  # New line after countdown

                    if hold_duration < HOLD_TIME:
                        logger.info("✋ Button released early (%.1fs) - reboot cancelled", hold_duration)

                    button_pressed = False
                    press_start_time = 0

            # Small delay to prevent CPU spinning
            time.sleep(CHECK_INTERVAL)

    except KeyboardInterrupt:
        print("\n")
        logger.info("🛑 Emergency reboot handler stopped by user")

    finally:
        cleanup_gpio()


def cleanup_gpio():
    """Clean up GPIO on exit."""
    logger.info("🧹 Cleaning up GPIO...")
    GPIO.cleanup()


def main():
    """Main entry point."""
    print("="*60)
    print("🚨 EMERGENCY REBOOT BUTTON HANDLER")
    print("="*60)
    print(f"GPIO Pin: {REBOOT_BUTTON} (Pin 13)")
    print(f"Hold Time: {HOLD_TIME} seconds")
    print(f"Log File: /tmp/emergency-reboot.log")
    print("="*60)
    print()

    # Initialize
    init_gpio()

    # Log startup
    logger.info("="*60)
    logger.info("🚀 Emergency Reboot Handler Started")
    logger.info("="*60)
    logger.info("System: Raspberry Pi")
    logger.info("Python version: %s", os.sys.version.split()[0])
    logger.info("User: %s", os.getenv('USER', 'unknown'))
    logger.info("="*60)

    # Start monitoring
    monitor_button()


if __name__ == "__main__":
    main()
