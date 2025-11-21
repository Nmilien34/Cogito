import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface Recognition extends EventTarget {
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  interimResults: boolean;
  continuous: boolean;
  lang: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: { new (): Recognition };
    SpeechRecognition?: { new (): Recognition };
  }
}

export const useSpeechRecognition = () => {
  const recognitionRef = useRef<Recognition | null>(null);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const instance = new SpeechRecognition();
      instance.lang = "en-US";
      instance.interimResults = true;
      instance.continuous = false;
      recognitionRef.current = instance;
      setSupported(true);
    }
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    setListening(true);
    recognitionRef.current.start();

    recognitionRef.current.onresult = (event) => {
      const result = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      setTranscript(result);
    };

    recognitionRef.current.onerror = () => {
      setListening(false);
    };
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { transcript, listening, supported, start, stop };
};

