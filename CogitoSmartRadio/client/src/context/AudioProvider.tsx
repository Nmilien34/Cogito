import {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";

/**
 * AudioProvider - Simplified for FM Radio
 *
 * This provider is maintained for backwards compatibility with voice AI ducking.
 * The actual FM radio audio comes from the hardware (TEA5767 chip), not the browser.
 *
 * Note: Web audio streaming has been removed as this is now a physical FM radio controller.
 */

interface AudioContextValue {
  // Deprecated: kept for backwards compatibility
  audioEl: null;
  gain: number;
  playing: boolean;
  setVolume: (value: number) => void;
  togglePlayback: () => void;
  duck: () => void;
  restore: () => void;
}

const AudioCtx = createContext<AudioContextValue | undefined>(undefined);

export const AudioProvider = ({ children }: PropsWithChildren) => {
  // Simplified provider - no actual audio processing needed
  // FM radio is controlled via hardware service

  const contextValue: AudioContextValue = {
    audioEl: null,
    gain: 1,
    playing: false,
    setVolume: () => {
      console.warn('AudioProvider.setVolume is deprecated. Use FMRadioService instead.');
    },
    togglePlayback: () => {
      console.warn('AudioProvider.togglePlayback is deprecated. Use FMRadioService instead.');
    },
    duck: () => {
      // Can be used by Vapi integration to signal ducking
      console.log('Audio ducking requested (physical radio should be controlled via hardware service)');
    },
    restore: () => {
      // Can be used by Vapi integration to restore volume
      console.log('Audio restore requested (physical radio should be controlled via hardware service)');
    },
  };

  return (
    <AudioCtx.Provider value={contextValue}>
      {children}
    </AudioCtx.Provider>
  );
};

export const useRadioAudio = () => {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useRadioAudio must be used within AudioProvider");
  return ctx;
};

