import { api } from "./client";
import type { Reminder } from "../types";

export const fetchReminders = (profileId: string) =>
  api.get<Reminder[]>(`/reminders?profileId=${profileId}`);

export const createReminder = (input: Partial<Reminder> & { profileId: string }) =>
  api.post<Reminder>("/reminders", input);

export const updateReminder = (reminderId: string, input: Partial<Reminder>) =>
  api.put<Reminder>(`/reminders/${reminderId}`, input);

export const acknowledgeReminder = (
  reminderId: string,
  body: { action: string; snoozeMinutes?: number; ack_time_ms?: number; triggeredAt: string },
) => api.post(`/reminders/${reminderId}/ack`, body);

export const triggerReminderNow = (reminderId: string) => api.post(`/reminders/${reminderId}/trigger`, {});

