export interface Medication {
  id: string;
  name: string;
  dosage?: string | null;
  instructions?: string | null;
  preferredTime?: string;
  takeWithFood?: boolean;
  notes?: string | null;
}

export interface Reminder {
  id: string;
  label: string;
  scheduledAt: string;
  recurrence?: string | null;
  snoozeMinutes: number;
  active: boolean;
  medication?: Medication | null;
  logs?: ReminderLog[];
}

export interface ReminderLog {
  id: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  action?: "CONFIRMED" | "SNOOZED";
  ackTimeMs?: number;
}

export interface PlaylistItem {
  id: string;
  title: string;
  artist: string;
  query: string;
  provider: string;
  videoId?: string | null;
}

export interface ReminderTriggerPayload {
  reminder: Reminder;
  triggeredAt: string;
}

export type AckAction = "confirm" | "snooze";

export interface VoiceCommandResult {
  label: string;
  scheduledAt: string;
  recurrence?: string;
  medicationName?: string;
}

