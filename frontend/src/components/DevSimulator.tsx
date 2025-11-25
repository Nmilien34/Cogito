import { useState } from "react";
import { triggerReminderNow } from "../api/reminders";
import { useRemindersContext } from "../context/ReminderProvider";

export const DevSimulator = () => {
  const { reminders } = useRemindersContext();
  const [status, setStatus] = useState("");

  const trigger = async () => {
    if (!reminders.length) return;
    setStatus("Triggering...");
    await triggerReminderNow(reminders[0].id);
    setStatus("Reminder triggered");
  };

  if (import.meta.env.PROD) return null;

  return (
    <section className="bg-danger/10 border border-danger/40 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-danger font-bold text-xl">QA Simulator</p>
          <p className="text-danger/80 text-sm">Dev-only tool to test ducking instantly.</p>
        </div>
        <button className="bg-danger text-white px-6 py-3 rounded-full text-lg font-semibold" onClick={trigger}>
          Trigger Reminder Now
        </button>
      </div>
      <p className="text-danger mt-3 text-sm">{status}</p>
    </section>
  );
};

