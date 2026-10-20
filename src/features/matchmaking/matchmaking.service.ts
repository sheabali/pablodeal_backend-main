import { redis } from "@/core/database/redis";
import { prisma } from "@/core/database";
import { logger } from "@/core/logger";
import { calculateDivision } from "@/features/game/game.types";

const RANKED_QUEUE = "matchmaking:ranked";

interface QueuedPlayer {
  userId: string;
  socketId: string;
  joinedAt: number;
}

export const MatchmakingService = {
  async joinRanked(
    userId: string,
    socketId: string,
  ): Promise<{ matched: boolean; gameId?: string; opponentId?: string }> {
    const profile = await prisma.rankedProfile.findUnique({
      where: { userId },
    });

    const rp = profile?.rp ?? 0;
    const division = profile?.division ?? calculateDivision(rp);

    const existing = await redis.zrangebyscore(
      RANKED_QUEUE,
      division - 1,
      division + 1,
      "LIMIT",
      0,
      1,
    );

    if (existing.length > 0 && existing[0]) {
      const opponentId = existing[0];
      await redis.zrem(RANKED_QUEUE, opponentId);

      const opponentData = await redis.get(`matchmaking:player:${opponentId}`);
      if (!opponentData) {
        await redis.zadd(RANKED_QUEUE, division, userId);
        await redis.set(
          `matchmaking:player:${userId}`,
          JSON.stringify({ userId, socketId, joinedAt: Date.now() }),
          "EX",
          120,
        );
        return { matched: false };
      }

      const game = await prisma.game.create({
        data: {
          type: "RANKED",
          status: "PENDING",
          player1Id: userId,
          player2Id: opponentId,
        },
      });

      await redis.del(`matchmaking:player:${opponentId}`);

      logger.info("Ranked match created", {
        gameId: game.id,
        userId,
        opponentId,
      });

      return {
        matched: true,
        gameId: game.id,
        opponentId,
      };
    }

    await redis.zadd(RANKED_QUEUE, division, userId);
    await redis.set(
      `matchmaking:player:${userId}`,
      JSON.stringify({ userId, socketId, joinedAt: Date.now() }),
      "EX",
      120,
    );

    return { matched: false };
  },

  async joinCasual(
    userId: string,
    socketId: string,
  ): Promise<{ matched: boolean; gameId?: string; opponentId?: string }> {
    const existing = await redis.lpop("matchmaking:casual");

    if (existing) {
      const opponent: QueuedPlayer = JSON.parse(existing);
      await redis.del(`matchmaking:player:${opponent.userId}`);

      const game = await prisma.game.create({
        data: {
          type: "CASUAL",
          status: "PENDING",
          player1Id: userId,
          player2Id: opponent.userId,
        },
      });

      logger.info("Casual match created", {
        gameId: game.id,
        userId,
        opponentId: opponent.userId,
      });

      return {
        matched: true,
        gameId: game.id,
        opponentId: opponent.userId,
      };
    }

    const queued: QueuedPlayer = { userId, socketId, joinedAt: Date.now() };
    await redis.rpush("matchmaking:casual", JSON.stringify(queued));
    await redis.expire("matchmaking:casual", 120);

    return { matched: false };
  },

  async leave(userId: string) {
    await redis.zrem(RANKED_QUEUE, userId);
    await redis.lrem("matchmaking:casual", 0, userId);
    await redis.del(`matchmaking:player:${userId}`);
  },
};
