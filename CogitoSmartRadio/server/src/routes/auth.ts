import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || "secret", {
    expiresIn: "12h",
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
    },
  });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      profile: true,
    },
  });

  res.json(user);
});

export default router;

