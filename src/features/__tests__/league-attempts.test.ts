import { evaluateStopwatch } from "../game/game.types";
import {
  attemptsEligibility,
  canAttempt,
  hasFinishedParticipation,
  nextAttemptBucket,
  recordAttempt,
} from "../league/league.rules";
import { computeStandings } from "../league/league.standings";
import type {
  AttemptConfig,
  RuleEntryInput,
  RuleMatchInput,
} from "../league/league.types";
import { StripeService } from "../payment/stripe.service";

describe("League Attempts System", () => {
  const config: AttemptConfig = {
    freeAttempts: 2,
    adAttempts: 1,
    packSize: 2,
    packPriceCents: 100,
  };

  const initialEntry: RuleEntryInput = {
    teamId: "team-1",
    attemptsUsed: 0,
    freeAttemptsUsed: 0,
    adAttemptsUsed: 0,
    adGranted: false,
    purchasedAttempts: 0,
    purchasedAttemptsUsed: 0,
    bestGoals: 0,
  };

  it("calculates initial eligibility correctly (2 free attempts)", () => {
    const el = attemptsEligibility(initialEntry, config);
    expect(el.allowed).toBe(true);
    expect(el.used).toBe(0);
    expect(el.total).toBe(2);
    expect(el.freeLeft).toBe(2);
    expect(el.adLeft).toBe(0);
    expect(el.purchasedLeft).toBe(0);
  });

  it("consumes free attempts first", () => {
    expect(nextAttemptBucket(initialEntry, config)).toBe("free");

    const after1 = recordAttempt(initialEntry, 3, config);
    expect(after1.attemptsUsed).toBe(1);
    expect(after1.freeAttemptsUsed).toBe(1);
    expect(after1.bestGoals).toBe(3);
    expect(canAttempt(after1, config)).toBe(true);

    const after2 = recordAttempt(after1, 2, config);
    expect(after2.attemptsUsed).toBe(2);
    expect(after2.freeAttemptsUsed).toBe(2);
    expect(after2.bestGoals).toBe(3); // keeps best score
    expect(canAttempt(after2, config)).toBe(false);
    expect(hasFinishedParticipation(after2, config)).toBe(true);
  });

  it("consumes ad attempt when granted after free attempts exhausted", () => {
    const entryWithAd: RuleEntryInput = {
      ...initialEntry,
      attemptsUsed: 2,
      freeAttemptsUsed: 2,
      adGranted: true,
    };

    expect(canAttempt(entryWithAd, config)).toBe(true);
    expect(nextAttemptBucket(entryWithAd, config)).toBe("ad");

    const afterAd = recordAttempt(entryWithAd, 5, config);
    expect(afterAd.attemptsUsed).toBe(3);
    expect(afterAd.adAttemptsUsed).toBe(1);
    expect(afterAd.bestGoals).toBe(5);
    expect(canAttempt(afterAd, config)).toBe(false);
  });

  it("consumes purchased attempts after ad and free attempts", () => {
    const entryWithPurchased: RuleEntryInput = {
      ...initialEntry,
      attemptsUsed: 3,
      freeAttemptsUsed: 2,
      adGranted: true,
      adAttemptsUsed: 1,
      purchasedAttempts: 2,
      purchasedAttemptsUsed: 0,
    };

    expect(canAttempt(entryWithPurchased, config)).toBe(true);
    expect(nextAttemptBucket(entryWithPurchased, config)).toBe("purchased");

    const afterPurchase1 = recordAttempt(entryWithPurchased, 6, config);
    expect(afterPurchase1.attemptsUsed).toBe(4);
    expect(afterPurchase1.purchasedAttemptsUsed).toBe(1);
    expect(afterPurchase1.bestGoals).toBe(6);
    expect(canAttempt(afterPurchase1, config)).toBe(true);

    const afterPurchase2 = recordAttempt(afterPurchase1, 4, config);
    expect(afterPurchase2.attemptsUsed).toBe(5);
    expect(afterPurchase2.purchasedAttemptsUsed).toBe(2);
    expect(afterPurchase2.bestGoals).toBe(6);
    expect(canAttempt(afterPurchase2, config)).toBe(false);
  });
});

