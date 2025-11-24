import { Server } from "socket.io";
import { Server as HTTPServer } from "http";
import { ReminderTriggerPayload, ReminderAckPayload } from "./types";
import { prisma } from "./prismaClient";

let io: Server | undefined;

export const initSocket = (server: HTTPServer) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected", socket.id);

    socket.on("disconnect", () => console.log("Client disconnected", socket.id));

    socket.on("reminder_ack", async (payload: ReminderAckPayload) => {
      await prisma.reminderLog.create({
        data: {
          reminderId: payload.reminderId,
          triggeredAt: new Date(),
          acknowledgedAt: new Date(),
          action: payload.action === "confirm" ? "CONFIRMED" : "SNOOZED",
          ackTimeMs: payload.ack_time_ms ?? null,
          notes: payload.notes ?? null,
          userId: payload.userId,
        },
      });
    });
  });

  return io;
};

export const emitReminderTrigger = (payload: ReminderTriggerPayload) => {
  io?.emit("reminder_trigger", payload);
};

