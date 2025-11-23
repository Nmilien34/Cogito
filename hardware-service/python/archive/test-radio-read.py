#!/usr/bin/env python3
from smbus2 import SMBus, i2c_msg

TEA5767_ADDRESS = 0x60

print("Attempting to read from TEA5767...")

try:
    with SMBus(1) as bus:
        # Try reading 5 bytes
        msg = i2c_msg.read(TEA5767_ADDRESS, 5)
        bus.i2c_rdwr(msg)
        data = list(msg)
        print(f"✅ Success! Read data: {[hex(b) for b in data]}")
        
except OSError as e:
    print(f"❌ Error: {e}")
    print("\nTroubleshooting:")
    print("1. Check if TEA5767 has power (VCC connected)")
    print("2. Check if GND is connected")
    print("3. Module might be faulty")
