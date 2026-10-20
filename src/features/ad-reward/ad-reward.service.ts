import { prisma } from "@/core/database";
import { StatusCodes } from "@/core/constants";
import { throwError } from "@/core/utils/app-error";
import { logger } from "@/core/logger";
import { getLeagueConfig } from "@/features/league/league.config";

export interface VerifyAdRewardInput {
  userId: string;
  leagueId: string;
  adProvider: string;
  adImpressionId: string;
}

export const AdRewardService = {
  async verifyAndGrant(input: VerifyAdRewardInput) {
    const { userId, leagueId, adProvider, adImpressionId } = input;

    const team = await prisma.leagueTeam.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    });
    if (!team) {
      throwError(StatusCodes.FORBIDDEN, "You are not a member of this league");
    }

    const matchday = await prisma.matchday.findFirst({
      where: { leagueId, status: "OPEN" },
    });
    if (!matchday) {
      throwError(StatusCodes.CONFLICT, "No matchday is currently open");
    }

    const config = await getLeagueConfig();

    const entry = await prisma.matchdayEntry.findUnique({
      where: {
        matchdayId_teamId: { matchdayId: matchday.id, teamId: team.id },
      },
    });
    if (!entry) {
      throwError(StatusCodes.BAD_REQUEST, "No matchday entry found");
    }

    if (entry.adGranted || entry.adAttemptsUsed >= config.adAttempts) {
      throwError(
        StatusCodes.CONFLICT,
        "Ad reward already claimed this matchday",
      );
    }

    // In production: verify with ad provider (AdMob, Unity Ads, etc.)
    // For now, trust the client and log the impression ID
    logger.info("Ad reward verified", {
      userId,
      leagueId,
      adProvider,
      adImpressionId,
    });

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
};
