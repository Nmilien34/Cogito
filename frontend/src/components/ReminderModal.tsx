import { useEffect, useRef, useState } from "react";
import { useRemindersContext } from "../context/ReminderProvider";

export const ReminderModal = () => {
  const { activeTrigger, handleAck } = useRemindersContext();
  const [isRepeating, setIsRepeating] = useState(false);
  const repeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Speak the reminder details
  const speakReminder = () => {
    if (!activeTrigger || !("speechSynthesis" in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const { reminder } = activeTrigger;
    let message = `Reminder: ${reminder.label}. `;

    if (reminder.medication) {
      message += `Take ${reminder.medication.name}. `;
      if (reminder.medication.dosage) {
        message += `Dosage: ${reminder.medication.dosage}. `;
      }
      if (reminder.medication.instructions) {
        message += `Instructions: ${reminder.medication.instructions}. `;
      }
    }

    message += "Please confirm or snooze.";

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Initial speak when reminder triggers
  useEffect(() => {
    if (activeTrigger) {
      speakReminder();
    } else {
      // Clean up when reminder is dismissed
      window.speechSynthesis.cancel();
      if (repeatIntervalRef.current) {
        clearInterval(repeatIntervalRef.current);
        repeatIntervalRef.current = null;
      }
      setIsRepeating(false);
    }

    return () => {
      window.speechSynthesis.cancel();
      if (repeatIntervalRef.current) {
        clearInterval(repeatIntervalRef.current);
      }
    };
  }, [activeTrigger]);

  // Handle repeat functionality
  const toggleRepeat = () => {
    if (isRepeating) {
      // Stop repeating
      if (repeatIntervalRef.current) {
        clearInterval(repeatIntervalRef.current);
        repeatIntervalRef.current = null;
      }
      setIsRepeating(false);
    } else {
      // Start repeating every 5 minutes
      setIsRepeating(true);
      speakReminder(); // Speak immediately
      repeatIntervalRef.current = setInterval(() => {
        speakReminder();
      }, 5 * 60 * 1000); // 5 minutes in milliseconds
    }
  };

  // Stop repeat when snooze is clicked
  const handleSnooze = () => {
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
    setIsRepeating(false);
    window.speechSynthesis.cancel();
    handleAck("snooze", activeTrigger?.reminder.snoozeMinutes);
  };

  // Stop repeat when confirm is clicked
  const handleConfirm = () => {
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
    setIsRepeating(false);
    window.speechSynthesis.cancel();
    handleAck("confirm");
  };

  if (!activeTrigger) return null;

  const { reminder, triggeredAt } = activeTrigger;
  const scheduledTime = new Date(reminder.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      role="alertdialog"
      aria-live="assertive"
    >
      <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-8 shadow-2xl">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest">Reminder</p>
        <h3 className="text-3xl font-extrabold mt-2">{reminder.label}</h3>
        <p className="text-lg text-slate-600 mt-2">Scheduled at {scheduledTime}</p>
        {reminder.medication && (
          <div className="mt-4 bg-slate-100 rounded-2xl p-4">
            <p className="text-xl font-bold">{reminder.medication.name}</p>
            {reminder.medication.dosage && <p className="text-slate-600">Dosage: {reminder.medication.dosage}</p>}
            {reminder.medication.instructions && (
              <p className="text-slate-500 mt-2">{reminder.medication.instructions}</p>
            )}
          </div>
        )}

        {/* Repeat Button */}
        <div className="mt-4">
          <button
            onClick={toggleRepeat}
            className={`w-full text-xl font-bold py-4 rounded-2xl focus-visible:ring-4 ${
              isRepeating
                ? "bg-accent text-slate-900 ring-accent/60"
                : "bg-slate-200 text-slate-700 ring-slate-400"
            }`}
            aria-pressed={isRepeating}
          >
            {isRepeating ? "🔄 Repeating Every 5 Minutes (Click to Stop)" : "🔁 Repeat Reminder Every 5 Minutes"}
          </button>
        </div>

        {/* Confirm and Snooze Buttons */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            className="bg-primary text-white text-2xl font-bold py-6 rounded-2xl focus-visible:ring-4 ring-primary/60"
            onClick={handleConfirm}
          >
            Confirm
          </button>
          <button
            className="bg-slate-200 text-slate-900 text-2xl font-bold py-6 rounded-2xl focus-visible:ring-4 ring-slate-400"
            onClick={handleSnooze}
          >
            Snooze {reminder.snoozeMinutes}m
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-4">Triggered {new Date(triggeredAt).toLocaleTimeString()}</p>
      </div>
    </div>
  );
};
