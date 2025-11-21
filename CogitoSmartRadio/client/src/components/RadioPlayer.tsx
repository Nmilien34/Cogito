import { useMemo, useState, useEffect } from "react";
import { useRadioAudio } from "../context/AudioProvider";
import { format } from "date-fns";

export const RadioPlayer = () => {
  const { playing, togglePlayback, gain, setVolume } = useRadioAudio();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const volumePercent = useMemo(() => Math.round(gain * 100), [gain]);
  const timeString = format(currentTime, "h:mm:ss a");
  const dateString = format(currentTime, "EEEE, MMMM d, yyyy");

  return (
    <section
      className="rounded-3xl bg-slate-900/70 border border-white/10 p-6 flex flex-col gap-4"
      aria-label="Smart Radio"
    >
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <p className="text-sm uppercase text-white/70 tracking-widest">Now Playing</p>
          <h2 className="text-3xl font-extrabold text-white">Cogito Smart Radio</h2>
          <p className="text-white/70">Stream curated for Ruth</p>
          
          {/* Time and Date Display */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-3xl font-bold text-accent">{timeString}</p>
            <p className="text-lg text-white/80 mt-1">{dateString}</p>
          </div>
        </div>
        <button
          onClick={togglePlayback}
          className="bg-accent text-slate-900 text-xl font-semibold px-10 py-4 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/60"
        >
          {playing ? "Pause" : "Play"}
        </button>
      </div>

      <div className="mt-6">
        <label className="text-lg font-semibold text-white flex justify-between" htmlFor="volume-slider">
          Volume
          <span className="text-accent text-2xl font-bold">{volumePercent}%</span>
        </label>
        <input
          id="volume-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={gain}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full accent-accent mt-3 h-3"
        />
      </div>
    </section>
  );
};

