import "dotenv/config";
import http from "http";
import { createApp } from "./app";
import { connectPrisma } from "./prismaClient";
import { initSocket } from "./socket";
import { startScheduler } from "./services/scheduler";

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  await connectPrisma();

  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);
  startScheduler();

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Server failed to start", err);
  process.exit(1);
});

