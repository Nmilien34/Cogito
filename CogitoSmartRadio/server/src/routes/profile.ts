import { Router } from "express";
import { prisma } from "../prismaClient";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.get("/:id", requireAuth, async (req, res) => {
  const profile = await prisma.profile.findUnique({
    where: { id: req.params.id },
    include: {
      medications: true,
      reminders: {
        include: {
          medication: true,
        },
      },
    },
  });

  if (!profile) {
    return res.status(404).json({ message: "Profile not found" });
  }

  res.json(profile);
});

router.put("/:id", requireAuth, requireRole("CAREGIVER"), async (req, res) => {
  const { age, conditions, residence, meals, favoriteGenres, favoriteSongs } = req.body;

  const profile = await prisma.profile.update({
    where: { id: req.params.id },
    data: {
      age,
      conditions,
      residence,
      meals,
      favoriteGenres,
      favoriteSongs,
    },
  });

  res.json(profile);
});

export default router;

