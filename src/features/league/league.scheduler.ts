import { prisma } from "@/core/database";
import { logger } from "@/core/logger";
import { enqueueCloseMatchday, enqueueOpenMatchday } from "./league.queue";

/**
 * On server startup, re-enqueue all pending matchdays that are
 * within active leagues. This ensures open/close jobs survive restarts.
 */
export async function reEnqueuePendingMatchdays() {
  const pendingMatchdays = await prisma.matchday.findMany({
    where: {
      status: "PENDING",
      league: { status: "ACTIVE" },
    },
    include: {
      league: {
        select: { id: true, startDate: true, matchdayStartMinutes: true },
      },
    },
    orderBy: [{ leagueId: "asc" }, { number: "asc" }],
  });

  if (pendingMatchdays.length === 0) {
    logger.info("No pending matchdays to re-enqueue");
    return;
  }

  let enqueued = 0;

  for (const md of pendingMatchdays) {
    const now = Date.now();
    const opensAt = md.opensAt.getTime();
    const closesAt = md.closesAt.getTime();

    // Only enqueue if the matchday hasn't already passed its close time
    if (closesAt <= now) {
      logger.warn("Stale pending matchday found, skipping", {
        matchdayId: md.id,
        leagueId: md.leagueId,
        number: md.number,
        closesAt: md.closesAt,
      });
      continue;
    }

    const delayOpen = Math.max(0, opensAt - now);
    const delayClose = Math.max(0, closesAt - now);

    await enqueueOpenMatchday(md.leagueId, md.id, delayOpen);
    await enqueueCloseMatchday(md.leagueId, md.id, delayClose);
    enqueued++;
  }

  logger.info("Re-enqueued pending matchdays", { count: enqueued });
}
