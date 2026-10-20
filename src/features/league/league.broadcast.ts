import { EventEmitter } from "node:events";

import { logger } from "@/core/logger";

export interface LeagueSocketEvent {
  leagueId: string;
  event: string;
  data: unknown;
}

/** Bridge between background jobs/HTTP layer and the Socket.IO gateway. */
export const leagueEvents = new EventEmitter();

export function broadcastToLeague(
  leagueId: string,
  event: string,
  data: unknown,
) {
  leagueEvents.emit("broadcast", {
    leagueId,
    event,
    data,
  } satisfies LeagueSocketEvent);
}

export function subscribeLeagueBroadcasts(
  handler: (payload: LeagueSocketEvent) => void,
) {
  leagueEvents.on("broadcast", (payload: LeagueSocketEvent) => {
    try {
      handler(payload);
    } catch (err) {
      logger.error("League broadcast handler failed", { err });
    }
  });
}

export function announceActivity(
  leagueId: string,
  text: string,
  extra: Record<string, unknown> = {},
) {
  broadcastToLeague(leagueId, "league:activity", {
    text,
    at: new Date().toISOString(),
    ...extra,
  });
}
