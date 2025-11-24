import cron from "node-cron";
import { addDays, addMinutes } from "date-fns";
import { prisma } from "../prismaClient";
import { emitReminderTrigger } from "../socket";

const FIFTEEN_SECONDS = 15 * 1000;

export const startScheduler = () => {
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const upcoming = new Date(now.getTime() + FIFTEEN_SECONDS);

    const dueReminders = await prisma.reminder.findMany({
      where: {
        active: true,
        scheduledAt: {
          lte: upcoming,
        },
      },
      include: {
        medication: true,
      },
    });

    for (const reminder of dueReminders) {
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

      const nextDate = computeNextScheduledAt(reminder.scheduledAt, reminder.recurrence, reminder.snoozeMinutes);

      if (nextDate) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            scheduledAt: nextDate,
          },
        });
      } else {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            active: false,
          },
        });
      }
    }
  });
};

function computeNextScheduledAt(current: Date, recurrence?: string | null, snoozeMinutes?: number | null) {
  if (!recurrence) {
    return null;
  }

  switch (recurrence) {
    case "DAILY":
      return addDays(current, 1);
    case "HOURLY":
      return addMinutes(current, 60);
    case "SNOOZE":
      return addMinutes(new Date(), snoozeMinutes ?? 10);
    default:
      return null;
  }
}

