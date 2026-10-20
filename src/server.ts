import http from "http";

import { logger, logStartup } from "@/core/logger";
import { setupGameGateway } from "@/features/game/game.gateway";
import { reEnqueuePendingMatchdays } from "@/features/league/league.scheduler";

import { app } from "./app";
import { config } from "./core";

const g = globalThis as unknown as { __server_listening__?: boolean };
const PORT = config.app.port;

if (!g.__server_listening__) {
  g.__server_listening__ = true;

  const server = http.createServer(app);
  setupGameGateway(server);

  server.listen(PORT, async () => {
    logStartup(PORT);
    logger.info("Ready for connections.");

    try {
      await reEnqueuePendingMatchdays();
    } catch (err) {
      logger.error("Failed to re-enqueue pending matchdays", { err });
    }
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`Port ${PORT} is already in use.`);
      logger.error(
        `Please free the port or set a different PORT in your .env file.`,
      );
      process.exit(1);
    }
    throw err;
  });
}
