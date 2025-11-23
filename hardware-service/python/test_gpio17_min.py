import RPi.GPIO as GPIO
import time

PIN = 17

GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

print("Watching GPIO17. 1 = HIGH, 0 = LOW. Ctrl+C to stop.")

try:
    while True:
        print("GPIO17 =", GPIO.input(PIN))
        time.sleep(0.5)
except KeyboardInterrupt:
    pass
finally:
    GPIO.cleanup()

