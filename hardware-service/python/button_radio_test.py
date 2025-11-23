#!/usr/bin/env python3
import RPi.GPIO as GPIO
import subprocess
import time
import sys

# -------- CONFIG --------
BUTTON_PIN = 17          # your red button is on GPIO 17
DEFAULT_FREQ = 97.9      # any station that you know works
DEBOUNCE_TIME = 0.3      # seconds
# ------------------------

GPIO.setmode(GPIO.BCM)
GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

def radio_on():
    print("\n[MODE] RADIO MODE - turning radio ON")
    try:
        subprocess.run(
            ["python3", "radio-control.py", "set", str(DEFAULT_FREQ)],
            check=True
        )
    except subprocess.CalledProcessError as e:
        print("Error starting radio:", e)

def radio_off():
    print("\n[MODE] AI MODE ENTERED - stopping radio")
    try:
        subprocess.run(
            ["python3", "radio-control.py", "stop"],
            check=True
        )
    except subprocess.CalledProcessError as e:
        print("Error stopping radio:", e)

def main():
    # start in RADIO mode
    radio_playing = True
    radio_on()

    print("\n====================================")
    print(" BUTTON → toggle RADIO  <->  AI mode")
    print(" - Radio mode: radio playing")
    print(" - AI mode: radio stopped, just prints text")
    print("====================================\n")

    last_state = GPIO.input(BUTTON_PIN)
    last_press_time = 0.0

    try:
        while True:
            state = GPIO.input(BUTTON_PIN)
            now = time.time()

            # detect press (HIGH -> LOW)
            if state == GPIO.LOW and last_state == GPIO.HIGH:
                if now - last_press_time > DEBOUNCE_TIME:
                    last_press_time = now
                    if radio_playing:
                        # go to "AI" mode
                        radio_off()
                        radio_playing = False
                    else:
                        # go back to radio
                        radio_on()
                        radio_playing = True

            last_state = state
            time.sleep(0.01)

    except KeyboardInterrupt:
        print("\nExiting, turning radio off and cleaning up GPIO...")
        radio_off()
        GPIO.cleanup()
        sys.exit(0)

if __name__ == "__main__":
    main()

