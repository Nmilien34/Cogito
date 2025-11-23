#!/usr/bin/env python3
import RPi.GPIO as GPIO
import subprocess
import time
import sys

# --- CONFIG ---
BUTTON_PIN = 17          # red button on GPIO17 (BCM)
RADIO_FREQ = 97.9        # default station to play
DEBOUNCE_SEC = 0.3       # 300 ms debounce

# --- GPIO SETUP ---
GPIO.setmode(GPIO.BCM)
GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

mode = "radio"  # 'radio' or 'ai'


def start_radio():
    """Turn the radio ON at RADIO_FREQ."""
    print("\n[MODE] RADIO MODE - turning radio ON")
    try:
        subprocess.run(
            ["python3", "radio-control.py", "set", str(RADIO_FREQ)],
            check=True
        )
    except subprocess.CalledProcessError as e:
        print("Error starting radio:", e)


def stop_radio():
    """Stop/mute the radio."""
    print("\n[MODE] AI MODE - stopping radio (entering AI mode)")
    try:
        subprocess.run(
            ["python3", "radio-control.py", "stop"],
            check=True
        )
    except subprocess.CalledProcessError as e:
        print("Error stopping radio:", e)


def main():
    global mode

    print("====================================")
    print(" BUTTON → toggle RADIO  <->  AI mode")
    print(" - RADIO MODE: radio playing")
    print(" - AI MODE:   radio stopped, just prints text")
    print("====================================")
    print("\nStarting in RADIO MODE...\n")

    # Start with radio playing
    start_radio()

    last_state = GPIO.input(BUTTON_PIN)
    last_press_time = 0.0

    try:
        while True:
            state = GPIO.input(BUTTON_PIN)
            now = time.time()

            # Detect button press: HIGH -> LOW
            if state == GPIO.LOW and last_state == GPIO.HIGH:
                # Debounce
                if now - last_press_time > DEBOUNCE_SEC:
                    print("\n[BUTTON] Press detected")

                    if mode == "radio":
                        # Go to AI MODE
                        stop_radio()
                        mode = "ai"
                    else:
                        # Go back to RADIO MODE
                        start_radio()
                        mode = "radio"

                    last_press_time = now

            last_state = state
            time.sleep(0.01)

    except KeyboardInterrupt:
        print("\nExiting...")
    finally:
        GPIO.cleanup()
        sys.exit(0)


if __name__ == "__main__":
    main()

