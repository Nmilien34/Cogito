import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fmRadioService, type FMRadioState, type StationPreset } from "../services/FMRadioService";

export const RadioPlayer = () => {
  const [radioState, setRadioState] = useState<FMRadioState>({
    frequency: 99.1,
    isPlaying: false,
    volume: 50,
  });
  const [presets, setPresets] = useState<StationPreset[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    // Subscribe to radio state updates
    const unsubscribe = fmRadioService.subscribe((state) => {
      setRadioState(state);
    });

    // Load presets
    setPresets(fmRadioService.getPresets());

    // Update time
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const handleTogglePlayback = async () => {
    setIsLoading(true);
    try {
      await fmRadioService.togglePlayback();
    } catch (error) {
      console.error("Failed to toggle playback:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolumeChange = async (value: number) => {
    try {
      await fmRadioService.setVolume(value);
    } catch (error) {
      console.error("Failed to set volume:", error);
    }
  };

  const handleTuneUp = async () => {
    setIsLoading(true);
    try {
      await fmRadioService.tuneUp();
    } catch (error) {
      console.error("Failed to tune up:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTuneDown = async () => {
    setIsLoading(true);
    try {
      await fmRadioService.tuneDown();
    } catch (error) {
      console.error("Failed to tune down:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = async (preset: StationPreset) => {
    setIsLoading(true);
    try {
      await fmRadioService.setFrequency(preset.frequency);
      setShowPresets(false);
    } catch (error) {
      console.error("Failed to set frequency:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualFrequency = async () => {
    const input = prompt("Enter FM frequency (87.5 - 108.0 MHz):", radioState.frequency.toString());
    if (input) {
      const freq = parseFloat(input);
      if (!isNaN(freq) && freq >= 87.5 && freq <= 108.0) {
        setIsLoading(true);
        try {
          await fmRadioService.setFrequency(freq);
        } catch (error) {
          console.error("Failed to set frequency:", error);
          alert("Failed to set frequency. Please try again.");
        } finally {
          setIsLoading(false);
        }
      } else {
        alert("Invalid frequency. Must be between 87.5 and 108.0 MHz");
      }
    }
  };

  const timeString = format(currentTime, "h:mm:ss a");
  const dateString = format(currentTime, "EEEE, MMMM d, yyyy");

  return (
    <section
      className="rounded-3xl bg-slate-900/70 border border-white/10 p-6 flex flex-col gap-6"
      aria-label="FM Radio Controller"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm uppercase text-white/70 tracking-widest">FM Radio</p>
          <h2 className="text-3xl font-extrabold text-white">Ruth's Companion Radio</h2>
          <p className="text-white/70">Physical FM Radio - TEA5767 Chip</p>
        </div>
        <button
          onClick={handleTogglePlayback}
          disabled={isLoading}
          className="bg-accent text-slate-900 text-xl font-semibold px-10 py-4 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/60 disabled:opacity-50"
        >
          {isLoading ? "..." : radioState.isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      {/* Frequency Display */}
      <div className="bg-black/40 rounded-2xl p-6 border border-white/10">
        <div className="text-center">
          <p className="text-sm text-white/70 mb-2">TUNED TO</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleTuneDown}
              disabled={isLoading}
              className="bg-white/10 hover:bg-white/20 text-white text-2xl font-bold px-6 py-3 rounded-full disabled:opacity-50"
              aria-label="Tune down"
            >
              -
            </button>
            <button
              onClick={handleManualFrequency}
              className="bg-gradient-to-r from-accent/20 to-accent/10 px-8 py-4 rounded-2xl"
            >
              <p className="text-6xl font-bold text-accent">{radioState.frequency.toFixed(1)}</p>
              <p className="text-xl text-white/90 mt-1">MHz FM</p>
            </button>
            <button
              onClick={handleTuneUp}
              disabled={isLoading}
              className="bg-white/10 hover:bg-white/20 text-white text-2xl font-bold px-6 py-3 rounded-full disabled:opacity-50"
              aria-label="Tune up"
            >
              +
            </button>
          </div>
          {radioState.signalStrength !== undefined && (
            <div className="mt-4">
              <p className="text-sm text-white/70">Signal: {radioState.signalStrength}/15</p>
              {radioState.isStereo && <p className="text-xs text-green-400 mt-1">STEREO</p>}
            </div>
          )}
        </div>
      </div>

      {/* Station Presets */}
      <div>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="text-lg font-semibold text-white mb-3 hover:text-accent transition-colors"
        >
          Station Presets {showPresets ? "▼" : "▶"}
        </button>
        {showPresets && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                disabled={isLoading}
                className={`p-4 rounded-xl border ${
                  Math.abs(radioState.frequency - preset.frequency) < 0.05
                    ? "border-accent bg-accent/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                } transition-colors disabled:opacity-50`}
              >
                <p className="font-semibold text-white">{preset.name}</p>
                <p className="text-sm text-white/70">{preset.frequency.toFixed(1)} MHz</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Volume Control */}
      <div>
        <label className="text-lg font-semibold text-white flex justify-between mb-3" htmlFor="volume-slider">
          Volume
          <span className="text-accent text-2xl font-bold">{radioState.volume}%</span>
        </label>
        <input
          id="volume-slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={radioState.volume}
          onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
          className="w-full accent-accent h-3"
        />
      </div>

      {/* Time and Date Display */}
      <div className="pt-4 border-t border-white/10">
        <p className="text-3xl font-bold text-accent">{timeString}</p>
        <p className="text-lg text-white/80 mt-1">{dateString}</p>
      </div>
    </section>
  );
};

