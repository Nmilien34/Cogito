import { Reminder } from "@prisma/client";

export type ReminderWithRelations = Reminder & {
  medication?: {
    id: string;
    name: string;
    dosage: string | null;
  } | null;
};

export interface ReminderAckPayload {
  reminderId: string;
  action: "confirm" | "snooze";
  ack_time_ms?: number;
  snoozeMinutes?: number;
  notes?: string;
  userId?: string;
  triggeredAt?: string;
}

export interface ReminderTriggerPayload {
  reminder: ReminderWithRelations;
  triggeredAt: string;
}

