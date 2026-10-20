export type RuleMatchStatus = "PENDING" | "IN_PLAY" | "FINISHED" | "AUTO_WIN";

export interface RuleMatchInput {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  status: RuleMatchStatus;
  homeGoals: number | null;
  awayGoals: number | null;
  winnerTeamId: string | null;
}

export interface RuleEntryInput {
  teamId: string;
  attemptsUsed: number;
  freeAttemptsUsed: number;
  adAttemptsUsed: number;
  adGranted: boolean;
  purchasedAttempts: number;
  purchasedAttemptsUsed: number;
  bestGoals: number;
}

export interface AttemptConfig {
  freeAttempts: number;
  adAttempts: number;
  packSize: number;
  packPriceCents: number;
}

export interface AttemptEligibility {
  allowed: boolean;
  used: number;
  total: number;
  freeLeft: number;
  adLeft: number;
  purchasedLeft: number;
}

export interface ResolvedMatch {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  status: RuleMatchStatus;
  homeGoals: number;
  awayGoals: number;
  winnerTeamId: string | null;
}

export interface EntrySnapshot {
  teamId: string;
  matchId: string | null;
  attemptsUsed: number;
  bestGoals: number;
}
