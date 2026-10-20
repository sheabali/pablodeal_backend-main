export interface ScheduleMatch {
  homeTeamId: string;
  awayTeamId: string;
}

export interface ScheduleMatchday {
  number: number;
  matches: ScheduleMatch[];
  byeTeamId: string | null;
}

export const BYE_TEAM_ID = "__BYE__";

/**
 * Generates a complete round-robin schedule using the circle method.
 * Every team faces every other team exactly once.
 * If the number of participants is odd, a dummy BYE team is added and
 * the team paired with it rests each matchday. The bye rotates
 * automatically among all participants.
 */
export function generateRoundRobinSchedule(
  teamIds: string[],
): ScheduleMatchday[] {
  if (teamIds.length < 2) {
    return [];
  }

  const effective = [...teamIds];
  if (effective.length % 2 === 1) {
    effective.push(BYE_TEAM_ID);
  }

  const n = effective.length;
  const rounds = n - 1;
  const fixed = effective[0]!;
  const rotating = effective.slice(1);

  const matchdays: ScheduleMatchday[] = [];

  for (let round = 0; round < rounds; round++) {
    const order = [fixed, ...rotating];
    const matches: ScheduleMatch[] = [];
    let byeTeamId: string | null = null;

    for (let i = 0; i < n / 2; i++) {
      const a = order[i]!;
      const b = order[n - 1 - i]!;

      if (a === BYE_TEAM_ID || b === BYE_TEAM_ID) {
        byeTeamId = a === BYE_TEAM_ID ? b : a;
        continue;
      }

      if (i % 2 === 0) {
        matches.push({ homeTeamId: a, awayTeamId: b });
      } else {
        matches.push({ homeTeamId: b, awayTeamId: a });
      }
    }

    matchdays.push({ number: round + 1, matches, byeTeamId });

    rotating.unshift(rotating.pop()!);
  }

  return matchdays;
}

/** Matchday k opens 24h after matchday k-1: same wall-clock time every day. */
export function matchdayOpensAt(
  startDate: Date,
  matchdayStartMinutes: number,
  matchdayNumber: number,
): Date {
  const d = new Date(startDate);
  d.setHours(
    Math.floor(matchdayStartMinutes / 60),
    matchdayStartMinutes % 60,
    0,
    0,
  );
  d.setDate(d.getDate() + (matchdayNumber - 1));
  return d;
}

export function matchdayClosesAt(opensAt: Date, matchdayHours: number): Date {
  return new Date(opensAt.getTime() + matchdayHours * 60 * 60 * 1000);
}
