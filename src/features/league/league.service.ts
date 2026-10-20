import { randomBytes } from "node:crypto";

import { config } from "@/core/config";
import { StatusCodes } from "@/core/constants";
import { prisma } from "@/core/database";
import { throwError } from "@/core/utils/app-error";

import {
  evaluateCornerGuess,
  evaluateEvenOdd,
  evaluateNumberGuess,
  evaluateStopwatch,
} from "@/features/game/game.types";
import { NotificationService } from "@/features/notification/notification.service";
import { StripeService } from "@/features/payment/stripe.service";
import type { GameEventType } from "@/prisma/enums";
import { announceActivity } from "./league.broadcast";
import { getLeagueConfig, matchdayHours } from "./league.config";
import { enqueueCloseMatchday, enqueueOpenMatchday } from "./league.queue";
import { attemptsEligibility, nextAttemptBucket } from "./league.rules";
import {
  generateRoundRobinSchedule,
  matchdayClosesAt,
  matchdayOpensAt,
} from "./league.schedule";
import {
  computeProvisionalStandings,
  computeStandings,
} from "./league.standings";

function generateInviteCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

function inviteLinkFor(code: string): string {
  return `${config.app.frontendUrl}/league/join?code=${code}`;
}

async function uniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateInviteCode();
    const existing = await prisma.league.findUnique({
      where: { inviteCode: code },
    });
    if (!existing) return code;
  }
  return `${generateInviteCode()}${randomBytes(2).toString("hex").toUpperCase()}`;
}

export function extractCode(input: string): string {
  const m = input.match(/[?&]code=([A-Za-z0-9]+)/);
  return (m?.[1] ?? input).trim().toUpperCase();
}

