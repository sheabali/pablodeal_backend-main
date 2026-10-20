import type { Request, Response } from "express";

import { prisma } from "@/core/database";
import { sendResponse } from "@/core/utils";
import { catchAsync } from "@/core/utils/catch-async";
import { RankedService } from "./ranked.service";

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const profile = await RankedService.getOrCreateProfile(userId);

  sendResponse.ok(res, "Ranked profile", {
    division: profile.division,
    divisionName: RankedService.divisionName(profile.division),
    rp: profile.rp,
    highestDivision: profile.highestDivision,
    highestDivisionName: RankedService.divisionName(profile.highestDivision),
    promotionShield: profile.promotionShield,
    placementMatchesPlayed: profile.placementMatchesPlayed,
    placementTotal: profile.placementTotal,
    range: RankedService.rpRange(profile.division),
  });
});

export const getLeaderboard = catchAsync(
  async (_req: Request, res: Response) => {
    const profiles = await prisma.rankedProfile.findMany({
      orderBy: { rp: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const leaderboard = profiles.map((p, i) => ({
      rank: i + 1,
      userId: p.userId,
      name: p.user.name ?? "Anonymous",
      division: p.division,
      divisionName: RankedService.divisionName(p.division),
      rp: p.rp,
    }));

    sendResponse.ok(res, "Leaderboard", leaderboard);
  },
);

export const getMatchHistory = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const games = await prisma.game.findMany({
      where: {
        OR: [{ player1Id: userId }, { player2Id: userId }],
        status: "FINISHED",
      },
      orderBy: { endedAt: "desc" },
      take: 20,
      include: {
        player1: { select: { id: true, name: true } },
        player2: { select: { id: true, name: true } },
      },
    });

    const history = games.map((g) => ({
      id: g.id,
      type: g.type,
      opponent:
        g.player1Id === userId
          ? (g.player2.name ?? "Unknown")
          : (g.player1.name ?? "Unknown"),
      opponentId: g.player1Id === userId ? g.player2Id : g.player1Id,
      won: g.winnerId === userId,
      player1Score: g.player1Score,
      player2Score: g.player2Score,
      endedAt: g.endedAt,
    }));

    sendResponse.ok(res, "Match history", history);
  },
);

export const getActiveSeason = catchAsync(
  async (_req: Request, res: Response) => {
    const season = await prisma.season.findFirst({
      where: { active: true },
    });

    if (!season) {
      sendResponse.ok(res, "No active season", null);
      return;
    }

    sendResponse.ok(res, "Active season", {
      id: season.id,
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
    });
  },
);

export const getStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  let stats = await prisma.playerStats.findUnique({
    where: { userId },
  });

  if (!stats) {
    stats = await prisma.playerStats.create({
      data: { userId },
    });
  }

  sendResponse.ok(res, "Player stats", {
    gamesPlayed: stats.gamesPlayed,
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    goals: stats.goals,
  });
});
