#!/usr/bin/env python3
"""
ANO: Poll when INT triggers, then wait for it to reset
INT moved to GPIO 22 (Pin 15)
"""
import time
import RPi.GPIO as GPIO
import board
import busio
from adafruit_bus_device.i2c_device import I2CDevice

GPIO.setmode(GPIO.BCM)
INT_PIN = 22  # CHANGED from 27 to 22
GPIO.setup(INT_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

i2c = busio.I2C(board.SCL, board.SDA)
device = I2CDevice(i2c, 0x49)

GPIO_BASE = 0x01
GPIO_BULK = 0x04

def read_gpio():
    try:
        with device:
            device.write(bytes([GPIO_BASE, GPIO_BULK]))
            time.sleep(0.001)
            result = bytearray(4)
            device.readinto(result)
            return int.from_bytes(result, 'big')
    except:
        return None

print("="*50)
print("ANO Encoder - INT on GPIO 22")
print("="*50)
print("Rotate wheel or press button\n")

position = 0
last_value = read_gpio()

try:
    while True:
        # Wait for INT to go LOW (something happened)
        if GPIO.input(INT_PIN) == 0:
            print("INT triggered!")
            
            # Read the GPIO state
            current = read_gpio()
            
            if current is not None and current != last_value:
                xor = current ^ last_value
                
                # Rotation
                if xor & (1 << 15):
                    bit15 = (current >> 15) & 1
                    position += 1 if bit15 else -1
                    print(f"🔄 Position: {position:4d}")
                
                # Button
                if xor & 0x000040FE:
                    if current & 0x000040FE:
                        print(f"🔴 BUTTON")
                
                last_value = current
            
            # Wait for INT to go back HIGH
            while GPIO.input(INT_PIN) == 0:
                time.sleep(0.001)
            
            time.sleep(0.01)  # Debounce
        
        time.sleep(0.001)

except KeyboardInterrupt:
    print(f"\n\nFinal position: {position}")
    GPIO.cleanup()
