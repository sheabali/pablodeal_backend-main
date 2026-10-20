import { prisma } from "@/core/database";
import { logger } from "@/core/logger";

import { matchdayHours } from "./league.config";
import { broadcastToLeague } from "./league.broadcast";
import { resolveMatch } from "./league.rules";
import { computeStandings } from "./league.standings";
import { NotificationService } from "@/features/notification/notification.service";
import type { RuleEntryInput, RuleMatchInput } from "./league.types";

export interface ResolvedMatchdayResult {
  resolvedCount: number;
  autoWinCount: number;
  official: boolean;
}

/** Fetches one matchday with all matches + entries and resolves it. */
export async function resolveMatchday(leagueId: string, matchdayId: string) {
  const matchday = await prisma.matchday.findUnique({
    where: { id: matchdayId },
    include: {
      matches: {
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
        },
      },
      entries: true,
      league: { include: { teams: { select: { id: true } } } },
    },
  });

  if (!matchday || matchday.leagueId !== leagueId) {
    logger.warn("Matchday not found for close job", { leagueId, matchdayId });
    return null;
  }

  const entriesByTeam = new Map<string, RuleEntryInput>();
  for (const e of matchday.entries) {
    entriesByTeam.set(e.teamId, {
      teamId: e.teamId,
      attemptsUsed: e.attemptsUsed,
      freeAttemptsUsed: e.freeAttemptsUsed,
      adAttemptsUsed: e.adAttemptsUsed,
      adGranted: e.adGranted,
      purchasedAttempts: e.purchasedAttempts,
      purchasedAttemptsUsed: e.purchasedAttemptsUsed,
      bestGoals: e.bestGoals,
    });
  }

  const resolved = matchday.matches.map((m) => {
    const homeEntry =
      entriesByTeam.get(m.homeTeamId) ?? emptyEntry(m.homeTeamId);
    const awayEntry =
      entriesByTeam.get(m.awayTeamId) ?? emptyEntry(m.awayTeamId);

    const input: RuleMatchInput = {
      id: m.id,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      status:
        m.status === "FINISHED" || m.status === "AUTO_WIN"
          ? m.status
          : "FINISHED",
      homeGoals: m.homeGoals,
      awayGoals: m.awayGoals,
      winnerTeamId: m.winnerTeamId,
    };

    return {
      match: m,
      resolved: resolveMatch(input, homeEntry, awayEntry),
    };
  });

  return { matchday, resolved, entriesByTeam };
}

export function emptyEntry(teamId: string): RuleEntryInput {
  return {
    teamId,
    attemptsUsed: 0,
    freeAttemptsUsed: 0,
    adAttemptsUsed: 0,
    adGranted: false,
    purchasedAttempts: 0,
    purchasedAttemptsUsed: 0,
    bestGoals: 0,
  };
}

export async function openMatchday(leagueId: string, matchdayId: string) {
  const matchday = await prisma.matchday.findFirst({
    where: { id: matchdayId, leagueId },
  });
  if (!matchday) return;

  if (matchday.status !== "PENDING") {
    logger.info("Matchday already opened or closed", { matchdayId });
    return;
  }

  await prisma.matchday.update({
    where: { id: matchdayId },
    data: { status: "OPEN" },
  });

  logger.info("Matchday opened", {
    leagueId,
    matchdayId,
    number: matchday.number,
  });
  broadcastToLeague(leagueId, "league:matchday_opened", {
    matchdayId,
    number: matchday.number,
    opensAt: matchday.opensAt,
    closesAt: matchday.closesAt,
  });

  // Notify all league members
  const teams = await prisma.leagueTeam.findMany({
    where: { leagueId },
    select: { userId: true },
  });
  const userIds = teams.map((t) => t.userId);

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    select: { name: true },
  });

  await NotificationService.createBulk(
    userIds,
    "Matchday Open",
    `Matchday #${matchday.number} of ${league?.name ?? "your league"} is now open! Play your matches within 24 hours.`,
    "matchday_opened",
    { leagueId, matchdayId, matchdayNumber: matchday.number },
  );
}

export async function closeMatchday(leagueId: string, matchdayId: string) {
  const resolved = await resolveMatchday(leagueId, matchdayId);
  if (!resolved) return;

  const { matchday, resolved: results } = resolved;

  if (matchday.status === "CLOSED") {
    logger.info("Matchday already closed", { matchdayId });
    return;
  }

  const hours = await matchdayHours();

  await prisma.$transaction(
    results.map(({ match, resolved: r }) =>
      prisma.leagueMatch.update({
        where: { id: match.id },
        data: {
          status: r.status,
          homeGoals: r.homeGoals,
          awayGoals: r.awayGoals,
          winnerTeamId: r.winnerTeamId,
          finishedAt: new Date(),
        },
      }),
    ),
  );

  await prisma.matchday.update({
    where: { id: matchdayId },
    data: { status: "CLOSED" },
  });

  const teamIds = matchday.league.teams.map((t) => t.id);

  const matches = await prisma.leagueMatch.findMany({
    where: { matchdayId },
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      status: true,
      homeGoals: true,
      awayGoals: true,
      winnerTeamId: true,
    },
  });

  const standingsInput = matches.map<RuleMatchInput>((m) => ({
    id: m.id,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    status: m.status as "FINISHED" | "AUTO_WIN",
    homeGoals: m.homeGoals,
    awayGoals: m.awayGoals,
    winnerTeamId: m.winnerTeamId,
  }));

  const standings = computeStandings(teamIds, standingsInput);

  const totalMatchdays = await prisma.matchday.count({
    where: { leagueId },
  });
  const isLast = matchday.number >= totalMatchdays;

  if (isLast) {
    await prisma.league.update({
      where: { id: leagueId },
      data: { status: "FINISHED" },
    });
    const champion = standings[0];
    broadcastToLeague(leagueId, "league:season_ended", {
      champion: champion
        ? {
            teamId: champion.teamId,
            position: champion.position,
            points: champion.points,
          }
        : null,
    });
  }

  logger.info("Matchday closed", {
    leagueId,
    matchdayId,
    number: matchday.number,
    isLast,
    closedFor: `${hours}h`,
  });

  broadcastToLeague(leagueId, "league:matchday_closed", {
    matchdayId,
    number: matchday.number,
    standings,
    isLast,
  });

  // Notify all league members
  const teams = await prisma.leagueTeam.findMany({
    where: { leagueId },
    select: { userId: true },
  });
  const userIds = teams.map((t) => t.userId);

  const leagueInfo = await prisma.league.findUnique({
    where: { id: leagueId },
    select: { name: true },
  });

  if (isLast) {
    const champion = standings[0];
    const championTeam = champion
      ? await prisma.leagueTeam.findUnique({
          where: { id: champion.teamId },
          select: { name: true },
        })
      : null;

    await NotificationService.createBulk(
      userIds,
      "Season Complete",
      `${leagueInfo?.name ?? "Your league"} has finished! Champion: ${championTeam?.name ?? "TBD"}`,
      "season_ended",
      { leagueId, championTeamId: champion?.teamId },
    );
  } else {
    await NotificationService.createBulk(
      userIds,
      "Matchday Closed",
      `Matchday #${matchday.number} of ${leagueInfo?.name ?? "your league"} has ended. Check the updated standings!`,
      "matchday_closed",
      { leagueId, matchdayId, matchdayNumber: matchday.number },
    );
  }
}
