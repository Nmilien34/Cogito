import { useEffect, useState } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { parseVoiceCommand } from "../utils/voiceParser";
import { createReminder } from "../api/reminders";
import { DEFAULT_PROFILE_ID } from "../config";
import { useRemindersContext } from "../context/ReminderProvider";

export const VoiceCommander = () => {
  const { transcript, listening, supported, start, stop } = useSpeechRecognition();
  const [feedback, setFeedback] = useState("");
  const { refresh } = useRemindersContext();

  useEffect(() => {
    if (!transcript || !listening) return;
    const parsed = parseVoiceCommand(transcript);
    if (!parsed) {
      setFeedback("Still listening...");
      return;
    }
    setFeedback(`Parsed: ${parsed.label} at ${new Date(parsed.scheduledAt).toLocaleTimeString()}`);
  }, [transcript, listening]);

  const createFromVoice = async () => {
    const parsed = parseVoiceCommand(transcript);
    if (!parsed) {
      setFeedback("Could not parse. Please try again.");
      return;
    }
    await createReminder({
      profileId: DEFAULT_PROFILE_ID,
      label: parsed.label,
      scheduledAt: parsed.scheduledAt,
      recurrence: parsed.recurrence,
    });
    setFeedback(`Reminder created: ${parsed.label}`);
    refresh();
  };

  if (!supported) {
    return <p className="text-sm text-slate-400">Voice commands are not supported in this browser.</p>;
  }

  return (
    <section className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm uppercase text-white/70 tracking-widest">Voice Command</p>
          <h3 className="text-2xl font-bold">“Add a reminder for 2 PM”</h3>
        </div>
        <button
          onClick={listening ? stop : start}
          className={`rounded-full px-8 py-4 text-xl font-bold ${
            listening ? "bg-danger text-white animate-pulse" : "bg-accent text-slate-900"
          }`}
          aria-pressed={listening}
        >
          {listening ? "Stop" : "Start"} Listening
        </button>
      </div>
      <div className="bg-black/30 rounded-2xl p-4 min-h-[120px]" aria-live="polite">
        <p className="text-lg text-white/80">{transcript || "Transcript will appear here..."}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={createFromVoice}
          className="bg-primary text-white font-semibold px-6 py-3 rounded-2xl disabled:bg-slate-600"
          disabled={!transcript}
        >
          Create Reminder
        </button>
        <p className="text-sm text-white/70">{feedback}</p>
      </div>
    </section>
  );
};

