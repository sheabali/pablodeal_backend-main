import type { RuleMatchInput } from "./league.types";

export interface StandingRow {
  teamId: string;
  teamName?: string;
  crestUrl?: string | null;
  userName?: string | null;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface TeamMeta {
  id: string;
  name: string;
  crestUrl?: string | null;
  userName?: string | null;
}

interface StandingsTable {
  rows: Map<string, StandingRow>;
}

function initTable(
  teamIds: string[],
  teamMeta?: Map<string, TeamMeta>,
): StandingsTable {
  const rows = new Map<string, StandingRow>();
  for (const teamId of teamIds) {
    const meta = teamMeta?.get(teamId);
    rows.set(teamId, {
      teamId,
      teamName: meta?.name,
      crestUrl: meta?.crestUrl ?? null,
      userName: meta?.userName ?? null,
      position: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }
  return { rows };
}

function applyResult(
  table: StandingsTable,
  teamId: string,
  goalsFor: number,
  goalsAgainst: number,
  outcome: "win" | "draw" | "loss",
) {
  const row = table.rows.get(teamId);
  if (!row) return;

  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDifference = row.goalsFor - row.goalsAgainst;

  if (outcome === "win") {
    row.wins += 1;
    row.points += 3;
  } else if (outcome === "draw") {
    row.draws += 1;
    row.points += 1;
  } else {
    row.losses += 1;
  }
}

/**
 * Applies one match to the table.
 * Supports FINISHED, IN_PLAY, matches with recorded goals/attempts, and AUTO_WIN.
 */
function applyMatch(table: StandingsTable, match: RuleMatchInput) {
  const { homeTeamId, awayTeamId, status, winnerTeamId } = match;
  const home = table.rows.get(homeTeamId);
  const away = table.rows.get(awayTeamId);
  if (!home || !away) return;

  if (
    status === "FINISHED" ||
    status === "IN_PLAY" ||
    (match.homeGoals !== null && match.homeGoals !== undefined) ||
    (match.awayGoals !== null && match.awayGoals !== undefined)
  ) {
    const hg = match.homeGoals ?? 0;
    const ag = match.awayGoals ?? 0;
    const outcome = hg > ag ? "win" : hg < ag ? "loss" : "draw";
    const awayOutcome = ag > hg ? "win" : ag < hg ? "loss" : "draw";
    applyResult(table, homeTeamId, hg, ag, outcome);
    applyResult(table, awayTeamId, ag, hg, awayOutcome);
    return;
  }

  if (status === "AUTO_WIN") {
    if (winnerTeamId === homeTeamId) {
      applyResult(table, homeTeamId, 3, 0, "win");
      applyResult(table, awayTeamId, 0, 3, "loss");
    } else if (winnerTeamId === awayTeamId) {
      applyResult(table, homeTeamId, 0, 3, "loss");
      applyResult(table, awayTeamId, 3, 0, "win");
    } else {
      applyResult(table, homeTeamId, 0, 3, "loss");
      applyResult(table, awayTeamId, 0, 3, "loss");
    }
  }
}

/** Goal difference restricted to matches played between the given (tied) teams. */
function headToHeadGoalDifference(
  teamIds: string[],
  matches: RuleMatchInput[],
  teamId: string,
): number {
  const opponents = new Set(teamIds);
  let gd = 0;

  for (const m of matches) {
    if (m.homeTeamId !== teamId && m.awayTeamId !== teamId) continue;
    const opponentId = m.homeTeamId === teamId ? m.awayTeamId : m.homeTeamId;
    if (!opponents.has(opponentId)) continue;

    if (m.status === "FINISHED") {
      const mine =
        m.homeTeamId === teamId ? (m.homeGoals ?? 0) : (m.awayGoals ?? 0);
      const theirs =
        m.homeTeamId === teamId ? (m.awayGoals ?? 0) : (m.homeGoals ?? 0);
      gd += mine - theirs;
    } else if (m.winnerTeamId !== null) {
      gd += m.winnerTeamId === teamId ? 3 : -3;
    } else {
      gd += -3;
    }
  }

  return gd;
}

/**
 * Computes the official standings.
 * Ordering: points (desc), head-to-head goal difference (desc), overall
 * goal difference (desc), then team name (stable, deterministic).
 */
export function computeStandings(
  teamIds: string[],
  matches: RuleMatchInput[],
  teamMeta?: Map<string, TeamMeta>,
): StandingRow[] {
  const table = initTable(teamIds, teamMeta);

  for (const match of matches) {
    applyMatch(table, match);
  }

  const rows = [...table.rows.values()];
  const byPoints = new Map<number, StandingRow[]>();
  for (const row of rows) {
    const group = byPoints.get(row.points) ?? [];
    group.push(row);
    byPoints.set(row.points, group);
  }

  const ordered: StandingRow[] = [];
  const pointGroups = [...byPoints.entries()].sort((a, b) => b[0] - a[0]);

  for (const [, group] of pointGroups) {
    const tiedIds = group.map((r) => r.teamId);
    const h2h = new Map<string, number>();
    for (const row of group) {
      h2h.set(
        row.teamId,
        headToHeadGoalDifference(tiedIds, matches, row.teamId),
      );
    }

    const sorted = group.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const h2hDiff = (h2h.get(b.teamId) ?? 0) - (h2h.get(a.teamId) ?? 0);
      if (h2hDiff !== 0) return h2hDiff;
      const gdDiff = b.goalDifference - a.goalDifference;
      if (gdDiff !== 0) return gdDiff;
      return a.teamId.localeCompare(b.teamId);
    });

    ordered.push(...sorted);
  }

  return ordered.map((row, i) => ({ ...row, position: i + 1 }));
}

export interface ProvisionalMatchInput {
  homeTeamId: string;
  awayTeamId: string;
}

export interface ProvisionalStandingInput {
  teamId: string;
  bestGoals: number;
  attemptsUsed: number;
}

/**
 * Provisional standings shown live during a matchday, based on the matches
 * played so far. A team with no attempts yet counts as 0 goals.
 */
export function computeProvisionalStandings(
  teamIds: string[],
  matches: ProvisionalMatchInput[],
  entries: ProvisionalStandingInput[],
  teamMeta?: Map<string, TeamMeta>,
): StandingRow[] {
  const table = initTable(teamIds, teamMeta);
  const byTeam = new Map(entries.map((e) => [e.teamId, e]));

  for (const match of matches) {
    const ea = byTeam.get(match.homeTeamId) ?? {
      teamId: match.homeTeamId,
      bestGoals: 0,
      attemptsUsed: 0,
    };
    const eb = byTeam.get(match.awayTeamId) ?? {
      teamId: match.awayTeamId,
      bestGoals: 0,
      attemptsUsed: 0,
    };

    if (ea.attemptsUsed === 0 && eb.attemptsUsed === 0) continue;

    const outcomeA =
      ea.bestGoals > eb.bestGoals
        ? "win"
        : ea.bestGoals < eb.bestGoals
          ? "loss"
          : "draw";
    const outcomeB =
      eb.bestGoals > ea.bestGoals
        ? "win"
        : eb.bestGoals < ea.bestGoals
          ? "loss"
          : "draw";

    applyResult(table, ea.teamId, ea.bestGoals, eb.bestGoals, outcomeA);
    applyResult(table, eb.teamId, eb.bestGoals, ea.bestGoals, outcomeB);
  }

  const rows = [...table.rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      a.teamId.localeCompare(b.teamId),
  );

  return rows.map((row, i) => ({ ...row, position: i + 1 }));
}
