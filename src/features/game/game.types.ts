import type { GameEventType } from "@/prisma/enums";

export interface PlayerConnection {
  userId: string;
  socketId: string;
  score: number;
}

export type TurnSide = "player1" | "player2";

export type GamePhase =
  | "WAITING"
  | "STOPWATCH_RUNNING"
  | "EVALUATING"
  | "FREE_KICK_SELECT"
  | "PENALTY_SELECT"
  | "CORNER_SELECT"
  | "SUB_STOPWATCH_RUNNING"
  | "MATCH_END";

export interface SubGameData {
  type: "FREE_KICK" | "PENALTY" | "CORNER";
  selection?: string;
}

export interface TurnResult {
  eventType: GameEventType;
  stopwatchValueMs: number;
  goal: boolean;
  subGame?: SubGameData;
}

export interface GameRoomState {
  gameId: string;
  player1: PlayerConnection;
  player2: PlayerConnection;
  mode: "DUEL" | "SOLO";
  phase: GamePhase;
  currentTurn: TurnSide;
  turnNumber: number;
  matchStartTime: number;
  turnStartTime: number;
  player1Score: number;
  player2Score: number;
  stoppageTimeMs: number;
  lastEventTime: number;
  subGameData: SubGameData | null;
}

export const TURN_WINDOW_MS = 1998;
export const CORNER_WINDOW_MS = 1000;
export const MATCH_DURATION_MS = 60000;
export const MAX_STOPPAGE_MS = 6000;
export const MAX_SHIELD = 2;
export const PLACEMENT_MATCHES = 10;

export const DIVISION_NAMES: Record<number, string> = {
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

export function calculateDivision(rp: number): number {
  if (rp >= 900) return 1;
  if (rp >= 800) return 2;
  if (rp >= 700) return 3;
  if (rp >= 600) return 4;
  if (rp >= 500) return 5;
  if (rp >= 400) return 6;
  if (rp >= 300) return 7;
  if (rp >= 200) return 8;
  if (rp >= 100) return 9;
  return 10;
}

export function evaluateStopwatch(ms: number): TurnResult {
  if (ms >= TURN_WINDOW_MS) {
    return {
      eventType: "CORNER_START",
      stopwatchValueMs: ms,
      goal: false,
      subGame: { type: "CORNER" },
    };
  }

  const lastTwo = ms % 100;

  if (lastTwo === 0) {
    return {
      eventType: "DIRECT_GOAL",
      stopwatchValueMs: ms,
      goal: true,
    };
  }

  if (lastTwo === 1 || lastTwo === 99) {
    return {
      eventType: "PENALTY_START",
      stopwatchValueMs: ms,
      goal: false,
      subGame: { type: "PENALTY" },
    };
  }

  if (lastTwo === 2 || lastTwo === 98) {
    return {
      eventType: "FREE_KICK_START",
      stopwatchValueMs: ms,
      goal: false,
      subGame: { type: "FREE_KICK" },
    };
  }

  return {
    eventType: "MISS",
    stopwatchValueMs: ms,
    goal: false,
  };
}

export function evaluateNumberGuess(digit: number, actual: number): boolean {
  return actual % 10 === digit;
}

export function evaluateEvenOdd(even: boolean, actual: number): boolean {
  return (actual % 10) % 2 === (even ? 0 : 1);
}

export function evaluateCornerGuess(guess: number, actual: number): boolean {
  return actual % 100 === guess;
}
