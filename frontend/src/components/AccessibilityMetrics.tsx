import { useRemindersContext } from "../context/ReminderProvider";

export const AccessibilityMetrics = () => {
  const { averageAckMs } = useRemindersContext();
  const seconds = averageAckMs / 1000;

  return (
    <section className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
      <h3 className="text-2xl font-bold mb-2">Accessibility Time</h3>
      <p className="text-white/70 text-lg">Average acknowledgement time</p>
      <p className="text-5xl font-extrabold mt-4 text-accent">{seconds ? seconds.toFixed(1) : "0.0"}s</p>
      <p className="text-sm text-white/50 mt-2">Goal: &lt; 60 seconds</p>
    </section>
  );
};

