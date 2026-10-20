import { prisma } from "@/core/database";
import type { AttemptConfig } from "./league.types";

export const LEAGUE_DEFAULTS: AttemptConfig = {
  freeAttempts: 2,
  adAttempts: 1,
  packSize: 2,
  packPriceCents: 100,
};

export const LEAGUE_MATCHDAY_HOURS = 24;

/** Parameterized pricing/limits, admin-editable without code changes. */
export async function getLeagueConfig(): Promise<AttemptConfig> {
  const row = await prisma.leagueConfig.findUnique({
    where: { id: "default" },
  });

  if (!row) {
    return { ...LEAGUE_DEFAULTS };
  }

  return {
    freeAttempts: row.freeAttempts,
    adAttempts: row.adAttempts,
    packSize: row.packSize,
    packPriceCents: row.packPriceCents,
  };
}

export async function matchdayHours(): Promise<number> {
  const row = await prisma.leagueConfig.findUnique({
    where: { id: "default" },
  });
  return row?.matchdayHours ?? LEAGUE_MATCHDAY_HOURS;
}
