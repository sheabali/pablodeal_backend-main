import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import type { Express } from "express";

import { userQueue } from "@/features/users/user.queue";
import { emailQueue } from "@/services/email";

import { authMiddleware } from "./bullboard.middleware";

export function mountBullBoard(app: Express) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [new BullMQAdapter(emailQueue), new BullMQAdapter(userQueue)],
    serverAdapter,
  });

  app.use("/admin/queues", authMiddleware, serverAdapter.getRouter());
}
