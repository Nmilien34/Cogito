#!/usr/bin/env python3
import sys, json, os
from smbus2 import SMBus, i2c_msg

TEA5767_ADDRESS = 0x60
STATE_FILE = os.path.join(os.path.dirname(__file__), "state.json")
BAND_MIN = 87.5
BAND_MAX = 108.0
STEP = 0.2  # MHz (use 0.1 if you prefer)

def load_freq(default=97.1):
    try:
        with open(STATE_FILE, "r") as f:
            return float(json.load(f).get("freq", default))
    except Exception:
        return default

def save_freq(freq):
    try:
        with open(STATE_FILE, "w") as f:
            json.dump({"freq": round(freq, 1)}, f)
    except Exception:
        pass

def pll_from_freq(freq_mhz: float) -> int:
    # PLL = 4 * (freq + 225 kHz IF) / 32.768 kHz
    return int(4 * (freq_mhz * 1_000_000 + 225_000) / 32_768)

def write_tea5767(bytes5):
    with SMBus(1) as bus:
        msg = i2c_msg.write(TEA5767_ADDRESS, bytes(bytes5))
        bus.i2c_rdwr(msg)

def set_frequency(freq_mhz: float, use_low_side=False):
    freq_mhz = max(BAND_MIN, min(BAND_MAX, freq_mhz))
    pll = pll_from_freq(freq_mhz)
    # Try low-side (0x50) by default if your module preferred it; flip to 0xB0 if needed
    byte3 = 0x50 if use_low_side else 0xB0
    data = [
        (pll >> 8) & 0x3F,
        pll & 0xFF,
        byte3,
        0x10,  # mono, mute off
        0x00
    ]
    write_tea5767(data)
    save_freq(freq_mhz)
    print(f"Radio tuned to {freq_mhz:.1f} MHz")

def stop_radio():
    data = [0x00, 0x00, 0x00, 0x90, 0x00]  # mute/standby
    write_tea5767(data)
    print("Radio muted")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 radio-control.py set <freq_mhz>")
        print("  python3 radio-control.py up")
        print("  python3 radio-control.py down")
        print("  python3 radio-control.py stop")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    current = load_freq()

    # Change this to True if your board needed 0x50; otherwise leave False for 0xB0
    LOW_SIDE = False  # set True if 0x50 worked for you

    if cmd == "set":
        if len(sys.argv) < 3:
            print("Missing frequency. Example: python3 radio-control.py set 99.5")
            sys.exit(1)
        set_frequency(float(sys.argv[2]), use_low_side=LOW_SIDE)

    elif cmd == "up":
        newf = current + STEP
        if newf > BAND_MAX: newf = BAND_MIN
        set_frequency(newf, use_low_side=LOW_SIDE)

    elif cmd == "down":
        newf = current - STEP
        if newf < BAND_MIN: newf = BAND_MAX
        set_frequency(newf, use_low_side=LOW_SIDE)

    elif cmd == "stop":
        stop_radio()

    else:
        # Backward-compat: allow "97.1" directly
        try:
            set_frequency(float(cmd), use_low_side=LOW_SIDE)
        except ValueError:
            print("Unknown command.")
            sys.exit(1)


