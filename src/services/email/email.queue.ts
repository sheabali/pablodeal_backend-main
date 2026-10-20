import { Queue } from "bullmq";

import { redisConfig } from "@/core/database/redis";

import type { EmailJobPayload } from "./email.types";

export type EmailJobData = {
  to: string;
  subject: string;
} & EmailJobPayload;

export const emailQueue = new Queue<EmailJobData>("email", {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
