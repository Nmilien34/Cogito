import { Router } from "express";
import { addMinutes } from "date-fns";
import { prisma } from "../prismaClient";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { emitReminderTrigger } from "../socket";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const profileId = req.query.profileId as string;
  if (!profileId) {
    return res.status(400).json({ message: "profileId query param required" });
  }

  const reminders = await prisma.reminder.findMany({
    where: { profileId },
    include: { medication: true, logs: { orderBy: { triggeredAt: "desc" }, take: 5 } },
    orderBy: { scheduledAt: "asc" },
  });

  res.json(reminders);
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const { profileId, medicationId, label, scheduledAt, recurrence, snoozeMinutes } = req.body;
  if (!profileId || !label || !scheduledAt) {
    return res.status(400).json({ message: "profileId, label, scheduledAt required" });
  }

  const reminder = await prisma.reminder.create({
    data: {
      profileId,
      medicationId,
      label,
      scheduledAt,
      recurrence,
      snoozeMinutes: snoozeMinutes ?? 10,
    },
  });

  res.status(201).json(reminder);
});

router.put("/:id", requireAuth, async (req, res) => {
  const data = req.body;
  const reminder = await prisma.reminder.update({
    where: { id: req.params.id },
    data,
  });

  res.json(reminder);
});

router.post("/:id/trigger", requireAuth, async (req, res) => {
  const reminder = await prisma.reminder.findUnique({
    where: { id: req.params.id },
    include: { medication: true },
  });
  if (!reminder) {
    return res.status(404).json({ message: "Reminder not found" });
  }
  const triggeredAt = new Date();

  await prisma.reminderLog.create({
    data: {
      reminderId: reminder.id,
      triggeredAt,
    },
  });

  emitReminderTrigger({
    reminder,
    triggeredAt: triggeredAt.toISOString(),
  });

  res.json({ status: "triggered" });
});

router.post("/:id/ack", requireAuth, async (req: AuthRequest, res) => {
  const { action, snoozeMinutes, ack_time_ms, notes, triggeredAt } = req.body;
  const reminder = await prisma.reminder.findUnique({ where: { id: req.params.id } });
  if (!reminder) {
    return res.status(404).json({ message: "Reminder not found" });
  }
  const acknowledgedAt = new Date();
  const triggeredCandidate = triggeredAt ? new Date(triggeredAt) : acknowledgedAt;
  const triggeredDate = Number.isNaN(triggeredCandidate.getTime()) ? acknowledgedAt : triggeredCandidate;

  await prisma.reminderLog.create({
    data: {
      reminderId: reminder.id,
      triggeredAt: triggeredDate,
      acknowledgedAt,
      action: action === "snooze" ? "SNOOZED" : "CONFIRMED",
      ackTimeMs: ack_time_ms ?? null,
      userId: req.user?.id,
      notes: notes ?? null,
    },
  });

  if (action === "snooze") {
    const snoozedDate = addMinutes(new Date(), snoozeMinutes ?? reminder.snoozeMinutes ?? 10);
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        scheduledAt: snoozedDate,
        recurrence: "SNOOZE",
        snoozeMinutes: snoozeMinutes ?? reminder.snoozeMinutes,
      },
    });
  } else {
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        recurrence: reminder.recurrence,
      },
    });
  }

  res.json({ status: "acknowledged" });
});

export default router;

