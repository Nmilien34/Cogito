import { addMinutes } from "date-fns";

export function computeAckTimeMs(triggeredAt: string, acknowledgedAt: string) {
  return new Date(acknowledgedAt).getTime() - new Date(triggeredAt).getTime();
}

export function computeSnoozedTime(triggeredAt: string, snoozeMinutes: number) {
  return addMinutes(new Date(triggeredAt), snoozeMinutes);
}

