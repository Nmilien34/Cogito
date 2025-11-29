#!/usr/bin/env python3
"""
Adafruit ANO Rotary Encoder Module with Custom Seesaw Implementation

This module provides a RelaxedSeesaw class that works around the Raspberry Pi
clock-stretching bug by bypassing the hardware ID check. It also includes
noise filtering and button mapping for radio/volume control.

Hardware:
- Adafruit ANO Rotary Encoder (I2C address 0x49)
- Connected to Raspberry Pi I2C bus

Button Mapping:
- Pin 1: Up (scan radio up)
- Pin 2: Down (scan radio down)
- Pin 3: Left (scan radio down - same as down)
- Pin 4: Right (scan radio up - same as up)

Rotary Encoder:
- Clockwise: Volume up
- Counter-clockwise: Volume down
"""

import time
import board
import busio
from digitalio import Direction, Pull
from adafruit_seesaw import seesaw, rotaryio, digitalio
import subprocess


class RelaxedSeesaw(seesaw.Seesaw):
    """
    Custom Seesaw class that bypasses hardware ID check.

    The Raspberry Pi has a clock-stretching bug that causes the hardware ID
    to be read incorrectly (0x07 instead of 0x87). This class manually sets
    the correct hardware ID to prevent initialization errors.
    """

    def __init__(self, i2c_bus, addr=0x49):
        """
        Initialize the RelaxedSeesaw device.

        Args:
            i2c_bus: The I2C bus instance
            addr: I2C address of the device (default 0x49 for ANO)
        """
        # Call parent constructor but catch the hardware ID error
        try:
            super().__init__(i2c_bus, addr)
        except RuntimeError as e:
            # If hardware ID check fails, we'll manually override it
            pass

        # Manually set the correct hardware ID and disable DRDY
        # This bypasses the clock-stretching bug on Raspberry Pi
        self._hardware_id = 0x87
        self._drdy = None

        # Re-initialize the I2C device with the correct address
        from adafruit_bus_device.i2c_device import I2CDevice
        self._i2c_device = I2CDevice(i2c_bus, addr)
        self._addr = addr


