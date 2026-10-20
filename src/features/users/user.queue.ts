import { Queue } from "bullmq";
import { redisConfig } from "@/core/database/redis";

export const userQueue = new Queue("user", {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  },
});
