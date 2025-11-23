#!/usr/bin/env python3
"""
TEA5767 FM Radio Control Script
Commands: on, off, set, up, down, stop, resume, status
"""

import sys
import smbus2
import os

TEA5767_ADDR = 0x60
I2C_BUS = 1
DEFAULT_FREQ = 99.1
FREQ_MIN = 87.5
FREQ_MAX = 108.0
STEP = 0.1

STATE_FILE = "/tmp/radio_state.txt"

def freq_to_pll(freq_mhz):
    """Convert frequency in MHz to PLL word"""
    return int(4 * (freq_mhz * 1000000 + 225000) / 32768)

def pll_to_freq(pll):
    """Convert PLL word to frequency in MHz"""
    return ((pll * 32768 / 4) - 225000) / 1000000

def save_state(freq_mhz):
    """Save current frequency to state file"""
    try:
        with open(STATE_FILE, 'w') as f:
            f.write(str(freq_mhz))
    except:
        pass

def load_state():
    """Load last frequency from state file"""
    try:
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, 'r') as f:
                return float(f.read().strip())
    except:
        pass
    return DEFAULT_FREQ

def set_frequency(freq_mhz):
    """Set TEA5767 to specific frequency"""
    if freq_mhz < FREQ_MIN or freq_mhz > FREQ_MAX:
        print(f"❌ Frequency {freq_mhz} out of range ({FREQ_MIN}-{FREQ_MAX})")
        return False
    
    pll = freq_to_pll(freq_mhz)
    
    data = [
        (pll >> 8) & 0x3F,
        pll & 0xFF,
        0xB0,
        0x10,
        0x00
    ]
    
    try:
        bus = smbus2.SMBus(I2C_BUS)
        msg = smbus2.i2c_msg.write(TEA5767_ADDR, data)
        bus.i2c_rdwr(msg)
        bus.close()

        save_state(freq_mhz)
        print(f"📻 Tuned to {freq_mhz:.1f} MHz")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def radio_on():
    """Turn radio ON at last/default frequency"""
    freq = load_state()
    print(f"📻 RADIO ON")
    return set_frequency(freq)

def radio_off():
    """Turn radio OFF (mute)"""
    try:
        bus = smbus2.SMBus(I2C_BUS)
        data = [0x80, 0x00, 0xB0, 0x10, 0x00]
        msg = smbus2.i2c_msg.write(TEA5767_ADDR, data)
        bus.i2c_rdwr(msg)
        bus.close()
        
        print("📻 RADIO OFF")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def scan_up():
    """Scan up by one step"""
    current_freq = load_state()
    new_freq = min(current_freq + STEP, FREQ_MAX)
    print(f"📻 Scanning up: {current_freq:.1f} → {new_freq:.1f} MHz")
    return set_frequency(new_freq)

def scan_down():
    """Scan down by one step"""
    current_freq = load_state()
    new_freq = max(current_freq - STEP, FREQ_MIN)
    print(f"📻 Scanning down: {current_freq:.1f} → {new_freq:.1f} MHz")
    return set_frequency(new_freq)

def get_status():
    """Read current radio status"""
    try:
        bus = smbus2.SMBus(I2C_BUS)
        msg = smbus2.i2c_msg.read(TEA5767_ADDR, 5)
        bus.i2c_rdwr(msg)
        status = list(msg)
        bus.close()

        ready = (status[0] & 0x80) >> 7
        band_limit = (status[0] & 0x40) >> 6
        pll = ((status[0] & 0x3F) << 8) | status[1]
        freq = pll_to_freq(pll)
        signal = (status[3] >> 4) & 0x0F
        stereo = (status[2] & 0x80) >> 7

        print("="*40)
        print("📻 TEA5767 Radio Status")
        print("="*40)
        print(f"Frequency:    {freq:.2f} MHz")
        print(f"Signal Level: {signal}/15 {'█' * signal}")
        print(f"Stereo:       {'Yes' if stereo else 'Mono'}")
        print(f"Ready:        {'Yes' if ready else 'No'}")
        print(f"Band Limit:   {'Yes' if band_limit else 'No'}")
        print("="*40)
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def show_usage():
    """Show usage information"""
    print("TEA5767 FM Radio Control")
    print("="*40)
    print("Usage:")
    print("  python3 radio-control.py on            - Turn radio ON")
    print("  python3 radio-control.py off           - Turn radio OFF")
    print("  python3 radio-control.py set <freq>    - Tune to frequency")
    print("  python3 radio-control.py up            - Scan up 0.1 MHz")
    print("  python3 radio-control.py down          - Scan down 0.1 MHz")
    print("  python3 radio-control.py stop          - Mute radio (alias for off)")
    print("  python3 radio-control.py resume        - Resume radio (alias for on)")
    print("  python3 radio-control.py status        - Show radio status")
    print()
    print("Examples:")
    print("  python3 radio-control.py on")
    print("  python3 radio-control.py set 99.1")
    print("  python3 radio-control.py up")
    print("  python3 radio-control.py status")
    print("="*40)

def main():
    if len(sys.argv) < 2:
        show_usage()
        sys.exit(1)
    
    cmd = sys.argv[1].lower()
    
    if cmd == "on":
        radio_on()
    
    elif cmd == "off":
        radio_off()
    
    elif cmd == "set":
        if len(sys.argv) < 3:
            print("❌ Missing frequency!")
            print("Usage: python3 radio-control.py set 99.1")
            sys.exit(1)
        try:
            freq = float(sys.argv[2])
            set_frequency(freq)
        except ValueError:
            print(f"❌ Invalid frequency: {sys.argv[2]}")
            sys.exit(1)
    
    elif cmd == "up":
        scan_up()
    
    elif cmd == "down":
        scan_down()
    
    elif cmd == "stop":
        radio_off()
    
    elif cmd == "resume":
        radio_on()
    
    elif cmd == "status":
        get_status()
    
    else:
        print(f"❌ Unknown command: {cmd}")
        show_usage()
        sys.exit(1)

if __name__ == "__main__":
    main()



