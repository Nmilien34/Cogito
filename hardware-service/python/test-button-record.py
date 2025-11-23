#!/usr/bin/env python3
"""
Button recording test with volume boost
"""

import RPi.GPIO as GPIO
import subprocess
import time
import signal
import sys
import os
from datetime import datetime

# Config
BUTTON_PIN = 17
AUDIO_DEVICE = "plughw:1,0"  # Changed from 3,0 to 1,0

# Globals
recording_process = None
current_file = None

# Setup
GPIO.setmode(GPIO.BCM)
GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

def radio_on():
    subprocess.run([
        "python3",
        "/home/radioassistant/Desktop/Cogito/hardware-service/python/radio-control.py",
        "on"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def radio_off():
    subprocess.run([
        "python3",
        "/home/radioassistant/Desktop/Cogito/hardware-service/python/radio-control.py",
        "off"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def start_recording():
    global recording_process, current_file
    if recording_process:
        return
    
    current_file = f"/tmp/rec_{datetime.now().strftime('%H%M%S')}.wav"
    print(f"\n🎤 RECORDING...")
    
    # Use 16-bit format with card 1
    recording_process = subprocess.Popen([
        "arecord", "-D", AUDIO_DEVICE,
        "-f", "S16_LE", "-r", "48000", "-c", "1",
        current_file
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def stop_recording():
    global recording_process, current_file
    if not recording_process:
        return None
    
    print("🛑 STOPPED")
    recording_process.send_signal(signal.SIGINT)
    recording_process.wait(timeout=2)
    
    saved = current_file
    recording_process = None
    current_file = None
    return saved

def playback(filename):
    if not filename or not os.path.exists(filename):
        return
    
    print(f"🔊 Playing back (boosted)...")
    
    # Mute radio
    radio_off()
    time.sleep(0.3)
    
    # Amplify and play (boost by 20dB)
    boosted_file = f"/tmp/boosted_{datetime.now().strftime('%H%M%S')}.wav"
    subprocess.run([
        "sox", filename, boosted_file, "gain", "20"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    subprocess.run([
        "aplay", boosted_file
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    print("✓ Playback complete")
    
    # Resume radio
    time.sleep(0.3)
    radio_on()

def cleanup(sig=None, frame=None):
    if recording_process:
        stop_recording()
    GPIO.cleanup()
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

print("="*50)
print("Button Recording Test (with volume boost)")
print("="*50)
print("HOLD button → Record")
print("RELEASE → Mute radio → Play boosted audio → Resume radio")
print("="*50)

radio_on()
print("\n📻 Radio playing...")
print("Press button to test\n")

last_state = GPIO.HIGH

try:
    while True:
        state = GPIO.input(BUTTON_PIN)
        
        if state == GPIO.LOW and last_state == GPIO.HIGH:
            start_recording()
        
        elif state == GPIO.HIGH and last_state == GPIO.LOW:
            saved = stop_recording()
            time.sleep(0.5)
            playback(saved)
        
        last_state = state
        time.sleep(0.02)
        
except KeyboardInterrupt:
    cleanup()