class ANOEncoder:
    """
    High-level interface for the Adafruit ANO Rotary Encoder.

    Features:
    - Noise filtering for rotary encoder (ignores jumps > +/- 10 steps)
    - Button debouncing
    - Volume control via rotation
    - Radio tuning via buttons
    """

    # Button pin mapping
    BUTTON_UP = 1      # Scan radio up
    BUTTON_DOWN = 2    # Scan radio down
    BUTTON_LEFT = 3    # Scan radio down (same as down)
    BUTTON_RIGHT = 4   # Scan radio up (same as up)

    # Noise filtering threshold
    MAX_ROTATION_DELTA = 10

    def __init__(self, i2c_address=0x49, volume_step=5):
        """
        Initialize the ANO Encoder.

        Args:
            i2c_address: I2C address of the encoder (default 0x49)
            volume_step: Volume change per rotation step (default 5%)
        """
        # Create I2C bus
        self.i2c = busio.I2C(board.SCL, board.SDA)

        # Initialize RelaxedSeesaw
        print("Initializing ANO Encoder with RelaxedSeesaw...")
        self.seesaw = RelaxedSeesaw(self.i2c, addr=i2c_address)

        # Initialize rotary encoder
        self.encoder = rotaryio.IncrementalEncoder(self.seesaw)
        self.last_position = 0

        # Initialize buttons with pull-up resistors
        self.buttons = {}
        for pin in [self.BUTTON_UP, self.BUTTON_DOWN, self.BUTTON_LEFT, self.BUTTON_RIGHT]:
            button = digitalio.DigitalIO(self.seesaw, pin)
            button.direction = Direction.INPUT
            button.pull = Pull.UP
            self.buttons[pin] = button

        # Button state tracking for debouncing
        self.button_states = {pin: True for pin in self.buttons.keys()}  # True = not pressed (pull-up)
        self.last_button_time = {pin: 0 for pin in self.buttons.keys()}
        self.debounce_time = 0.2  # 200ms debounce

        # Volume settings
        self.volume_step = volume_step
        self.current_volume = self._get_system_volume()

        # Radio script path
        self.radio_script = "/home/radioassistant/Desktop/Cogito/hardware-service/python/radio-control.py"

        print(f"✓ ANO Encoder initialized at 0x{i2c_address:02X}")
        print(f"✓ Current volume: {self.current_volume}%")

    def _get_system_volume(self):
        """Get current system volume using amixer."""
        try:
            result = subprocess.run(
                ['amixer', 'get', 'Master'],
                capture_output=True,
                text=True,
                timeout=1
            )
            # Parse output to get volume percentage
            for line in result.stdout.split('\n'):
                if 'Front Left:' in line or 'Mono:' in line:
                    # Extract percentage from [XX%]
                    import re
                    match = re.search(r'\[(\d+)%\]', line)
                    if match:
                        return int(match.group(1))
        except Exception as e:
            print(f"Warning: Could not read system volume: {e}")
        return 50  # Default

    def set_volume(self, volume):
        """
        Set system volume.

        Args:
            volume: Volume level (0-100)

        Returns:
            Actual volume set (clamped to valid range)
        """
        volume = max(0, min(100, volume))
        try:
            subprocess.run(
                ['amixer', 'set', 'Master', f'{volume}%'],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=1
            )
            self.current_volume = volume
        except Exception as e:
            print(f"Error setting volume: {e}")
        return self.current_volume

    def scan_radio_up(self):
        """Scan radio up by 0.1 MHz."""
        try:
            subprocess.run(
                ['python3', self.radio_script, 'up'],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=1
            )
            return True
        except Exception as e:
            print(f"Error scanning radio up: {e}")
            return False

    def scan_radio_down(self):
        """Scan radio down by 0.1 MHz."""
        try:
            subprocess.run(
                ['python3', self.radio_script, 'down'],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=1
            )
            return True
        except Exception as e:
            print(f"Error scanning radio down: {e}")
            return False

    def read_rotation(self):
        """
        Read rotary encoder position with noise filtering.

        Returns:
            Delta (change in position) or 0 if no change/noise detected
        """
        current_position = self.encoder.position

        # Check for garbage values (common I2C noise patterns)
        if current_position in [16777215, 65535, -1, 0xFFFFFF, 0xFFFF]:
            return 0

        delta = current_position - self.last_position

        # Filter out huge jumps (I2C noise)
        if abs(delta) > self.MAX_ROTATION_DELTA:
            print(f"⚠️  Noise filtered: delta={delta} (ignoring)")
            # Reset to current position to avoid accumulation
            self.last_position = current_position
            return 0

        # Valid rotation detected
        if delta != 0:
            self.last_position = current_position

        return delta

    def read_buttons(self):
        """
        Read all button states with debouncing.

        Returns:
            Dict of {pin: pressed} where pressed is True if button was just pressed
        """
        pressed = {}
        current_time = time.monotonic()

        for pin, button in self.buttons.items():
            current_state = button.value  # False = pressed (pull-up)
            last_state = self.button_states[pin]

            # Button press detected (transition from True to False)
            if last_state and not current_state:
                # Check debounce
                if current_time - self.last_button_time[pin] > self.debounce_time:
                    pressed[pin] = True
                    self.last_button_time[pin] = current_time
                else:
                    pressed[pin] = False
            else:
                pressed[pin] = False

            # Update state
            self.button_states[pin] = current_state

        return pressed

    def handle_rotation(self, delta):
        """
        Handle rotation event (adjust volume).

        Args:
            delta: Change in encoder position (positive = clockwise)

        Returns:
            New volume level
        """
        if delta == 0:
            return self.current_volume

        # Clockwise = volume up, Counter-clockwise = volume down
        volume_change = delta * self.volume_step
        new_volume = self.current_volume + volume_change

        return self.set_volume(new_volume)

    def handle_buttons(self, button_events):
        """
        Handle button press events (scan radio stations).

        Args:
            button_events: Dict of {pin: pressed} from read_buttons()

        Returns:
            Action taken as string, or None
        """
        # Up or Right button = scan up
        if button_events.get(self.BUTTON_UP) or button_events.get(self.BUTTON_RIGHT):
            self.scan_radio_up()
            return "scan_up"

        # Down or Left button = scan down
        if button_events.get(self.BUTTON_DOWN) or button_events.get(self.BUTTON_LEFT):
            self.scan_radio_down()
            return "scan_down"

        return None


def main():
    """
    Example usage / test program.
    """
    print("="*60)
    print("🎛️  ANO Encoder - Volume & Radio Control")
    print("="*60)
    print("ROTATE:  Adjust volume (clockwise = up, counter-clockwise = down)")
    print("BUTTONS: Up/Right = scan up, Down/Left = scan down")
    print("="*60)
    print()

    # Initialize encoder
    try:
        encoder = ANOEncoder()
    except Exception as e:
        print(f"❌ Failed to initialize encoder: {e}")
        print("\nTroubleshooting:")
        print("1. Check I2C connection: sudo i2cdetect -y 1")
        print("2. Verify address 0x49 is present")
        print("3. Check permissions: sudo usermod -aG i2c $USER")
        return

    print(f"Initial Volume: {encoder.current_volume}%\n")

    try:
        while True:
            # Check rotation
            delta = encoder.read_rotation()
            if delta != 0:
                new_volume = encoder.handle_rotation(delta)
                direction = "UP" if delta > 0 else "DOWN"
                print(f"🔊 Volume {direction}: {new_volume}%")

            # Check buttons
            button_events = encoder.read_buttons()
            action = encoder.handle_buttons(button_events)
            if action == "scan_up":
                print("📻 Scanning UP ▲")
            elif action == "scan_down":
                print("📻 Scanning DOWN ▼")

            # Small delay to avoid CPU spinning
            time.sleep(0.01)

    except KeyboardInterrupt:
        print("\n\n🛑 Encoder control stopped")
        print(f"Final Volume: {encoder.current_volume}%")


if __name__ == "__main__":
    main()