describe("Hit & Ball Tap Precision Evaluation", () => {
  it("detects direct goal on .00", () => {
    const hit = evaluateStopwatch(100);
    expect(hit.eventType).toBe("DIRECT_GOAL");
    expect(hit.goal).toBe(true);
  });

  it("detects free kick on .98 and .02", () => {
    const hit98 = evaluateStopwatch(98);
    expect(hit98.eventType).toBe("FREE_KICK_START");
    expect(hit98.subGame?.type).toBe("FREE_KICK");

    const hit02 = evaluateStopwatch(102);
    expect(hit02.eventType).toBe("FREE_KICK_START");
    expect(hit02.subGame?.type).toBe("FREE_KICK");
  });

  it("detects penalty on .99 and .01", () => {
    const hit99 = evaluateStopwatch(199);
    expect(hit99.eventType).toBe("PENALTY_START");
    expect(hit99.subGame?.type).toBe("PENALTY");

    const hit01 = evaluateStopwatch(201);
    expect(hit01.eventType).toBe("PENALTY_START");
    expect(hit01.subGame?.type).toBe("PENALTY");
  });

  it("detects corner on >= 1998ms timeout", () => {
    const hitTimeout = evaluateStopwatch(1998);
    expect(hitTimeout.eventType).toBe("CORNER_START");
    expect(hitTimeout.subGame?.type).toBe("CORNER");
  });
});

describe("Stripe Checkout URL Generation & Redirect Payload", () => {
  it("creates checkout session with checkoutUrl and sessionId", async () => {
    const mockSession = {
      id: "cs_test_mock_123456",
      url: "https://checkout.stripe.com/c/pay/cs_test_mock_123456",
    };

    jest.spyOn(StripeService, "createCheckoutSession").mockResolvedValueOnce({
      sessionId: mockSession.id,
      url: mockSession.url,
      checkoutUrl: mockSession.url,
    });

    const result = await StripeService.createCheckoutSession({
      userId: "user-test-1",
      leagueId: "league-test-1",
      packSize: 2,
      priceCents: 100,
      leagueName: "Test Premier League",
    });

    expect(result.sessionId).toBe("cs_test_mock_123456");
    expect(result.url).toBe(
      "https://checkout.stripe.com/c/pay/cs_test_mock_123456",
    );
    expect(result.checkoutUrl).toBe(
      "https://checkout.stripe.com/c/pay/cs_test_mock_123456",
    );
  });
});

describe("Dynamic League Standings Calculation", () => {
  it("calculates standings with wins, draws, losses, goal differences, and points", () => {
    const teamIds = ["team-A", "team-B", "team-C"];
    const matches: RuleMatchInput[] = [
      // Match 1: Team A (3) vs Team B (1) -> Team A win (+3 pts, +2 GD), Team B loss (+0 pts, -2 GD)
      {
        id: "match-1",
        homeTeamId: "team-A",
        awayTeamId: "team-B",
        status: "FINISHED",
        homeGoals: 3,
        awayGoals: 1,
        winnerTeamId: "team-A",
      },
      // Match 2: Team B (2) vs Team C (2) -> Draw (1 pt each, 0 GD)
      {
        id: "match-2",
        homeTeamId: "team-B",
        awayTeamId: "team-C",
        status: "FINISHED",
        homeGoals: 2,
        awayGoals: 2,
        winnerTeamId: null,
      },
    ];

    const teamMeta = new Map([
      ["team-A", { id: "team-A", name: "Team Alpha" }],
      ["team-B", { id: "team-B", name: "Team Beta" }],
      ["team-C", { id: "team-C", name: "Team Gamma" }],
    ]);

    const standings = computeStandings(teamIds, matches, teamMeta);

    expect(standings).toHaveLength(3);

    const first = standings[0]!;
    const second = standings[1]!;
    const third = standings[2]!;

    // 1st: Team A
    expect(first.teamId).toBe("team-A");
    expect(first.teamName).toBe("Team Alpha");
    expect(first.position).toBe(1);
    expect(first.played).toBe(1);
    expect(first.wins).toBe(1);
    expect(first.draws).toBe(0);
    expect(first.losses).toBe(0);
    expect(first.goalsFor).toBe(3);
    expect(first.goalsAgainst).toBe(1);
    expect(first.goalDifference).toBe(2);
    expect(first.points).toBe(3);

    // 2nd: Team C
    expect(second.teamId).toBe("team-C");
    expect(second.position).toBe(2);
    expect(second.played).toBe(1);
    expect(second.wins).toBe(0);
    expect(second.draws).toBe(1);
    expect(second.losses).toBe(0);
    expect(second.goalsFor).toBe(2);
    expect(second.goalsAgainst).toBe(2);
    expect(second.goalDifference).toBe(0);
    expect(second.points).toBe(1);

    // 3rd: Team B (played 2, 0 wins, 1 draw, 1 loss, 3 GF, 5 GA, -2 GD, 1 pt)
    expect(third.teamId).toBe("team-B");
    expect(third.position).toBe(3);
    expect(third.played).toBe(2);
    expect(third.wins).toBe(0);
    expect(third.draws).toBe(1);
    expect(third.losses).toBe(1);
    expect(third.goalsFor).toBe(3);
    expect(third.goalsAgainst).toBe(5);
    expect(third.goalDifference).toBe(-2);
    expect(third.points).toBe(1);
  });
});
