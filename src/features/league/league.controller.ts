import type { Request, Response } from "express";

import { StatusCodes } from "@/core/constants";
import { prisma } from "@/core/database";
import { sendResponse } from "@/core/utils";
import { throwError } from "@/core/utils/app-error";
import { catchAsync } from "@/core/utils/catch-async";

import { LeagueService } from "./league.service";

function minutesFromTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export const createLeague = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { name, startDate, matchdayStartTime } = req.body;

  const league = await LeagueService.createLeague(userId, {
    name,
    startDate,
    matchdayStartMinutes: minutesFromTime(matchdayStartTime),
  });

  sendResponse.created(res, "League created", {
    id: league.id,
    name: league.name,
    inviteCode: league.inviteCode,
    inviteLink: league.inviteLink,
    status: league.status,
    startDate: league.startDate,
    matchdayStartTime: matchdayStartTime,
  });
});

export const joinLeague = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { code, teamName, crestUrl } = req.body;

  const result = await LeagueService.joinLeague(userId, {
    code,
    teamName,
    crestUrl,
  });

  sendResponse.created(res, "Joined league", result);
});

export const listLeagues = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const leagues = await LeagueService.listLeaguesForUser(userId);
  sendResponse.ok(res, "My leagues", leagues);
});

export const getLeague = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const leagueId = String(req.params["leagueId"]);
  const result = await LeagueService.getLeagueForUser(userId, leagueId);
  sendResponse.ok(res, "League", result);
});

export const listTeams = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const leagueId = String(req.params["leagueId"]);
  await assertMember(userId, leagueId);
  const teams = await LeagueService.listTeams(leagueId);
  sendResponse.ok(res, "Teams", teams);
});

export const startLeague = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const leagueId = String(req.params["leagueId"]);
  const result = await LeagueService.startLeague(userId, leagueId);
  sendResponse.ok(res, "League started", result);
});

export const getStandings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const leagueId = String(req.params["leagueId"]);
  const live = req.query["live"] === "true";
  await assertMember(userId, leagueId);
  const result = await LeagueService.getStandings(leagueId, live);
  sendResponse.ok(res, "Standings", result);
});

export const getSchedule = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const leagueId = String(req.params["leagueId"]);
  await assertMember(userId, leagueId);
  const schedule = await LeagueService.getSchedule(leagueId);
  sendResponse.ok(res, "Schedule", schedule);
});

export const getCurrent = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const leagueId = String(req.params["leagueId"]);
  const result = await LeagueService.getCurrentMatchday(leagueId, userId);
  sendResponse.ok(res, "Current matchday", result);
});

export const getMatchday = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const leagueId = String(req.params["leagueId"]);
  const number = Number(req.params["number"]);
  await assertMember(userId, leagueId);
  const result = await LeagueService.getMatchday(leagueId, number);
  sendResponse.ok(res, "Matchday", result);
});

export const getMatchdayLive = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const leagueId = String(req.params["leagueId"]);
    await assertMember(userId, leagueId);
    const result = await LeagueService.getMatchdayLive(leagueId);
    sendResponse.ok(res, "Matchday live", result);
  },
);

export const grantAdAttempt = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const leagueId = String(req.params["leagueId"]);
    const result = await LeagueService.grantAdAttempt(userId, leagueId);
    sendResponse.ok(res, "Ad attempt granted", result);
  },
);

export const purchaseAttemptPack = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const leagueId = String(req.params["leagueId"]);
    const result = await LeagueService.purchaseAttemptPack(userId, leagueId);

    const checkoutUrl = (result as any).checkoutUrl || (result as any).url;

    const shouldRedirect =
      req.query["redirect"] === "true" ||
      req.query["redirect"] === "1" ||
      req.body?.redirect === true ||
      (req.method === "GET" && req.query["redirect"] !== "false");

    if (shouldRedirect && checkoutUrl) {
      return res.redirect(303, checkoutUrl);
    }

    sendResponse.ok(res, "Attempt pack purchase initialized", {
      ...result,
      checkoutUrl,
      url: checkoutUrl,
    });
  },
);

export const startAttempt = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const leagueId = String(req.params["leagueId"]);
  const result = await LeagueService.startAttempt(userId, leagueId);
  sendResponse.created(res, "Attempt started", result);
});

