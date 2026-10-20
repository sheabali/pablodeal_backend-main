import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createLeagueSchema = z.object({
  name: z.string().trim().min(1, "League name is required").max(50),
  startDate: z.coerce.date(),
  matchdayStartTime: z
    .string()
    .regex(timePattern, "Matchday start time must be in HH:MM format"),
});

export const joinLeagueSchema = z.object({
  code: z.string().trim().min(1, "Invitation code is required"),
  teamName: z.string().trim().min(1, "Team name is required").max(30),
  crestUrl: z.string().url().optional(),
});

export const updateConfigSchema = z.object({
  freeAttempts: z.number().int().min(0).max(20).optional(),
  adAttempts: z.number().int().min(0).max(5).optional(),
  packSize: z.number().int().min(1).max(20).optional(),
  packPriceCents: z.number().int().min(0).optional(),
  matchdayHours: z.number().int().min(1).max(72).optional(),
});

export const recordHitSchema = z.object({
  gameId: z.string().optional(),
  attemptId: z.string().optional(),
  stopwatchValueMs: z.number().nonnegative(),
  turnNumber: z.number().int().positive().optional(),
});

export const recordSubHitSchema = z.object({
  gameId: z.string().optional(),
  attemptId: z.string().optional(),
  subGameType: z.enum(["FREE_KICK", "PENALTY", "CORNER"]),
  selection: z.union([z.string(), z.number(), z.boolean()]),
  stopwatchValueMs: z.number().nonnegative(),
  turnNumber: z.number().int().positive().optional(),
});

export const finishAttemptSchema = z.object({
  gameId: z.string().optional(),
  attemptId: z.string().optional(),
  goals: z.number().int().nonnegative().optional(),
});

export const saveGoalSchema = z.object({
  leagueId: z.string().optional(),
  matchdayId: z.string().optional(),
  matchId: z.string().optional(),
  gameId: z.string().optional(),
  attemptId: z.string().optional(),
  scoringTeamId: z.string().optional(),
  opponentTeamId: z.string().optional(),
  scoringPlayerId: z.string().optional(),
  clientGoalId: z.string().optional(),
  eventType: z
    .enum([
      "MATCH_START",
      "DIRECT_GOAL",
      "FREE_KICK_START",
      "FREE_KICK_GOAL",
      "FREE_KICK_MISS",
      "PENALTY_START",
      "PENALTY_GOAL",
      "PENALTY_MISS",
      "CORNER_START",
      "CORNER_GOAL",
      "CORNER_MISS",
      "SAVE",
      "MISS",
      "STOPPAGE_TIME_START",
      "MATCH_END",
    ])
    .optional(),
  stopwatchValueMs: z.number().nonnegative().optional(),
  score: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
