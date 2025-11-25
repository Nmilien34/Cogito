import { useRemindersContext } from "../context/ReminderProvider";

export const ReminderList = () => {
  const { reminders, loading } = useRemindersContext();

  if (loading) {
    return <p className="text-white/70">Loading reminders…</p>;
  }

  return (
    <section className="bg-slate-900/70 border border-white/10 rounded-3xl p-6">
      <h3 className="text-2xl font-bold mb-4">Today's Reminders</h3>
      <ul className="space-y-3">
        {reminders.map((reminder) => (
          <li key={reminder.id} className="bg-white/5 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-xl font-semibold">{reminder.label}</p>
              <p className="text-white/60">{reminder.medication?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-accent text-2xl font-bold">
                {new Date(reminder.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </p>
              <p className="text-xs text-white/50 uppercase tracking-widest">{reminder.recurrence || "Once"}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

