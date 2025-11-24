import { useMemo } from "react";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { useRemindersContext } from "../context/ReminderProvider";

export const AdminInsights = () => {
  const { reminders } = useRemindersContext();

  const chartData = useMemo(() => {
    const grouped: Record<string, number[]> = {};
    reminders.forEach((reminder) => {
      reminder.logs?.forEach((log) => {
        if (!log.ackTimeMs) return;
        const day = new Date(log.triggeredAt).toLocaleDateString();
        grouped[day] = grouped[day] || [];
        grouped[day].push(log.ackTimeMs / 1000);
      });
    });

    return Object.entries(grouped).map(([day, values]) => ({
      day,
      seconds: values.reduce((a, b) => a + b, 0) / values.length,
    }));
  }, [reminders]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-extrabold">Care Insights</h1>
        <p className="text-white/70">Average acknowledgement time over the last reminders.</p>
      </header>
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="day" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.1)" }} />
            <Bar dataKey="seconds" fill="#F2C14E" radius={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

