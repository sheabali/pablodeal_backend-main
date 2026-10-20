import { prisma } from "@/core/database";
import {
  calculateDivision,
  MAX_SHIELD,
  PLACEMENT_MATCHES,
} from "@/features/game/game.types";

export const RankedService = {
  async getOrCreateProfile(userId: string) {
    let profile = await prisma.rankedProfile.findUnique({
      where: { userId },
      include: { season: true },
    });

    if (!profile) {
      const activeSeason = await prisma.season.findFirst({
        where: { active: true },
      });
      profile = await prisma.rankedProfile.create({
        data: {
          userId,
          seasonId: activeSeason?.id ?? null,
        },
        include: { season: true },
      });
    }

    return profile;
  },

  divisionName(division: number): string {
    const names: Record<number, string> = {
      10: "Rookie",
      9: "Beginner",
      8: "Novice",
      7: "Amateur",
      6: "Competitor",
      5: "Advanced",
      4: "Expert",
      3: "Professional",
      2: "Champion",
      1: "Legend",
    };
    return names[division] ?? "Unknown";
  },

  rpRange(division: number): { min: number; max: number } {
    if (division <= 1) return { min: 900, max: 999 };
    return {
      min: (10 - division) * 100,
      max: (10 - division) * 100 + 99,
    };
  },

  async applyMatchResult(
    winnerId: string,
    loserId: string,
    winnerDiv: number,
    loserDiv: number,
  ): Promise<{
    winnerRpChange: number;
    loserRpChange: number;
    winnerPromoted: boolean;
    loserRelegated: boolean;
  }> {
    const winnerProfile = await this.getOrCreateProfile(winnerId);
    const loserProfile = await this.getOrCreateProfile(loserId);

    const isPlacement =
      winnerProfile.placementMatchesPlayed < PLACEMENT_MATCHES ||
      loserProfile.placementMatchesPlayed < PLACEMENT_MATCHES;

    let winnerRpChange: number;
    let loserRpChange: number;

    if (isPlacement) {
      winnerRpChange = loserDiv < winnerDiv ? 40 : 25;
      loserRpChange = 0;
    } else {
      const diff = loserDiv - winnerDiv;
      if (diff > 0) {
        winnerRpChange = 30;
        loserRpChange = -15;
      } else if (diff < 0) {
        winnerRpChange = 20;
        loserRpChange = -25;
      } else {
        winnerRpChange = 25;
        loserRpChange = -20;
      }
    }

    const newWinnerRp = Math.max(
      0,
      Math.min(999, winnerProfile.rp + winnerRpChange),
    );
    const newLoserRp = Math.max(
      0,
      Math.min(999, loserProfile.rp + loserRpChange),
    );

    const oldWinnerDiv = calculateDivision(winnerProfile.rp);
    const oldLoserDiv = calculateDivision(loserProfile.rp);
    const newWinnerDiv = calculateDivision(newWinnerRp);
    const newLoserDiv = calculateDivision(newLoserRp);

    const winnerPromoted = newWinnerDiv < oldWinnerDiv;
    const loserRelegated =
      newLoserDiv > oldLoserDiv && loserProfile.promotionShield <= 0;

    let winnerShield = winnerProfile.promotionShield;
    if (winnerPromoted) winnerShield = MAX_SHIELD;

    let loserShield = loserProfile.promotionShield;
    if (loserRelegated) loserShield = 0;
    else if (loserRpChange < 0) loserShield = Math.max(0, loserShield - 1);

    await prisma.rankedProfile.update({
      where: { userId: winnerId },
      data: {
        rp: newWinnerRp,
        division: newWinnerDiv,
        highestDivision: Math.min(winnerProfile.highestDivision, newWinnerDiv),
        promotionShield: winnerShield,
        placementMatchesPlayed: winnerProfile.placementMatchesPlayed + 1,
      },
    });

    await prisma.rankedProfile.update({
      where: { userId: loserId },
      data: {
        rp: newLoserRp,
        division: newLoserDiv,
        promotionShield: loserShield,
        placementMatchesPlayed: loserProfile.placementMatchesPlayed + 1,
      },
    });

    return {
      winnerRpChange,
      loserRpChange,
      winnerPromoted,
      loserRelegated,
    };
  },
};
