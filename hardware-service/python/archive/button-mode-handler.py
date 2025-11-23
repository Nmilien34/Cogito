#!/usr/bin/env python3
"""
Cogito Button Mode Handler with Recording
- Press button: Toggle Radio <-> AI Mode
- AI Mode: Automatically records while button held (or continuously)
- Auto-return to radio after 10s of silence
"""

import RPi.GPIO as GPIO
import requests
import time
import threading
import sys
import subprocess
import signal
from datetime import datetime

# Configuration
BUTTON_PIN = 17
BACKEND_URL = "http://localhost:3001"
DEBOUNCE_TIME = 0.3
AI_TIMEOUT = 10
ACTIVITY_CHECK_INTERVAL = 1.0

# Audio Configuration
AUDIO_DEVICE = "plughw:1,0"  # SPH0645 microphone
AUDIO_FORMAT = "S32_LE"
SAMPLE_RATE = 48000
CHANNELS = 1

# State
current_mode = 'radio'
stop_activity_check = threading.Event()
recording_process = None
current_recording_file = None

# Setup GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

def generate_filename():
    """Generate unique filename with timestamp"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"/tmp/recording_{timestamp}.wav"

def start_recording():
    """Start recording audio"""
    global recording_process, current_recording_file
    
    if recording_process is not None:
        print("Already recording!")
        return
    
    current_recording_file = generate_filename()
    
    cmd = [
        "arecord",
        "-D", AUDIO_DEVICE,
        "-f", AUDIO_FORMAT,
        "-r", str(SAMPLE_RATE),
        "-c", str(CHANNELS),
        current_recording_file
    ]
    
    print("Recording started...")
    
    try:
        recording_process = subprocess.Popen(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except Exception as e:
        print(f"Recording error: {e}")
        recording_process = None
        current_recording_file = None

def stop_recording():
    """Stop recording audio and return filename"""
    global recording_process, current_recording_file
    
    if recording_process is None:
        return None
    
    print("Recording stopped")
    
    try:
        recording_process.send_signal(signal.SIGINT)
        recording_process.wait(timeout=2)
    except:
        recording_process.kill()
    
    saved_file = current_recording_file
    recording_process = None
    current_recording_file = None
    
    return saved_file

def send_audio_to_vapi(audio_file):
    """
    Send recorded audio to Vapi for processing
    TODO: Implement actual Vapi integration
    For now, just plays back for testing
    """
    if audio_file is None:
        return
    
    print(f"Sending to Vapi: {audio_file}")
    
    # TODO: Replace with actual Vapi API call
    # For now, just play it back for testing
    try:
        subprocess.run(
            ["aplay", "-D", "plughw:0,0", audio_file],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        print(" Playback complete (Vapi placeholder)")
    except Exception as e:
        print(f"Playback error: {e}")

def check_speech_activity():
    """Background thread to check for speech activity and auto-timeout"""
    global current_mode
    
    while not stop_activity_check.is_set():
        if current_mode == 'ai':
            try:
                resp = requests.get(f"{BACKEND_URL}/api/ai/activity", timeout=1.5)
                data = resp.json()
                seconds_since = data.get('seconds_since_speech', AI_TIMEOUT + 1)
                
                if seconds_since >= AI_TIMEOUT:
                    print("\n Timeout reached, returning to RADIO mode")
                    set_mode('radio')
                    
            except requests.exceptions.RequestException:
                pass  # Silently ignore connection errors
        
        time.sleep(ACTIVITY_CHECK_INTERVAL)

def set_mode(mode):
    """Set the current mode (radio or ai)"""
    global current_mode
    
    if mode == current_mode:
        return
    
    # Stop any ongoing recording when leaving AI mode
    if current_mode == 'ai' and recording_process is not None:
        audio_file = stop_recording()
        if audio_file:
            # Send to Vapi (or playback for testing)
            send_audio_to_vapi(audio_file)
    
    try:
        resp = requests.post(
            f"{BACKEND_URL}/api/mode/set",
            json={'mode': mode},
            timeout=2
        )
        
        if resp.ok:
            current_mode = mode
            
            if mode == 'ai':
                print("\n" + "="*50)
                print("AI MODE")
                print("="*50)
                print("  Speak your question...")
                print(f"  (Auto-return after {AI_TIMEOUT}s of silence)")
                
                # Start recording when entering AI mode
                start_recording()
                
            else:
                print("\n" + "="*50)
                print("RADIO MODE")
                print("="*50)
                print("  Press button to talk to AI")
        else:
            print(f"\n Mode change failed: {resp.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"\n Error connecting to backend: {e}")
        print("  Is hardware-service running?")

def toggle_mode():
    """Toggle between radio and AI mode"""
    new_mode = 'ai' if current_mode == 'radio' else 'radio'
    set_mode(new_mode)

def cleanup(signum=None, frame=None):
    """Cleanup on exit"""
    print("\n Cleaning up...")
    
    global recording_process
    if recording_process is not None:
        stop_recording()
    
    stop_activity_check.set()
    GPIO.cleanup()
    print(" Cleanup complete")
    sys.exit(0)

def main():
    print("=" * 50)
    print("COGITO MODE BUTTON HANDLER (with Recording)")
    print("=" * 50)
    print("PRESS BUTTON: Toggle Radio <-> AI Mode")
    print(f"AUTO-RETURN: After {AI_TIMEOUT}s of no speech in AI mode")
    print("AI MODE: Auto-records and sends to Vapi")
    print("=" * 50)
    print("\nStarting in RADIO MODE\n")
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    
    # Start activity monitoring thread
    activity_thread = threading.Thread(target=check_speech_activity, daemon=True)
    activity_thread.start()
    
    last_state = GPIO.HIGH
    last_press_time = 0.0
    
    try:
        while True:
            state = GPIO.input(BUTTON_PIN)
            now = time.time()
            
            # Detect button press (HIGH -> LOW)
            if state == GPIO.LOW and last_state == GPIO.HIGH:
                if now - last_press_time > DEBOUNCE_TIME:
                    print("\n Button pressed!")
                    toggle_mode()
                    last_press_time = now
            
            last_state = state
            time.sleep(0.01)
            
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
