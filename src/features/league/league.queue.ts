import { Queue } from "bullmq";

import { redisConfig } from "@/core/database/redis";

export type LeagueJobData =
  | { job: "open-matchday"; leagueId: string; matchdayId: string }
  | { job: "close-matchday"; leagueId: string; matchdayId: string };

export const leagueQueue = new Queue<LeagueJobData>("league", {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 200,
    removeOnFail: 100,
  },
});

export function enqueueOpenMatchday(
  leagueId: string,
  matchdayId: string,
  delayMs: number,
) {
  return leagueQueue.add(
    "open-matchday",
    { job: "open-matchday", leagueId, matchdayId },
    { delay: Math.max(0, delayMs) },
  );
}

export function enqueueCloseMatchday(
  leagueId: string,
  matchdayId: string,
  delayMs: number,
) {
  return leagueQueue.add(
    "close-matchday",
    { job: "close-matchday", leagueId, matchdayId },
    { delay: Math.max(0, delayMs) },
  );
}
