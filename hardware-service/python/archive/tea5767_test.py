import smbus2
import time
import sys

ADDR = 0x60

bus = smbus2.SMBus(1)

def set_frequency(freq):
	data = [0, 0, 0, 0, 0]
	freq = int((4*(freq * 1000000 + 225000)) / 32768)
	data[0] = (freq >> 8) & 0x3F
	data[1] = freq & 0xFF
	data[2] = 0xB0
	data[3] = 0x10
	data[4] = 0x00
	bus.write_i2c_block_data(ADDR, data[0], data[1:])

set_frequency(97.1)
print('Tuned to 97.1 MHz')

time.sleep(10)

stop_data = [0x00, 0x00, 0x00, 0x00, 0x00]
bus.write_i2c_block_data(ADDR, stop_data[0], stop_data[1:])

bus.close()
sys.exit()

