import RPi.GPIO as GPIO
import time

PIN = 17

GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)  # internal pull-up ON

print("Reading GPIO 17 every 0.2s. 1 = not pressed, 0 = pressed. Ctrl+C to stop.")

try:
    while True:
        val = GPIO.input(PIN)
        print("GPIO17 =", val)
        time.sleep(0.2)
except KeyboardInterrupt:
    pass
finally:
    GPIO.cleanup()