export const recordHit = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const leagueId = String(req.params["leagueId"]);
  const { gameId, attemptId, stopwatchValueMs, turnNumber } = req.body;

  const result = await LeagueService.recordHit(userId, leagueId, {
    gameId,
    attemptId,
    stopwatchValueMs: Number(stopwatchValueMs),
    turnNumber: turnNumber !== undefined ? Number(turnNumber) : undefined,
  });

  sendResponse.ok(res, "Hit recorded", result);
});

export const recordSubHit = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const leagueId = String(req.params["leagueId"]);
  const {
    gameId,
    attemptId,
    subGameType,
    selection,
    stopwatchValueMs,
    turnNumber,
  } = req.body;

  const result = await LeagueService.recordSubHit(userId, leagueId, {
    gameId,
    attemptId,
    subGameType,
    selection,
    stopwatchValueMs: Number(stopwatchValueMs),
    turnNumber: turnNumber !== undefined ? Number(turnNumber) : undefined,
  });

  sendResponse.ok(res, "Sub-game hit recorded", result);
});

export const finishAttempt = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const leagueId = String(req.params["leagueId"]);
  const { gameId, attemptId, goals } = req.body;

  const result = await LeagueService.finishAttempt(userId, leagueId, {
    gameId,
    attemptId,
    goals: goals !== undefined ? Number(goals) : undefined,
  });

  sendResponse.ok(res, "Attempt finished", result);
});

export const getAttemptHistory = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const leagueId = String(req.params["leagueId"]);
    const matchdayNumber = req.query["matchday"]
      ? Number(req.query["matchday"])
      : undefined;

    const history = await LeagueService.getAttemptHistory(
      userId,
      leagueId,
      matchdayNumber,
    );

    sendResponse.ok(res, "Attempt history", history);
  },
);

export const saveGoal = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const leagueId = req.params["leagueId"]
    ? String(req.params["leagueId"])
    : req.body?.leagueId;

  const {
    matchdayId,
    matchId,
    gameId,
    attemptId,
    scoringTeamId,
    opponentTeamId,
    scoringPlayerId,
    clientGoalId,
    eventType,
    stopwatchValueMs,
    score,
    metadata,
  } = req.body;

  const saved = await LeagueService.saveGoal(userId, {
    leagueId,
    matchdayId,
    matchId,
    gameId,
    attemptId,
    scoringTeamId,
    opponentTeamId,
    scoringPlayerId,
    clientGoalId,
    eventType,
    stopwatchValueMs:
      stopwatchValueMs !== undefined ? Number(stopwatchValueMs) : undefined,
    score: score !== undefined ? Number(score) : 1,
    metadata,
  });

  sendResponse.created(res, "Goal saved successfully", saved);
});

export const getSavedGoals = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const leagueId = req.params["leagueId"]
    ? String(req.params["leagueId"])
    : (req.query["leagueId"] as string | undefined);

  const saved = await LeagueService.getSavedGoals(userId, leagueId);
  sendResponse.ok(res, "Saved goals", saved);
});

export const deleteSavedGoal = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const goalId = String(req.params["goalId"]);

    const result = await LeagueService.deleteSavedGoal(userId, goalId);
    sendResponse.ok(res, "Saved goal removed", result);
  },
);

export const getConfig = catchAsync(async (_req: Request, res: Response) => {
  const config = await LeagueService.getConfig();
  sendResponse.ok(res, "League config", config);
});

export const updateConfig = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const existing =
    (await prisma.leagueConfig.findUnique({ where: { id: "default" } })) ??
    (await prisma.leagueConfig.create({ data: { id: "default" } }));

  const updated = await prisma.leagueConfig.update({
    where: { id: existing.id },
    data,
  });

  sendResponse.ok(res, "League config updated", updated);
});

async function assertMember(userId: string, leagueId: string) {
  const league = await prisma.league.findUnique({ where: { id: leagueId } });
  if (!league) throwError(StatusCodes.NOT_FOUND, "League not found");

  const isAdmin = league.adminId === userId;
  if (isAdmin) return;

  const team = await prisma.leagueTeam.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
  });
  if (!team)
    throwError(StatusCodes.FORBIDDEN, "You are not a member of this league");
}
