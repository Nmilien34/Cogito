#!/usr/bin/env python3
"""
ANO Encoder controls Radio Volume and Tuning
- Rotate: Adjust volume or frequency
- Press: Toggle between Volume and Tuning modes
MODIFIED: Works without INT pin (continuous polling)
"""
import time
import RPi.GPIO as GPIO
import board
import busio
from adafruit_bus_device.i2c_device import I2CDevice
import subprocess

# I2C Setup
i2c = busio.I2C(board.SCL, board.SDA)
device = I2CDevice(i2c, 0x49)

GPIO_BASE = 0x01
GPIO_BULK = 0x04

# Radio control
RADIO_SCRIPT = "/home/radioassistant/Desktop/Cogito/hardware-service/python/radio-control.py"

# State
mode = "VOLUME"  # or "TUNING"
volume = 50  # 0-100
frequency = 99.1  # FM frequency
volume_step = 5
freq_step = 0.2

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

def set_volume(vol):
    """Set system volume"""
    vol = max(0, min(100, vol))
    subprocess.run(['amixer', 'set', 'Master', f'{vol}%'], 
                   stdout=subprocess.DEVNULL, 
                   stderr=subprocess.DEVNULL)
    return vol

def tune_radio(freq):
    """Tune radio to frequency"""
    freq = max(87.5, min(108.0, freq))
    subprocess.run(['python3', RADIO_SCRIPT, 'set', str(freq)],
                   stdout=subprocess.DEVNULL,
                   stderr=subprocess.DEVNULL)
    return freq

print("="*60)
print("🎛️  COGITO ENCODER CONTROL (Polling Mode)")
print("="*60)
print("ROTATE: Adjust volume or tuning")
print("PRESS:  Toggle Volume ↔ Tuning mode")
print("="*60)
print(f"\nMode: {mode}")
print(f"Volume: {volume}%")
print(f"Frequency: {frequency} MHz\n")

# Start radio
subprocess.run(['python3', RADIO_SCRIPT, 'on'], 
               stdout=subprocess.DEVNULL, 
               stderr=subprocess.DEVNULL)

last_value = read_gpio()
position = 0
last_position = 0

try:
    while True:
        # Poll continuously instead of waiting for INT
        current = read_gpio()
        
        if current is not None and current != last_value:
            # Filter out noise
            if current == 0xFFFFFFFF or current == 0x00FFFFFF:
                continue
                
            xor = current ^ last_value
            
            # ROTATION DETECTED
            if xor & (1 << 15):
                bit15 = (current >> 15) & 1
                position += 1 if bit15 else -1
                
                if abs(position - last_position) >= 1:
                    delta = position - last_position
                    last_position = position
                    
                    if mode == "VOLUME":
                        volume += delta * volume_step
                        volume = set_volume(volume)
                        print(f"🔊 Volume: {volume}%")
                    elif mode == "TUNING":
                        frequency += delta * freq_step
                        frequency = tune_radio(frequency)
                        print(f"📻 Frequency: {frequency:.1f} MHz")
            
            # BUTTON PRESSED
            if xor & 0x000040FE:
                if current & 0x000040FE:
                    mode = "TUNING" if mode == "VOLUME" else "VOLUME"
                    print(f"\n{'='*60}")
                    print(f"🔄 MODE: {mode}")
                    print(f"{'='*60}")
                    if mode == "VOLUME":
                        print(f"🔊 Volume: {volume}%")
                    else:
                        print(f"📻 Frequency: {frequency:.1f} MHz")
                    print()
            
            last_value = current
        
        time.sleep(0.01)  # Poll every 10ms

except KeyboardInterrupt:
    print("\n\n🛑 Encoder control stopped")

