import { createContext, useContext, useEffect, useMemo, useState, useCallback, type PropsWithChildren } from "react";
import { io, type Socket } from "socket.io-client";
import type { AckAction, Reminder, ReminderTriggerPayload } from "../types";
import { DEFAULT_PROFILE_ID, SOCKET_URL } from "../config";
import { acknowledgeReminder, fetchReminders } from "../api/reminders";
import { useRadioAudio } from "./AudioProvider";

interface ReminderContextValue {
  reminders: Reminder[];
  loading: boolean;
  activeTrigger?: ReminderTriggerPayload;
  refresh: () => Promise<void>;
  handleAck: (action: AckAction, snoozeMinutes?: number) => Promise<void>;
  averageAckMs: number;
}

const ReminderCtx = createContext<ReminderContextValue | undefined>(undefined);

export const ReminderProvider = ({ children }: PropsWithChildren) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId] = useState(DEFAULT_PROFILE_ID);
  const [activeTrigger, setActiveTrigger] = useState<ReminderTriggerPayload | undefined>(undefined);
  const [ackLog, setAckLog] = useState<number[]>([]);
  const { duck, restore } = useRadioAudio();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReminders(profileId);
      setReminders(data);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const socket: Socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => console.log("Connected to ws"));
    socket.on("reminder_trigger", (payload: ReminderTriggerPayload) => {
      setActiveTrigger(payload);
      duck();
      showBrowserNotification(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, [duck]);

  const handleAck = useCallback(
    async (action: AckAction, snoozeMinutes?: number) => {
      if (!activeTrigger) return;
      const ack_time_ms = Date.now() - new Date(activeTrigger.triggeredAt).getTime();
      await acknowledgeReminder(activeTrigger.reminder.id, {
        action,
        snoozeMinutes,
        ack_time_ms,
        triggeredAt: activeTrigger.triggeredAt,
      });

      setAckLog((prev) => [...prev.slice(-19), ack_time_ms]);
      setActiveTrigger(undefined);
      restore();
      refresh();
    },
    [activeTrigger, refresh, restore],
  );

  const averageAckMs = useMemo(() => {
    if (!ackLog.length) return 0;
    return Math.round(ackLog.reduce((acc, curr) => acc + curr, 0) / ackLog.length);
  }, [ackLog]);

  return (
    <ReminderCtx.Provider value={{ reminders, loading, activeTrigger, refresh, handleAck, averageAckMs }}>
      {children}
    </ReminderCtx.Provider>
  );
};

export const useRemindersContext = () => {
  const ctx = useContext(ReminderCtx);
  if (!ctx) throw new Error("useRemindersContext must be used within ReminderProvider");
  return ctx;
};

function showBrowserNotification(payload: ReminderTriggerPayload) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification("Medication Reminder", {
        body: `${payload.reminder.label} at ${new Intl.DateTimeFormat([], {
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(payload.triggeredAt))}`,
        icon: "/icon-192.png",
        tag: payload.reminder.id,
        requireInteraction: true,
      });
    });
  }
}

