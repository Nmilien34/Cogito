#!/usr/bin/env python3
"""
ANO Encoder Service - Hardware Integration with Backend API

This service runs continuously in the background, monitoring the ANO rotary
encoder and buttons. When events occur (rotation or button presses), it
communicates with the Node.js backend API to control volume and radio.

Features:
- Rotary encoder: Volume control (clockwise = up, counter-clockwise = down)
- Buttons: Radio station scanning (Up/Right = scan up, Down/Left = scan down)
- HTTP API integration with backend
- Noise filtering and debouncing
- Auto-recovery from I2C errors

Run as a service:
    sudo systemctl start cogito-encoder
    sudo systemctl enable cogito-encoder  # Start on boot
"""

import time
import requests
import logging
from ano_encoder import ANOEncoder


# Configuration
BACKEND_URL = "http://localhost:4000/api"
POLL_INTERVAL = 0.01  # 10ms polling interval
RETRY_DELAY = 5  # Seconds to wait before retrying on error

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/tmp/encoder-service.log')
    ]
)
logger = logging.getLogger('encoder-service')


class EncoderService:
    """
    Main service class that bridges hardware encoder with backend API.
    """

    def __init__(self, backend_url=BACKEND_URL):
        """
        Initialize the encoder service.

        Args:
            backend_url: Base URL for backend API
        """
        self.backend_url = backend_url
        self.encoder = None
        self.running = False

        # API timeout (seconds)
        self.api_timeout = 1.0

        logger.info("="*60)
        logger.info("🎛️  Cogito Encoder Service")
        logger.info("="*60)

    def initialize_encoder(self):
        """
        Initialize the ANO encoder hardware.

        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info("Initializing ANO Encoder...")
            self.encoder = ANOEncoder(volume_step=5)
            logger.info("✓ Encoder initialized successfully")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to initialize encoder: {e}")
            logger.error("Troubleshooting:")
            logger.error("  1. Check I2C connection: sudo i2cdetect -y 1")
            logger.error("  2. Verify encoder at address 0x49")
            logger.error("  3. Check permissions: sudo usermod -aG i2c $USER")
            return False

    def call_api(self, endpoint, method='POST', data=None):
        """
        Call backend API endpoint.

        Args:
            endpoint: API endpoint path (e.g., '/radio/scan-up')
            method: HTTP method (default 'POST')
            data: Optional request body data

        Returns:
            Response data or None on error
        """
        url = f"{self.backend_url}{endpoint}"

        try:
            if method == 'POST':
                response = requests.post(url, json=data, timeout=self.api_timeout)
            else:
                response = requests.get(url, timeout=self.api_timeout)

            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"API call failed: {response.status_code} - {response.text}")
                return None

        except requests.exceptions.Timeout:
            logger.warning(f"API timeout: {endpoint}")
            return None
        except requests.exceptions.ConnectionError:
            logger.warning(f"Backend not reachable: {endpoint}")
            return None
        except Exception as e:
            logger.error(f"API call error: {e}")
            return None

    def handle_volume_change(self, delta):
        """
        Handle volume change from rotation.

        Args:
            delta: Change in encoder position (positive = clockwise)
        """
        # Update local volume (encoder handles amixer internally)
        new_volume = self.encoder.handle_rotation(delta)

        direction = "UP ⬆" if delta > 0 else "DOWN ⬇"
        logger.info(f"🔊 Volume {direction}: {new_volume}%")

    def handle_scan_up(self):
        """Handle radio scan up button press."""
        logger.info("📻 Scanning UP ▲")

        # Call backend API
        result = self.call_api('/radio/scan-up')

        if result:
            logger.info(f"✓ {result.get('message', 'Scan up successful')}")
        else:
            logger.warning("⚠️  Backend API call failed, using local fallback")
            # Fallback to direct radio control
            self.encoder.scan_radio_up()

    def handle_scan_down(self):
        """Handle radio scan down button press."""
        logger.info("📻 Scanning DOWN ▼")

        # Call backend API
        result = self.call_api('/radio/scan-down')

        if result:
            logger.info(f"✓ {result.get('message', 'Scan down successful')}")
        else:
            logger.warning("⚠️  Backend API call failed, using local fallback")
            # Fallback to direct radio control
            self.encoder.scan_radio_down()

    def run(self):
        """
        Main service loop.

        Continuously polls encoder for events and handles them.
        """
        # Initialize encoder
        if not self.initialize_encoder():
            logger.error("Failed to initialize encoder. Exiting.")
            return

        self.running = True
        logger.info("🚀 Service started - monitoring encoder events...")
        logger.info(f"   Polling interval: {POLL_INTERVAL*1000:.1f}ms")
        logger.info(f"   Backend: {self.backend_url}")
        logger.info("")

        error_count = 0
        last_error_time = 0

        try:
            while self.running:
                try:
                    # Check rotation
                    delta = self.encoder.read_rotation()
                    if delta != 0:
                        self.handle_volume_change(delta)
                        error_count = 0  # Reset error counter on successful read

                    # Check buttons
                    button_events = self.encoder.read_buttons()

                    # Handle scan up (Up or Right button)
                    if button_events.get(ANOEncoder.BUTTON_UP) or \
                       button_events.get(ANOEncoder.BUTTON_RIGHT):
                        self.handle_scan_up()
                        error_count = 0

                    # Handle scan down (Down or Left button)
                    if button_events.get(ANOEncoder.BUTTON_DOWN) or \
                       button_events.get(ANOEncoder.BUTTON_LEFT):
                        self.handle_scan_down()
                        error_count = 0

                    # Small delay
                    time.sleep(POLL_INTERVAL)

                except Exception as e:
                    error_count += 1
                    current_time = time.time()

                    # Log error only if it's a new error or been a while
                    if current_time - last_error_time > 10:
                        logger.error(f"❌ Encoder read error: {e}")
                        last_error_time = current_time

                    # If too many consecutive errors, try to reinitialize
                    if error_count > 100:
                        logger.warning("Too many errors, reinitializing encoder...")
                        time.sleep(RETRY_DELAY)

                        if not self.initialize_encoder():
                            logger.error("Reinitialization failed, retrying in 30s...")
                            time.sleep(30)
                        else:
                            error_count = 0

                    time.sleep(0.1)  # Slow down on errors

        except KeyboardInterrupt:
            logger.info("\n🛑 Service stopped by user")
        except Exception as e:
            logger.error(f"❌ Unexpected error: {e}")
            raise
        finally:
            self.running = False
            logger.info("Service shutdown complete")

    def stop(self):
        """Stop the service gracefully."""
        logger.info("Stopping service...")
        self.running = False


def main():
    """
    Main entry point.
    """
    # Check if backend is reachable
    try:
        response = requests.get(f"{BACKEND_URL.replace('/api', '')}/health", timeout=2)
        if response.status_code == 200:
            logger.info("✓ Backend is reachable")
        else:
            logger.warning(f"⚠️  Backend returned status {response.status_code}")
    except Exception as e:
        logger.warning(f"⚠️  Backend not reachable: {e}")
        logger.warning("Service will use local fallback for radio control")

    # Start service
    service = EncoderService()

    try:
        service.run()
    except Exception as e:
        logger.error(f"Service crashed: {e}")
        raise


if __name__ == "__main__":
    main()
