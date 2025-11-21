import * as chrono from "chrono-node";
import { formatISO } from "date-fns";
import type { VoiceCommandResult } from "../types";

const MEDICATION_KEYWORDS = ["take", "remind me to take", "set med reminder for", "medication"];

export function parseVoiceCommand(transcript: string): VoiceCommandResult | null {
  if (!transcript) return null;

  const text = transcript.trim();
  const lower = text.toLowerCase();

  const parsedDate = chrono.parseDate(text, new Date());
  if (!parsedDate) {
    return null;
  }

  let label = "Medication Reminder";

  for (const keyword of MEDICATION_KEYWORDS) {
    if (lower.includes(keyword)) {
      const afterKeyword = text.slice(lower.indexOf(keyword) + keyword.length).trim();
      if (afterKeyword) {
        label = afterKeyword.replace(/^to\s+/i, "").replace(/\bat\b.+$/i, "").trim();
      }
      break;
    }
  }

  const recurrence = lower.includes("every day") || lower.includes("daily") ? "DAILY" : undefined;

  return {
    label: label || "Medication Reminder",
    scheduledAt: formatISO(parsedDate),
    recurrence,
  };
}

