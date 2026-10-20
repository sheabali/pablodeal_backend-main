import { Worker } from "bullmq";

import { redisConfig } from "@/core/database/redis";
import { logger } from "@/core/logger";

import { closeMatchday, openMatchday } from "./league.lifecycle";
import type { LeagueJobData } from "./league.queue";

export const setupLeagueWorker = () => {
  new Worker<LeagueJobData>(
    "league",
    async (job) => {
      const { leagueId, matchdayId } = job.data;

      switch (job.data.job) {
        case "open-matchday":
          await openMatchday(leagueId, matchdayId);
          break;
        case "close-matchday":
          await closeMatchday(leagueId, matchdayId);
          break;
      }
    },
    {
      connection: redisConfig,
    },
  );

  logger.info("League worker ready");
};
