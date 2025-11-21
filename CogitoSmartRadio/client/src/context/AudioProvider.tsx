import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type PropsWithChildren,
} from "react";
import { RADIO_STREAM_URL } from "../config";

interface AudioContextValue {
  audioEl: HTMLAudioElement | null;
  gain: number;
  playing: boolean;
  setVolume: (value: number) => void;
  togglePlayback: () => void;
  duck: () => void;
  restore: () => void;
}

const AudioCtx = createContext<AudioContextValue | undefined>(undefined);

export const AudioProvider = ({ children }: PropsWithChildren) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const previousGain = useRef(1);
  const [playing, setPlaying] = useState(false);
  const [gain, setGain] = useState(1);

  useEffect(() => {
    const audio = new Audio(RADIO_STREAM_URL);
    audio.crossOrigin = "anonymous";
    audio.loop = true;
    audioRef.current = audio;

    const context = new window.AudioContext();
    audioContextRef.current = context;
    const source = context.createMediaElementSource(audio);
    const gainNode = context.createGain();
    gainNode.gain.value = gain;
    gainNodeRef.current = gainNode;
    source.connect(gainNode).connect(context.destination);

    return () => {
      audio.pause();
      audioRef.current = null;
      gainNode.disconnect();
      context.close();
    };
  }, []);

  const setVolume = useCallback((value: number) => {
    setGain(value);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(value, audioContextRef.current!.currentTime + 0.2);
    }
  }, []);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }, [playing]);

  const duck = useCallback(() => {
    if (!gainNodeRef.current || !audioContextRef.current) return;
    previousGain.current = gainNodeRef.current.gain.value;
    gainNodeRef.current.gain.linearRampToValueAtTime(0.2, audioContextRef.current.currentTime + 0.2);
  }, []);

  const restore = useCallback(() => {
    if (!gainNodeRef.current || !audioContextRef.current) return;
    gainNodeRef.current.gain.linearRampToValueAtTime(previousGain.current, audioContextRef.current.currentTime + 0.2);
  }, []);

  return (
    <AudioCtx.Provider
      value={{
        audioEl: audioRef.current,
        gain,
        playing,
        setVolume,
        togglePlayback,
        duck,
        restore,
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
};

export const useRadioAudio = () => {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useRadioAudio must be used within AudioProvider");
  return ctx;
};