export const LeagueService = {
  async getConfig() {
    return getLeagueConfig();
  },

  async createLeague(
    userId: string,
    input: { name: string; startDate: Date; matchdayStartMinutes: number },
  ) {
    const code = await uniqueInviteCode();

    return prisma.league.create({
      data: {
        name: input.name,
        adminId: userId,
        startDate: input.startDate,
        matchdayStartMinutes: input.matchdayStartMinutes,
        inviteCode: code,
        inviteLink: inviteLinkFor(code),
      },
      include: { admin: { select: { id: true, name: true } } },
    });
  },

  async listLeaguesForUser(userId: string) {
    return prisma.league.findMany({
      where: {
        OR: [{ adminId: userId }, { teams: { some: { userId } } }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { id: true, name: true } },
        _count: { select: { teams: true, matchdays: true } },
      },
    });
  },

  async getLeagueForUser(userId: string, leagueId: string) {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        admin: { select: { id: true, name: true } },
        _count: { select: { teams: true, matchdays: true } },
      },
    });
    if (!league) throwError(StatusCodes.NOT_FOUND, "League not found");

    const myTeam = await prisma.leagueTeam.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    });

    return { league, myTeam, isAdmin: league.adminId === userId };
  },

  async joinLeague(
    userId: string,
    input: { code: string; teamName: string; crestUrl?: string },
  ) {
    const code = extractCode(input.code);
    const league = await prisma.league.findUnique({
      where: { inviteCode: code },
    });
    if (!league) throwError(StatusCodes.NOT_FOUND, "Invalid invitation code");

    if (league.status !== "PENDING") {
      throwError(
        StatusCodes.CONFLICT,
        "The league is no longer accepting registrations",
      );
    }

    const existing = await prisma.leagueTeam.findUnique({
      where: { leagueId_userId: { leagueId: league.id, userId } },
    });
    if (existing) {
      throwError(
        StatusCodes.CONFLICT,
        "You already have a team in this league",
      );
    }

    const team = await prisma.leagueTeam.create({
      data: {
        leagueId: league.id,
        userId,
        name: input.teamName,
        crestUrl: input.crestUrl,
      },
    });

    announceActivity(league.id, `${team.name} has joined the league`, {
      teamId: team.id,
    });

    // Notify league admin
    await NotificationService.create({
      userId: league.adminId,
      title: "New Team Joined",
      body: `${team.name} has joined ${league.name}`,
      type: "general",
      data: { leagueId: league.id, teamId: team.id },
    });

    return { team, league: { id: league.id, name: league.name } };
  },

  async listTeams(leagueId: string) {
    return prisma.leagueTeam.findMany({
      where: { leagueId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true } } },
    });
  },

  async startLeague(userId: string, leagueId: string) {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: { teams: { select: { id: true } } },
    });
    if (!league) throwError(StatusCodes.NOT_FOUND, "League not found");
    if (league.adminId !== userId) {
      throwError(
        StatusCodes.FORBIDDEN,
        "Only the league administrator can start the league",
      );
    }
    if (league.status !== "PENDING") {
      throwError(StatusCodes.CONFLICT, "League already started");
    }
    if (league.teams.length < 2) {
      throwError(
        StatusCodes.BAD_REQUEST,
        "At least 2 teams are required to start the league",
      );
    }

    const teamIds = league.teams.map((t) => t.id);
    const schedule = generateRoundRobinSchedule(teamIds);
    const hours = await matchdayHours();

    const matchdays = schedule.map((md) => {
      const opensAt = matchdayOpensAt(
        league.startDate,
        league.matchdayStartMinutes,
        md.number,
      );
      return {
        number: md.number,
        opensAt,
        closesAt: matchdayClosesAt(opensAt, hours),
      };
    });

    const result = await prisma.$transaction(async (tx) => {
      const leagueUpdate = await tx.league.update({
        where: { id: leagueId },
        data: { status: "ACTIVE" },
        include: { teams: true },
      });

      const created: { id: string; number: number }[] = [];
      for (const md of matchdays) {
        const row = await tx.matchday.create({
          data: {
            leagueId,
            number: md.number,
            opensAt: md.opensAt,
            closesAt: md.closesAt,
          },
        });
        created.push({ id: row.id, number: row.number });

        for (const teamId of teamIds) {
          await tx.matchdayEntry.create({
            data: { matchdayId: row.id, teamId },
          });
        }
      }

      const matchesToCreate: {
        matchdayId: string;
        homeTeamId: string;
        awayTeamId: string;
      }[] = [];
      for (const md of schedule) {
        const mdRow = created.find((c) => c.number === md.number)!;
        for (const m of md.matches) {
          matchesToCreate.push({
            matchdayId: mdRow.id,
            homeTeamId: m.homeTeamId,
            awayTeamId: m.awayTeamId,
          });
        }
      }

      await tx.leagueMatch.createMany({ data: matchesToCreate });

      return { leagueUpdate, created };
    });

    for (const md of result.created) {
      const opensAt = matchdays.find((x) => x.number === md.number)!.opensAt;
      const closesAt = matchdays.find((x) => x.number === md.number)!.closesAt;
      const now = Date.now();
      await enqueueOpenMatchday(leagueId, md.id, opensAt.getTime() - now);
      await enqueueCloseMatchday(leagueId, md.id, closesAt.getTime() - now);
    }

    announceActivity(leagueId, "The league has started — schedule generated");

    // Notify all league members
    const teamUsers = await prisma.leagueTeam.findMany({
      where: { leagueId },
      select: { userId: true },
    });
    await NotificationService.createBulk(
      teamUsers.map((t) => t.userId),
      "League Started",
      `${league.name} has started! The schedule is now live.`,
      "league_started",
      { leagueId },
    );

    return {
      league: result.leagueUpdate,
      matchdays: matchdays.map((md, i) => ({
        number: md.number,
        opensAt: md.opensAt,
        closesAt: md.closesAt,
        byeTeamId: schedule[i]!.byeTeamId,
      })),
    };
  },

  async getSchedule(leagueId: string) {
    return prisma.matchday.findMany({
      where: { leagueId },
      orderBy: { number: "asc" },
      include: {
        matches: {
          include: {
            homeTeam: { select: { id: true, name: true, crestUrl: true } },
            awayTeam: { select: { id: true, name: true, crestUrl: true } },
          },
        },
      },
    });
  },

  async getStandings(leagueId: string, live?: boolean) {
    const [teams, matchdays, matches, savedGoals] = await Promise.all([
      prisma.leagueTeam.findMany({
        where: { leagueId },
        select: {
          id: true,
          name: true,
          crestUrl: true,
          userId: true,
          user: { select: { name: true } },
        },
      }),
      prisma.matchday.findMany({
        where: { leagueId },
        include: {
          entries: true,
        },
      }),
      prisma.leagueMatch.findMany({
        where: { matchday: { leagueId } },
        include: {
          attempts: true,
          homeTeam: { select: { id: true, name: true, crestUrl: true } },
          awayTeam: { select: { id: true, name: true, crestUrl: true } },
        },
      }),
      prisma.savedGoal.findMany({
        where: { leagueId },
      }),
    ]);

    const teamIds = teams.map((t) => t.id);
    const teamMeta = new Map<
      string,
      {
        id: string;
        name: string;
        crestUrl?: string | null;
        userName?: string | null;
      }
    >();
    for (const t of teams) {
      teamMeta.set(t.id, {
        id: t.id,
        name: t.name,
        crestUrl: t.crestUrl,
        userName: t.user?.name ?? null,
      });
    }

    const entryByMdAndTeam = new Map<
      string,
      { bestGoals: number; attemptsUsed: number }
    >();
    for (const md of matchdays) {
      for (const e of md.entries) {
        entryByMdAndTeam.set(`${md.id}_${e.teamId}`, {
          bestGoals: e.bestGoals,
          attemptsUsed: e.attemptsUsed,
        });
      }
    }

    const ruleMatches = matches.map((m) => {
      const homeEntry = entryByMdAndTeam.get(`${m.matchdayId}_${m.homeTeamId}`);
      const awayEntry = entryByMdAndTeam.get(`${m.matchdayId}_${m.awayTeamId}`);

      const homeAttempts = m.attempts.filter((a) => a.teamId === m.homeTeamId);
      const awayAttempts = m.attempts.filter((a) => a.teamId === m.awayTeamId);

      const maxHomeAttempt =
        homeAttempts.length > 0
          ? Math.max(...homeAttempts.map((a) => a.goals))
          : 0;
      const maxAwayAttempt =
        awayAttempts.length > 0
          ? Math.max(...awayAttempts.map((a) => a.goals))
          : 0;

      const homeSavedGoals = savedGoals
        .filter(
          (g) =>
            (g.matchId === m.id || g.matchdayId === m.matchdayId) &&
            g.scoringTeamId === m.homeTeamId,
        )
        .reduce((sum, g) => sum + g.score, 0);

      const awaySavedGoals = savedGoals
        .filter(
          (g) =>
            (g.matchId === m.id || g.matchdayId === m.matchdayId) &&
            g.scoringTeamId === m.awayTeamId,
        )
        .reduce((sum, g) => sum + g.score, 0);

      const effectiveHomeGoals = Math.max(
        m.homeGoals ?? 0,
        homeEntry?.bestGoals ?? 0,
        maxHomeAttempt,
        homeSavedGoals,
      );

      const effectiveAwayGoals = Math.max(
        m.awayGoals ?? 0,
        awayEntry?.bestGoals ?? 0,
        maxAwayAttempt,
        awaySavedGoals,
      );

      const hasPlayed =
        m.status === "FINISHED" ||
        m.status === "AUTO_WIN" ||
        m.status === "IN_PLAY" ||
        (m.homeGoals !== null && m.homeGoals > 0) ||
        (m.awayGoals !== null && m.awayGoals > 0) ||
        (homeEntry && homeEntry.attemptsUsed > 0) ||
        (awayEntry && awayEntry.attemptsUsed > 0) ||
        homeAttempts.length > 0 ||
        awayAttempts.length > 0 ||
        homeSavedGoals > 0 ||
        awaySavedGoals > 0;

      let status = m.status;
      if (status === "PENDING" && hasPlayed) {
        status = "IN_PLAY";
      }

      let winnerTeamId = m.winnerTeamId;
      if (!winnerTeamId && hasPlayed) {
        if (effectiveHomeGoals > effectiveAwayGoals) {
          winnerTeamId = m.homeTeamId;
        } else if (effectiveAwayGoals > effectiveHomeGoals) {
          winnerTeamId = m.awayTeamId;
        }
      }

      return {
        id: m.id,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        status,
        homeGoals: hasPlayed ? effectiveHomeGoals : null,
        awayGoals: hasPlayed ? effectiveAwayGoals : null,
        winnerTeamId,
      };
    });

    const standings = computeStandings(teamIds, ruleMatches, teamMeta);

    const openMatchday = matchdays.find((md) => md.status === "OPEN");
    let provisional = null;
    if (openMatchday) {
      const openMatches = matches.filter(
        (m) => m.matchdayId === openMatchday.id,
      );
      provisional = computeProvisionalStandings(
        teamIds,
        openMatches.map((m) => ({
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
        })),
        openMatchday.entries.map((e) => ({
          teamId: e.teamId,
          bestGoals: e.bestGoals,
          attemptsUsed: e.attemptsUsed,
        })),
        teamMeta,
      );
    }

    const matchDetails = matches.map((m) => {
      const homeSavedGoals = savedGoals
        .filter(
          (g) =>
            (g.matchId === m.id || g.matchdayId === m.matchdayId) &&
            g.scoringTeamId === m.homeTeamId,
        )
        .reduce((sum, g) => sum + g.score, 0);

      const awaySavedGoals = savedGoals
        .filter(
          (g) =>
            (g.matchId === m.id || g.matchdayId === m.matchdayId) &&
            g.scoringTeamId === m.awayTeamId,
        )
        .reduce((sum, g) => sum + g.score, 0);

      const homeEntry = entryByMdAndTeam.get(`${m.matchdayId}_${m.homeTeamId}`);
      const awayEntry = entryByMdAndTeam.get(`${m.matchdayId}_${m.awayTeamId}`);

      const effectiveHomeGoals = Math.max(
        m.homeGoals ?? 0,
        homeEntry?.bestGoals ?? 0,
        homeSavedGoals,
      );
      const effectiveAwayGoals = Math.max(
        m.awayGoals ?? 0,
        awayEntry?.bestGoals ?? 0,
        awaySavedGoals,
      );

      const hasPlayed =
        m.status === "FINISHED" ||
        m.status === "AUTO_WIN" ||
        m.status === "IN_PLAY" ||
        (homeEntry && homeEntry.attemptsUsed > 0) ||
        (awayEntry && awayEntry.attemptsUsed > 0) ||
        homeSavedGoals > 0 ||
        awaySavedGoals > 0;

      return {
        id: m.id,
        matchdayId: m.matchdayId,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeGoals: hasPlayed ? effectiveHomeGoals : 0,
        awayGoals: hasPlayed ? effectiveAwayGoals : 0,
        status: hasPlayed && m.status === "PENDING" ? "IN_PLAY" : m.status,
        winnerTeamId:
          effectiveHomeGoals > effectiveAwayGoals
            ? m.homeTeamId
            : effectiveAwayGoals > effectiveHomeGoals
              ? m.awayTeamId
              : null,
        isDraw: hasPlayed && effectiveHomeGoals === effectiveAwayGoals,
      };
    });

    return {
      standings,
      official: standings,
      provisional: live ? provisional : null,
      matches: matchDetails,
    };
  },

  async getCurrentMatchday(leagueId: string, userId: string) {
    const myTeam = await prisma.leagueTeam.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    });
    if (!myTeam)
      throwError(StatusCodes.FORBIDDEN, "You are not in this league");

    const matchdays = await prisma.matchday.findMany({
      where: { leagueId },
      orderBy: { number: "asc" },
    });

    const openIndex = matchdays.findIndex((m) => m.status === "OPEN");
    const current = openIndex >= 0 ? matchdays[openIndex] : null;
    const next = current
      ? (matchdays[openIndex + 1] ?? null)
      : (matchdays.find((m) => m.status === "PENDING") ?? null);

    const loadMatch = async (md: { id: string; number: number } | null) => {
      if (!md) return null;
      const match = await prisma.leagueMatch.findFirst({
        where: {
          matchdayId: md.id,
          OR: [{ homeTeamId: myTeam.id }, { awayTeamId: myTeam.id }],
        },
        include: {
          homeTeam: { select: { id: true, name: true, crestUrl: true } },
          awayTeam: { select: { id: true, name: true, crestUrl: true } },
        },
      });
      return match
        ? {
            matchdayNumber: md.number,
            match,
            opponent:
              match.homeTeamId === myTeam.id ? match.awayTeam : match.homeTeam,
          }
        : null;
    };

    const entry = current
      ? await prisma.matchdayEntry.findUnique({
          where: {
            matchdayId_teamId: { matchdayId: current.id, teamId: myTeam.id },
          },
        })
      : null;

    const config = await getLeagueConfig();
    const eligibility = entry
      ? attemptsEligibility(
          {
            teamId: myTeam.id,
            attemptsUsed: entry.attemptsUsed,
            freeAttemptsUsed: entry.freeAttemptsUsed,
            adAttemptsUsed: entry.adAttemptsUsed,
            adGranted: entry.adGranted,
            purchasedAttempts: entry.purchasedAttempts,
            purchasedAttemptsUsed: entry.purchasedAttemptsUsed,
            bestGoals: entry.bestGoals,
          },
          config,
        )
      : null;

    const myNext = await loadMatch(next);

    return {
      current: current
        ? {
            id: current.id,
            number: current.number,
            opensAt: current.opensAt,
            closesAt: current.closesAt,
            countdownMs: Math.max(0, current.opensAt.getTime() - Date.now()),
            closesInMs: Math.max(0, current.closesAt.getTime() - Date.now()),
          }
        : null,
      next: next
        ? {
            id: next.id,
            number: next.number,
            opensAt: next.opensAt,
            closesAt: next.closesAt,
            countdownMs: Math.max(0, next.opensAt.getTime() - Date.now()),
          }
        : null,
      myNextMatch: myNext
        ? {
            matchdayNumber: myNext.matchdayNumber,
            opponent: {
              id: myNext.opponent.id,
              name: myNext.opponent.name,
              crestUrl: myNext.opponent.crestUrl,
            },
            opensAt: next?.opensAt,
            countdownMs: next
              ? Math.max(0, next.opensAt.getTime() - Date.now())
              : 0,
          }
        : null,
      myEntry: eligibility
        ? {
            used: eligibility.used,
            total: eligibility.total,
            remaining: eligibility.total - eligibility.used,
            freeLeft: eligibility.freeLeft,
            adLeft: eligibility.adLeft,
            purchasedLeft: eligibility.purchasedLeft,
            bestGoals: entry?.bestGoals ?? 0,
            activeGameId: entry?.activeGameId ?? null,
          }
        : null,
      pricing: {
        freeAttempts: config.freeAttempts,
        adAttempts: config.adAttempts,
        packSize: config.packSize,
        packPriceCents: config.packPriceCents,
      },
    };
  },

  async getMatchday(leagueId: string, number: number) {
    const matchday = await prisma.matchday.findFirst({
      where: { leagueId, number },
      include: {
        matches: {
          include: {
            homeTeam: { select: { id: true, name: true, crestUrl: true } },
            awayTeam: { select: { id: true, name: true, crestUrl: true } },
            attempts: {
              include: {
                team: { select: { id: true } },
              },
              orderBy: { attemptNumber: "asc" },
            },
          },
        },
        entries: {
          include: {
            team: { select: { id: true, name: true, crestUrl: true } },
          },
        },
      },
    });
    if (!matchday) throwError(StatusCodes.NOT_FOUND, "Matchday not found");

    const entryByTeam = new Map(matchday.entries.map((e) => [e.teamId, e]));

    const matches = matchday.matches.map((m) => {
      const home = entryByTeam.get(m.homeTeamId);
      const away = entryByTeam.get(m.awayTeamId);
      const homeUsed = home?.attemptsUsed ?? 0;
      const awayUsed = away?.attemptsUsed ?? 0;

      let phase: "PENDING" | "IN_PLAY" | "FINISHED" | "AUTO_WIN" = "PENDING";
      if (m.status === "FINISHED" || m.status === "AUTO_WIN") {
        phase = m.status === "AUTO_WIN" ? "AUTO_WIN" : "FINISHED";
      } else if (homeUsed > 0 || awayUsed > 0) {
        phase = "IN_PLAY";
      }

      return {
        id: m.id,
        home: {
          id: m.homeTeam.id,
          name: m.homeTeam.name,
          crestUrl: m.homeTeam.crestUrl,
        },
        away: {
          id: m.awayTeam.id,
          name: m.awayTeam.name,
          crestUrl: m.awayTeam.crestUrl,
        },
        status: phase,
        homeBest: home?.bestGoals ?? 0,
        awayBest: away?.bestGoals ?? 0,
        homeAttemptsUsed: homeUsed,
        awayAttemptsUsed: awayUsed,
        homeLastAttemptAt: home?.lastAttemptAt ?? null,
        awayLastAttemptAt: away?.lastAttemptAt ?? null,
        officialHomeGoals: m.homeGoals,
        officialAwayGoals: m.awayGoals,
        winnerTeamId: m.winnerTeamId,
        history: m.attempts.map((a) => ({
          teamId: a.teamId,
          attemptNumber: a.attemptNumber,
          goals: a.goals,
          at: a.createdAt,
        })),
      };
    });

    return { matchday: { ...matchday, matches: undefined }, matches };
  },

  async getMatchdayLive(leagueId: string) {
    const matchday = await prisma.matchday.findFirst({
      where: { leagueId, status: "OPEN" },
      include: {
        matches: {
          include: {
            homeTeam: { select: { id: true, name: true, crestUrl: true } },
            awayTeam: { select: { id: true, name: true, crestUrl: true } },
          },
        },
        entries: true,
      },
    });

    if (!matchday) {
      return { matchday: null, matches: [] };
    }

    const entryByTeam = new Map(matchday.entries.map((e) => [e.teamId, e]));

    const matches = matchday.matches.map((m) => {
      const home = entryByTeam.get(m.homeTeamId);
      const away = entryByTeam.get(m.awayTeamId);
      const homeUsed = home?.attemptsUsed ?? 0;
      const awayUsed = away?.attemptsUsed ?? 0;

      let status: "PENDING" | "IN_PLAY" | "FINISHED" = "PENDING";
      if (homeUsed > 0 || awayUsed > 0) status = "IN_PLAY";
      if (home && away && homeUsed > 0 && awayUsed > 0) status = "FINISHED";

      const hg = home?.bestGoals ?? 0;
      const ag = away?.bestGoals ?? 0;

      return {
        id: m.id,
        home: {
          id: m.homeTeam.id,
          name: m.homeTeam.name,
          crestUrl: m.homeTeam.crestUrl,
        },
        away: {
          id: m.awayTeam.id,
          name: m.awayTeam.name,
          crestUrl: m.awayTeam.crestUrl,
        },
        status,
        homeBest: hg,
        awayBest: ag,
        provisionalResult:
          homeUsed > 0 || awayUsed > 0
            ? { homeGoals: hg, awayGoals: ag }
            : null,
        homeAttemptsUsed: homeUsed,
        awayAttemptsUsed: awayUsed,
      };
    });

    return { matchday, matches };
  },

  async grantAdAttempt(userId: string, leagueId: string) {
    const { myTeam, matchday } = await this.requireActiveParticipation(
      userId,
      leagueId,
    );
    const config = await getLeagueConfig();

    const entry = await prisma.matchdayEntry.findUnique({
      where: {
        matchdayId_teamId: { matchdayId: matchday.id, teamId: myTeam.id },
      },
    });
    if (!entry) throwError(StatusCodes.BAD_REQUEST, "No matchday entry found");

    if (entry.adGranted || entry.adAttemptsUsed >= config.adAttempts) {
      throwError(
        StatusCodes.CONFLICT,
        "Ad attempt already claimed this matchday",
      );
    }

    await prisma.matchdayEntry.update({
      where: { id: entry.id },
      data: { adGranted: true },
    });

    return {
      adGranted: true,
      attemptsLeft:
        config.freeAttempts +
        config.adAttempts +
        entry.purchasedAttempts -
        entry.attemptsUsed,
    };
  },

  async purchaseAttemptPack(userId: string, leagueId: string) {
    const { myTeam, matchday, league } = await this.requireActiveParticipation(
      userId,
      leagueId,
    );
    const leagueConfig = await getLeagueConfig();

    const entry = await prisma.matchdayEntry.findUnique({
      where: {
        matchdayId_teamId: { matchdayId: matchday.id, teamId: myTeam.id },
      },
    });
    if (!entry) throwError(StatusCodes.BAD_REQUEST, "No matchday entry found");

    // If Stripe is configured, create a checkout session
    if (config.stripe.secretKey) {
      const checkout = await StripeService.createCheckoutSession({
        userId,
        leagueId,
        packSize: leagueConfig.packSize,
        priceCents: leagueConfig.packPriceCents,
        leagueName: league.name,
      });
      return {
        requiresPayment: true,
        checkoutUrl: checkout.url,
        sessionId: checkout.sessionId,
        packSize: leagueConfig.packSize,
        priceCents: leagueConfig.packPriceCents,
      };
    }

    // No Stripe configured — grant immediately (dev mode)
    await prisma.matchdayEntry.update({
      where: { id: entry.id },
      data: {
        purchasedAttempts: entry.purchasedAttempts + leagueConfig.packSize,
      },
    });

    return {
      requiresPayment: false,
      purchased: leagueConfig.packSize,
      priceCents: leagueConfig.packPriceCents,
      totalAttemptsLeft:
        entry.attemptsUsed +
        (leagueConfig.freeAttempts - entry.freeAttemptsUsed) +
        (entry.adGranted ? leagueConfig.adAttempts - entry.adAttemptsUsed : 0) +
        entry.purchasedAttempts +
        leagueConfig.packSize -
        entry.attemptsUsed,
    };
  },

  async startAttempt(userId: string, leagueId: string) {
    const { myTeam, matchday } = await this.requireActiveParticipation(
      userId,
      leagueId,
    );
    const leagueConfig = await getLeagueConfig();

    const entry = await prisma.matchdayEntry.findUnique({
      where: {
        matchdayId_teamId: { matchdayId: matchday.id, teamId: myTeam.id },
      },
    });
    if (!entry) throwError(StatusCodes.BAD_REQUEST, "No matchday entry found");

    const eligibility = attemptsEligibility(
      {
        teamId: myTeam.id,
        attemptsUsed: entry.attemptsUsed,
        freeAttemptsUsed: entry.freeAttemptsUsed,
        adAttemptsUsed: entry.adAttemptsUsed,
        adGranted: entry.adGranted,
        purchasedAttempts: entry.purchasedAttempts,
        purchasedAttemptsUsed: entry.purchasedAttemptsUsed,
        bestGoals: entry.bestGoals,
      },
      leagueConfig,
    );

    if (!eligibility.allowed) {
      throwError(
        StatusCodes.FORBIDDEN,
        "No attempts remaining for this matchday",
      );
    }

    // Find the match for this team in the matchday
    let match = await prisma.leagueMatch.findFirst({
      where: {
        matchdayId: matchday.id,
        OR: [{ homeTeamId: myTeam.id }, { awayTeamId: myTeam.id }],
      },
    });

    if (!match) {
      // Create a solo matchday match if none exists
      match = await prisma.leagueMatch.create({
        data: {
          matchdayId: matchday.id,
          homeTeamId: myTeam.id,
          awayTeamId: myTeam.id,
          status: "IN_PLAY",
        },
      });
    } else if (match.status === "PENDING") {
      await prisma.leagueMatch.update({
        where: { id: match.id },
        data: { status: "IN_PLAY" },
      });
    }

    const bucket = nextAttemptBucket(
      {
        teamId: myTeam.id,
        attemptsUsed: entry.attemptsUsed,
        freeAttemptsUsed: entry.freeAttemptsUsed,
        adAttemptsUsed: entry.adAttemptsUsed,
        adGranted: entry.adGranted,
        purchasedAttempts: entry.purchasedAttempts,
        purchasedAttemptsUsed: entry.purchasedAttemptsUsed,
        bestGoals: entry.bestGoals,
      },
      leagueConfig,
    );

    const updatedEntry = await prisma.matchdayEntry.update({
      where: { id: entry.id },
      data: {
        attemptsUsed: entry.attemptsUsed + 1,
        freeAttemptsUsed: entry.freeAttemptsUsed + (bucket === "free" ? 1 : 0),
        adAttemptsUsed: entry.adAttemptsUsed + (bucket === "ad" ? 1 : 0),
        purchasedAttemptsUsed:
          entry.purchasedAttemptsUsed + (bucket === "purchased" ? 1 : 0),
        lastAttemptAt: new Date(),
      },
    });

    const game = await prisma.game.create({
      data: {
        type: "SOLO",
        status: "ACTIVE",
        player1Id: userId,
        player2Id: userId,
        startedAt: new Date(),
      },
    });

    const attempt = await prisma.leagueAttempt.create({
      data: {
        matchId: match.id,
        teamId: myTeam.id,
        attemptNumber: updatedEntry.attemptsUsed,
        goals: 0,
      },
    });

    await prisma.matchdayEntry.update({
      where: { id: entry.id },
      data: { activeGameId: game.id },
    });

    announceActivity(
      leagueId,
      `${myTeam.name} started attempt #${attempt.attemptNumber} in Matchday #${matchday.number}`,
      { teamId: myTeam.id, attemptNumber: attempt.attemptNumber },
    );

    return {
      attemptId: attempt.id,
      gameId: game.id,
      matchId: match.id,
      attemptNumber: attempt.attemptNumber,
      matchdayNumber: matchday.number,
      attemptsUsed: updatedEntry.attemptsUsed,
      remainingAttempts: eligibility.total - updatedEntry.attemptsUsed,
      bestGoals: updatedEntry.bestGoals,
    };
  },

  async recordHit(
    userId: string,
    leagueId: string,
    input: {
      gameId?: string;
      attemptId?: string;
      stopwatchValueMs: number;
      turnNumber?: number;
    },
  ) {
    const { myTeam, matchday } = await this.requireActiveParticipation(
      userId,
      leagueId,
    );

    const entry = await prisma.matchdayEntry.findUnique({
      where: {
        matchdayId_teamId: { matchdayId: matchday.id, teamId: myTeam.id },
      },
    });
    if (!entry) throwError(StatusCodes.BAD_REQUEST, "No matchday entry found");

    let gameId: string | undefined =
      input.gameId ?? (entry.activeGameId || undefined);
    let attempt: {
      id: string;
      goals: number;
      matchId: string;
      attemptNumber: number;
    } | null = null;

    if (input.attemptId) {
      attempt = await prisma.leagueAttempt.findUnique({
        where: { id: input.attemptId },
      });
    }

    if (!attempt) {
      attempt = await prisma.leagueAttempt.findFirst({
        where: {
          teamId: myTeam.id,
          match: { matchdayId: matchday.id },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!gameId && attempt) {
      const activeGame = await prisma.game.findFirst({
        where: {
          player1Id: userId,
          type: "SOLO",
          status: "ACTIVE",
        },
        orderBy: { createdAt: "desc" },
      });
      gameId = activeGame?.id;
    }

    if (!gameId) {
      const game = await prisma.game.create({
        data: {
          type: "SOLO",
          status: "ACTIVE",
          player1Id: userId,
          player2Id: userId,
          startedAt: new Date(),
        },
      });
      gameId = game.id;
    }

    const result = evaluateStopwatch(input.stopwatchValueMs);

    await prisma.gameEvent.create({
      data: {
        gameId,
        playerId: userId,
        type: result.eventType,
        turnNumber: input.turnNumber ?? 1,
        stopwatchValueMs: input.stopwatchValueMs,
        matched: result.goal,
        selectedValue: result.subGame?.type ?? null,
      },
    });

    let currentGoals = attempt?.goals ?? 0;

    if (result.goal) {
      currentGoals += 1;

      if (attempt) {
        await prisma.leagueAttempt.update({
          where: { id: attempt.id },
          data: { goals: currentGoals },
        });
      }

      await prisma.game.update({
        where: { id: gameId },
        data: { player1Score: { increment: 1 } },
      });

      if (currentGoals > entry.bestGoals) {
        await prisma.matchdayEntry.update({
          where: { id: entry.id },
          data: { bestGoals: currentGoals },
        });
      }
    }

    // Resolve match and opponent
    const match = attempt?.matchId
      ? await prisma.leagueMatch.findUnique({
          where: { id: attempt.matchId },
        })
      : await prisma.leagueMatch.findFirst({
          where: {
            matchdayId: matchday.id,
            OR: [{ homeTeamId: myTeam.id }, { awayTeamId: myTeam.id }],
          },
        });

    const opponentTeamId = match
      ? match.homeTeamId === myTeam.id
        ? match.awayTeamId
        : match.homeTeamId
      : null;

    return {
      eventType: result.eventType,
      goal: result.goal,
      stopwatchValueMs: input.stopwatchValueMs,
      currentScore: currentGoals,
      subGame: result.subGame ?? null,
      bestGoals: Math.max(entry.bestGoals, currentGoals),
      attemptId: attempt?.id ?? null,
      gameId,
      matchId: match?.id ?? null,
      leagueId,
      teamId: myTeam.id,
      scoringTeamId: myTeam.id,
      opponentTeamId,
      scoringPlayerId: userId,
      canSaveGoal: result.goal,
    };
  },

  async recordSubHit(
    userId: string,
    leagueId: string,
    input: {
      gameId?: string;
      attemptId?: string;
      subGameType: "FREE_KICK" | "PENALTY" | "CORNER";
      selection: string | number | boolean;
      stopwatchValueMs: number;
      turnNumber?: number;
    },
  ) {
    const { myTeam, matchday } = await this.requireActiveParticipation(
      userId,
      leagueId,
    );

    const entry = await prisma.matchdayEntry.findUnique({
      where: {
        matchdayId_teamId: { matchdayId: matchday.id, teamId: myTeam.id },
      },
    });
    if (!entry) throwError(StatusCodes.BAD_REQUEST, "No matchday entry found");

    let gameId: string | undefined =
      input.gameId ?? (entry.activeGameId || undefined);
    const attempt = input.attemptId
      ? await prisma.leagueAttempt.findUnique({
          where: { id: input.attemptId },
        })
      : await prisma.leagueAttempt.findFirst({
          where: { teamId: myTeam.id, match: { matchdayId: matchday.id } },
          orderBy: { createdAt: "desc" },
        });

    if (!gameId) {
      const activeGame = await prisma.game.findFirst({
        where: { player1Id: userId, type: "SOLO", status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      });
      gameId = activeGame?.id;
    }

    if (!gameId) {
      const game = await prisma.game.create({
        data: {
          type: "SOLO",
          status: "ACTIVE",
          player1Id: userId,
          player2Id: userId,
          startedAt: new Date(),
        },
      });
      gameId = game.id;
    }

    let goal = false;
    let eventType: GameEventType = "MISS";

    switch (input.subGameType) {
      case "FREE_KICK": {
        const digit = parseInt(String(input.selection), 10);
        goal = evaluateNumberGuess(digit, input.stopwatchValueMs);
        eventType = goal ? "FREE_KICK_GOAL" : "FREE_KICK_MISS";
        break;
      }
      case "PENALTY": {
        const even =
          input.selection === true ||
          input.selection === "true" ||
          input.selection === "even";
        goal = evaluateEvenOdd(even, input.stopwatchValueMs);
        eventType = goal ? "PENALTY_GOAL" : "PENALTY_MISS";
        break;
      }
      case "CORNER": {
        const guess = parseInt(String(input.selection), 10);
        goal = evaluateCornerGuess(guess, input.stopwatchValueMs);
        eventType = goal ? "CORNER_GOAL" : "CORNER_MISS";
        break;
      }
    }

    await prisma.gameEvent.create({
      data: {
        gameId,
        playerId: userId,
        type: eventType,
        turnNumber: input.turnNumber ?? 1,
        stopwatchValueMs: input.stopwatchValueMs,
        matched: goal,
        selectedValue: String(input.selection),
      },
    });

    let currentGoals = attempt?.goals ?? 0;

    if (goal) {
      currentGoals += 1;

      if (attempt) {
        await prisma.leagueAttempt.update({
          where: { id: attempt.id },
          data: { goals: currentGoals },
        });
      }

      await prisma.game.update({
        where: { id: gameId },
        data: { player1Score: { increment: 1 } },
      });

      if (currentGoals > entry.bestGoals) {
        await prisma.matchdayEntry.update({
          where: { id: entry.id },
          data: { bestGoals: currentGoals },
        });
      }
    }

    // Resolve match and opponent
    const match = attempt?.matchId
      ? await prisma.leagueMatch.findUnique({
          where: { id: attempt.matchId },
        })
      : await prisma.leagueMatch.findFirst({
          where: {
            matchdayId: matchday.id,
            OR: [{ homeTeamId: myTeam.id }, { awayTeamId: myTeam.id }],
          },
        });

    const opponentTeamId = match
      ? match.homeTeamId === myTeam.id
        ? match.awayTeamId
        : match.homeTeamId
      : null;

    return {
      eventType,
      goal,
      stopwatchValueMs: input.stopwatchValueMs,
      currentScore: currentGoals,
      bestGoals: Math.max(entry.bestGoals, currentGoals),
      attemptId: attempt?.id ?? null,
      gameId,
      matchId: match?.id ?? null,
      leagueId,
      teamId: myTeam.id,
      scoringTeamId: myTeam.id,
      opponentTeamId,
      scoringPlayerId: userId,
      canSaveGoal: goal,
    };
  },

  async finishAttempt(
    userId: string,
    leagueId: string,
    input?: { gameId?: string; attemptId?: string; goals?: number },
  ) {
    const { myTeam, matchday } = await this.requireActiveParticipation(
      userId,
      leagueId,
    );

    const entry = await prisma.matchdayEntry.findUnique({
      where: {
        matchdayId_teamId: { matchdayId: matchday.id, teamId: myTeam.id },
      },
    });
    if (!entry) throwError(StatusCodes.BAD_REQUEST, "No matchday entry found");

    const gameId = input?.gameId ?? entry.activeGameId;

    if (gameId) {
      await prisma.game.update({
        where: { id: gameId },
        data: { status: "FINISHED", endedAt: new Date() },
      });
    }

    let attempt = input?.attemptId
      ? await prisma.leagueAttempt.findUnique({
          where: { id: input.attemptId },
        })
      : await prisma.leagueAttempt.findFirst({
          where: { teamId: myTeam.id, match: { matchdayId: matchday.id } },
          orderBy: { createdAt: "desc" },
        });

    const finalGoals = input?.goals ?? attempt?.goals ?? 0;

    if (
      attempt &&
      input?.goals !== undefined &&
      input.goals !== attempt.goals
    ) {
      attempt = await prisma.leagueAttempt.update({
        where: { id: attempt.id },
        data: { goals: input.goals },
      });
    }

    const newBestGoals = Math.max(entry.bestGoals, finalGoals);

    await prisma.matchdayEntry.update({
      where: { id: entry.id },
      data: {
        activeGameId: null,
        bestGoals: newBestGoals,
      },
    });

    announceActivity(
      leagueId,
      `${myTeam.name} scored ${finalGoals} goal(s) on Matchday #${matchday.number}`,
      { teamId: myTeam.id, goals: finalGoals, bestGoals: newBestGoals },
    );

    return {
      attemptId: attempt?.id ?? null,
      gameId: gameId ?? null,
      goals: finalGoals,
      bestGoals: newBestGoals,
      attemptNumber: attempt?.attemptNumber ?? entry.attemptsUsed,
      matchdayNumber: matchday.number,
    };
  },

  async getAttemptHistory(
    userId: string,
    leagueId: string,
    matchdayNumber?: number,
  ) {
    const myTeam = await prisma.leagueTeam.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    });
    if (!myTeam)
      throwError(StatusCodes.FORBIDDEN, "You are not in this league");

    const matchWhere = matchdayNumber
      ? { matchday: { leagueId, number: matchdayNumber } }
      : { matchday: { leagueId } };

    const attempts = await prisma.leagueAttempt.findMany({
      where: {
        teamId: myTeam.id,
        match: matchWhere,
      },
      orderBy: { createdAt: "desc" },
      include: {
        match: {
          include: {
            matchday: {
              select: { number: true, opensAt: true, closesAt: true },
            },
          },
        },
      },
    });

    return attempts.map((a) => ({
      id: a.id,
      attemptNumber: a.attemptNumber,
      goals: a.goals,
      matchdayNumber: a.match.matchday.number,
      createdAt: a.createdAt,
    }));
  },

  async saveGoal(
    userId: string,
    input: {
      leagueId?: string;
      matchdayId?: string;
      matchId?: string;
      gameId?: string;
      attemptId?: string;
      scoringTeamId?: string;
      opponentTeamId?: string;
      scoringPlayerId?: string;
      clientGoalId?: string;
      eventType?: GameEventType;
      stopwatchValueMs?: number;
      score?: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    let leagueId = input.leagueId;
    let matchId = input.matchId;
    const attemptId = input.attemptId;
    let matchdayId = input.matchdayId;
    let scoringTeamId = input.scoringTeamId;
    let opponentTeamId = input.opponentTeamId;

    // 1. Resolve attempt, match, league, and team context
    if (attemptId) {
      const attempt = await prisma.leagueAttempt.findUnique({
        where: { id: attemptId },
        include: {
          match: {
            include: {
              matchday: true,
              homeTeam: true,
              awayTeam: true,
            },
          },
          team: true,
        },
      });
      if (attempt) {
        matchId = matchId || attempt.matchId;
        matchdayId = matchdayId || attempt.match.matchdayId;
        leagueId = leagueId || attempt.match.matchday.leagueId;
        scoringTeamId = scoringTeamId || attempt.teamId;
        if (!opponentTeamId) {
          opponentTeamId =
            attempt.match.homeTeamId === attempt.teamId
              ? attempt.match.awayTeamId
              : attempt.match.homeTeamId;
        }
      }
    }

    if (leagueId && !scoringTeamId) {
      const myTeam = await prisma.leagueTeam.findUnique({
        where: { leagueId_userId: { leagueId, userId } },
      });
      if (myTeam) {
        scoringTeamId = myTeam.id;
      }
    }

    if (!matchId && leagueId && scoringTeamId) {
      const match = await prisma.leagueMatch.findFirst({
        where: {
          matchday: {
            leagueId,
            ...(matchdayId ? { id: matchdayId } : { status: "OPEN" }),
          },
          OR: [{ homeTeamId: scoringTeamId }, { awayTeamId: scoringTeamId }],
        },
        include: { matchday: true },
      });
      if (match) {
        matchId = match.id;
        matchdayId = matchdayId || match.matchdayId;
        if (!opponentTeamId) {
          opponentTeamId =
            match.homeTeamId === scoringTeamId
              ? match.awayTeamId
              : match.homeTeamId;
        }
      }
    }

    // 2. Prevent accidental duplicate goal submissions
    const duplicateWhere: any = {
      userId,
    };
    if (attemptId && input.stopwatchValueMs !== undefined) {
      duplicateWhere.attemptId = attemptId;
      duplicateWhere.stopwatchValueMs = input.stopwatchValueMs;
    } else if (attemptId && input.eventType) {
      duplicateWhere.attemptId = attemptId;
      duplicateWhere.eventType = input.eventType;
    }

    if (duplicateWhere.attemptId) {
      const existing = await prisma.savedGoal.findFirst({
        where: duplicateWhere,
      });
      if (existing) {
        return {
          ...existing,
          scoringTeamId,
          opponentTeamId,
          matchId,
          alreadySaved: true,
        };
      }
    }

    const mergedMetadata = {
      ...(input.metadata ?? {}),
      scoringTeamId,
      opponentTeamId,
      scoringPlayerId: userId,
      matchId,
      clientGoalId: input.clientGoalId,
    };

    // 3. Create SavedGoal record
    const savedGoal = await prisma.savedGoal.create({
      data: {
        userId,
        leagueId: leagueId ?? null,
        matchdayId: matchdayId ?? null,
        matchId: matchId ?? null,
        gameId: input.gameId ?? null,
        attemptId: attemptId ?? null,
        scoringTeamId: scoringTeamId ?? null,
        opponentTeamId: opponentTeamId ?? null,
        eventType: input.eventType ?? "DIRECT_GOAL",
        stopwatchValueMs: input.stopwatchValueMs ?? null,
        score: input.score ?? 1,
        metadata: mergedMetadata as any,
      },
    });

    let updatedMatchResult: any = null;

    // 4. Update match scores and matchday entry if connected to a league match
    if (matchId && scoringTeamId) {
      const match = await prisma.leagueMatch.findUnique({
        where: { id: matchId },
      });
      if (match) {
        const isHome = match.homeTeamId === scoringTeamId;
        const newHomeGoals = isHome
          ? (match.homeGoals ?? 0) + (input.score ?? 1)
          : (match.homeGoals ?? 0);
        const newAwayGoals = !isHome
          ? (match.awayGoals ?? 0) + (input.score ?? 1)
          : (match.awayGoals ?? 0);

        const winnerTeamId =
          newHomeGoals > newAwayGoals
            ? match.homeTeamId
            : newAwayGoals > newHomeGoals
              ? match.awayTeamId
              : null;

        const updatedMatch = await prisma.leagueMatch.update({
          where: { id: matchId },
          data: {
            homeGoals: newHomeGoals,
            awayGoals: newAwayGoals,
            status: match.status === "PENDING" ? "IN_PLAY" : match.status,
            winnerTeamId,
          },
        });

        updatedMatchResult = {
          matchId: updatedMatch.id,
          homeTeamId: updatedMatch.homeTeamId,
          awayTeamId: updatedMatch.awayTeamId,
          homeGoals: updatedMatch.homeGoals,
          awayGoals: updatedMatch.awayGoals,
          winnerTeamId: updatedMatch.winnerTeamId,
          status: updatedMatch.status,
          isDraw: newHomeGoals === newAwayGoals,
        };

        if (matchdayId) {
          const entry = await prisma.matchdayEntry.findUnique({
            where: {
              matchdayId_teamId: {
                matchdayId,
                teamId: scoringTeamId,
              },
            },
          });
          if (entry) {
            const teamNewScore = isHome ? newHomeGoals : newAwayGoals;
            await prisma.matchdayEntry.update({
              where: { id: entry.id },
              data: {
                bestGoals: Math.max(entry.bestGoals, teamNewScore),
              },
            });
          }
        }
      }
    }

    return {
      ...savedGoal,
      scoringTeamId,
      opponentTeamId,
      matchId,
      matchResult: updatedMatchResult,
      alreadySaved: false,
    };
  },

  async getSavedGoals(userId: string, leagueId?: string) {
    return prisma.savedGoal.findMany({
      where: {
        userId,
        ...(leagueId ? { leagueId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async deleteSavedGoal(userId: string, goalId: string) {
    const existing = await prisma.savedGoal.findUnique({
      where: { id: goalId },
    });
    if (!existing) throwError(StatusCodes.NOT_FOUND, "Saved goal not found");
    if (existing.userId !== userId) {
      throwError(StatusCodes.FORBIDDEN, "You do not own this saved goal");
    }

    await prisma.savedGoal.delete({ where: { id: goalId } });

    return { id: goalId, deleted: true };
  },

  async requireActiveParticipation(userId: string, leagueId: string) {
    const league = await prisma.league.findUnique({ where: { id: leagueId } });
    if (!league) throwError(StatusCodes.NOT_FOUND, "League not found");
    if (league.status !== "ACTIVE") {
      throwError(StatusCodes.CONFLICT, "League is not active");
    }

    const myTeam = await prisma.leagueTeam.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    });
    if (!myTeam)
      throwError(StatusCodes.FORBIDDEN, "You are not in this league");

    const matchday = await prisma.matchday.findFirst({
      where: { leagueId, status: "OPEN" },
      orderBy: { number: "asc" },
    });
    if (!matchday) {
      throwError(StatusCodes.CONFLICT, "No matchday is currently open");
    }

    return { league, myTeam, matchday };
  },
};
