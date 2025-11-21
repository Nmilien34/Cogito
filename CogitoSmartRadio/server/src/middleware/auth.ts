import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as { sub: string; role: string };

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    console.error("Auth error", err);
    res.status(401).json({ message: "Unauthorized" });
  }
};

export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

