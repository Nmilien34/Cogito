import { Router } from "express";
import { prisma } from "../prismaClient";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Get all medications for a profile
router.get("/", requireAuth, async (req, res) => {
  const profileId = req.query.profileId as string;
  if (!profileId) {
    return res.status(400).json({ message: "profileId query param required" });
  }

  const medications = await prisma.medication.findMany({
    where: { profileId },
    orderBy: { name: "asc" },
  });

  res.json(medications);
});

// Create a new medication
router.post("/", requireAuth, async (req, res) => {
  const { profileId, name, dosage, instructions, preferredTime, takeWithFood, notes } = req.body;
  if (!profileId || !name) {
    return res.status(400).json({ message: "profileId and name required" });
  }

  const medication = await prisma.medication.create({
    data: {
      profileId,
      name,
      dosage,
      instructions,
      preferredTime: preferredTime ? new Date(preferredTime) : null,
      takeWithFood: takeWithFood ?? false,
      notes,
    },
  });

  res.status(201).json(medication);
});

// Update a medication
router.put("/:id", requireAuth, async (req, res) => {
  const { name, dosage, instructions, preferredTime, takeWithFood, notes } = req.body;
  
  const medication = await prisma.medication.update({
    where: { id: req.params.id },
    data: {
      name,
      dosage,
      instructions,
      preferredTime: preferredTime ? new Date(preferredTime) : undefined,
      takeWithFood,
      notes,
    },
  });

  res.json(medication);
});

// Delete a medication
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await prisma.medication.delete({
      where: { id: req.params.id },
    });
    res.json({ status: "deleted" });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Medication not found" });
    }
    throw error;
  }
});

export default router;

