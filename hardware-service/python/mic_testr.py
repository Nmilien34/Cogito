import sounddevice as sd
import soundfile as sf

# Recording settings
SAMPLE_RATE = 16000   # I2S mic supports 16 kHz+ fine
DURATION = 5          # seconds
CHANNELS = 1          # SPH0645 uses 1 channel (mono)

print("🎙️ Recording 5 seconds from I2S microphone...")
audio = sd.rec(int(DURATION * SAMPLE_RATE),
               samplerate=SAMPLE_RATE,
               channels=CHANNELS,
               dtype='int16')

sd.wait()   # Wait for recording to finish
sf.write("mic_test.wav", audio, SAMPLE_RATE)

print("✅ Saved recording as mic_test.wav")

