import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRouter from "./routes/auth";
import profileRouter from "./routes/profile";
import reminderRouter from "./routes/reminders";
import playlistRouter from "./routes/playlists";
import medicationRouter from "./routes/medications";
import devRouter from "./routes/dev";

export const createApp = () => {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan("dev"));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/reminders", reminderRouter);
  app.use("/api/playlists", playlistRouter);
  app.use("/api/medications", medicationRouter);
  app.use("/api/dev", devRouter);

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
  });

  return app;
};

