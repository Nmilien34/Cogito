import sounddevice as sd
import soundfile as sf

SAMPLE_RATE = 16000   # 16 kHz
DURATION = 5          # seconds
CHANNELS = 1          # mono

print("Recording 5 seconds from default input...")
audio = sd.rec(int(DURATION * SAMPLE_RATE),
               samplerate=SAMPLE_RATE,
               channels=CHANNELS,
               dtype='int16')
sd.wait()
sf.write("mic_test.wav", audio, SAMPLE_RATE)
print("Saved recording as mic_test.wav")

