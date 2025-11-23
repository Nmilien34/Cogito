#!/usr/bin/env python3
import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
BUTTON_PIN = 17

# Configure with pull-up resistor
GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

print("RED BUTTON TEST")
print("Press the red button!\n")

try:
    last_state = GPIO.input(BUTTON_PIN)
    print(f"Initial state: {last_state}")
    
    while True:
        current_state = GPIO.input(BUTTON_PIN)
        
        if current_state != last_state:
            if current_state == GPIO.LOW:
                print(" BUTTON PRESSED! (LOW)")
            else:
                print("Button released (HIGH)")
            last_state = current_state
        
        time.sleep(0.01)

except KeyboardInterrupt:
    print("\nExiting...")
    GPIO.cleanup()
