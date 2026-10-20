import type {
  AttemptConfig,
  AttemptEligibility,
  EntrySnapshot,
  ResolvedMatch,
  RuleEntryInput,
  RuleMatchInput,
} from "./league.types";

/**
 * Attempt budget model per matchday:
 * - entitlement = freeAttempts (config) + ad bonus (1 per matchday after
 *   watching a rewarded ad) + purchased attempts (config.packSize per pack).
 * - Buckets are consumed in order: free first, then ad, then purchased.
 * - attemptsUsed is the total consumed; bestGoals never decreases.
 */

export interface AttemptBudget {
  entitlement: number;
  used: number;
  remaining: number;
  freeLeft: number;
  adLeft: number;
  purchasedLeft: number;
}

export function attemptsBudget(
  entry: RuleEntryInput,
  config: AttemptConfig,
): AttemptBudget {
  const freeLeft = Math.max(0, config.freeAttempts - entry.freeAttemptsUsed);
  const adLeft = entry.adGranted
    ? Math.max(0, config.adAttempts - entry.adAttemptsUsed)
    : 0;
  const purchasedLeft = Math.max(
    0,
    entry.purchasedAttempts - entry.purchasedAttemptsUsed,
  );
  const entitlement =
    config.freeAttempts +
    (entry.adGranted ? config.adAttempts : 0) +
    entry.purchasedAttempts;

  return {
    entitlement,
    used: entry.attemptsUsed,
    remaining: freeLeft + adLeft + purchasedLeft,
    freeLeft,
    adLeft,
    purchasedLeft,
  };
}

export function attemptsEligibility(
  entry: RuleEntryInput,
  config: AttemptConfig,
): AttemptEligibility {
  const budget = attemptsBudget(entry, config);
  return {
    allowed: budget.remaining > 0,
    used: budget.used,
    total: budget.entitlement,
    freeLeft: budget.freeLeft,
    adLeft: budget.adLeft,
    purchasedLeft: budget.purchasedLeft,
  };
}

/** Can this player spend one more attempt right now? */
export function canAttempt(
  entry: RuleEntryInput,
  config: AttemptConfig,
): boolean {
  return attemptsEligibility(entry, config).allowed;
}

/** True when the player has exhausted every attempt available this matchday. */
export function hasFinishedParticipation(
  entry: RuleEntryInput,
  config: AttemptConfig,
): boolean {
  return !attemptsEligibility(entry, config).allowed;
}

/** Which bucket a new attempt should be consumed from. */
export function nextAttemptBucket(
  entry: RuleEntryInput,
  config: AttemptConfig,
): "free" | "ad" | "purchased" {
  if (entry.freeAttemptsUsed < config.freeAttempts) return "free";
  if (entry.adGranted && entry.adAttemptsUsed < config.adAttempts) return "ad";
  return "purchased";
}

/**
 * Applies one finished attempt to an entry: consumes one bucket, keeps the
 * best score (a new attempt may improve it but never worsen it).
 */
export function recordAttempt(
  entry: RuleEntryInput,
  goals: number,
  config: AttemptConfig,
): RuleEntryInput {
  const bucket = nextAttemptBucket(entry, config);

  return {
    ...entry,
    attemptsUsed: entry.attemptsUsed + 1,
    freeAttemptsUsed: entry.freeAttemptsUsed + (bucket === "free" ? 1 : 0),
    adAttemptsUsed: entry.adAttemptsUsed + (bucket === "ad" ? 1 : 0),
    purchasedAttemptsUsed:
      entry.purchasedAttemptsUsed + (bucket === "purchased" ? 1 : 0),
    bestGoals: Math.max(entry.bestGoals, goals),
  };
}

/**
 * Resolves the official result of a match at matchday close.
 * - Both played      -> best results compared; win/draw/loss by goals.
 * - Only one played  -> AUTO_WIN 3-0 for the active team (0-3 loss for the other).
 * - Neither played   -> AUTO_WIN; both are given a 0-3 loss (no winner).
 */
export function resolveMatch(
  match: RuleMatchInput,
  homeEntry: RuleEntryInput,
  awayEntry: RuleEntryInput,
): ResolvedMatch {
  const homePlayed = homeEntry.attemptsUsed > 0;
  const awayPlayed = awayEntry.attemptsUsed > 0;

  if (homePlayed && awayPlayed) {
    const hg = homeEntry.bestGoals;
    const ag = awayEntry.bestGoals;
    const winnerTeamId =
      hg > ag ? match.homeTeamId : hg < ag ? match.awayTeamId : null;
    return {
      id: match.id,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      status: "FINISHED",
      homeGoals: hg,
      awayGoals: ag,
      winnerTeamId,
    };
  }

  if (homePlayed) {
    return {
      id: match.id,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      status: "AUTO_WIN",
      homeGoals: 3,
      awayGoals: 0,
      winnerTeamId: match.homeTeamId,
    };
  }

  if (awayPlayed) {
    return {
      id: match.id,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      status: "AUTO_WIN",
      homeGoals: 0,
      awayGoals: 3,
      winnerTeamId: match.awayTeamId,
    };
  }

  return {
    id: match.id,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    status: "AUTO_WIN",
    homeGoals: 0,
    awayGoals: 0,
    winnerTeamId: null,
  };
}

export type MatchPhase = "PENDING" | "IN_PLAY" | "FINISHED";

/**
 * Live status of a match during the matchday:
 * - PENDING  -> no attempts yet.
 * - IN_PLAY  -> at least one side has played.
 * - FINISHED -> both sides have exhausted all their attempts (final result).
 */
export function liveMatchPhase(
  match: RuleMatchInput,
  homeEntry: RuleEntryInput,
  awayEntry: RuleEntryInput,
  config: AttemptConfig,
): MatchPhase {
  const homeDone = hasFinishedParticipation(homeEntry, config);
  const awayDone = hasFinishedParticipation(awayEntry, config);
  const anyPlayed = homeEntry.attemptsUsed > 0 || awayEntry.attemptsUsed > 0;
  if (homeDone && awayDone && anyPlayed) return "FINISHED";
  if (anyPlayed) return "IN_PLAY";
  return "PENDING";
}

/** Official goals for a match whose result is already decided live (both done). */
export function decidedGoals(
  match: RuleMatchInput,
  homeEntry: EntrySnapshot,
  awayEntry: EntrySnapshot,
): {
  homeGoals: number;
  awayGoals: number;
  winnerTeamId: string | null;
} | null {
  if (homeEntry.attemptsUsed === 0 || awayEntry.attemptsUsed === 0) return null;
  const hg = homeEntry.bestGoals;
  const ag = awayEntry.bestGoals;
  return {
    homeGoals: hg,
    awayGoals: ag,
    winnerTeamId:
      hg > ag ? match.homeTeamId : hg < ag ? match.awayTeamId : null,
  };
}
