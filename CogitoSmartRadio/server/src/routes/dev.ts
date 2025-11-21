import { Router } from "express";
import { prisma } from "../prismaClient";

const router = Router();

router.use((req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ message: "Not available in production" });
  }
  next();
});

router.get("/reminders", async (_req, res) => {
  const reminders = await prisma.reminder.findMany({
    include: { medication: true },
    orderBy: { scheduledAt: "asc" },
  });
  res.json(reminders);
});

export default router;

