import {
  evaluateStopwatch,
  evaluateNumberGuess,
  evaluateEvenOdd,
  evaluateCornerGuess,
  calculateDivision,
} from "../game/game.types";

describe("evaluateStopwatch", () => {
  it("direct goal when ms ends in 00", () => {
    const r = evaluateStopwatch(100);
    expect(r.eventType).toBe("DIRECT_GOAL");
    expect(r.goal).toBe(true);
  });

  it("free kick at .98", () => {
    const r = evaluateStopwatch(198);
    expect(r.eventType).toBe("FREE_KICK_START");
    expect(r.subGame?.type).toBe("FREE_KICK");
  });

  it("free kick at .02", () => {
    const r = evaluateStopwatch(2);
    expect(r.eventType).toBe("FREE_KICK_START");
    expect(r.subGame?.type).toBe("FREE_KICK");
  });

  it("penalty at .99", () => {
    const r = evaluateStopwatch(99);
    expect(r.eventType).toBe("PENALTY_START");
    expect(r.subGame?.type).toBe("PENALTY");
  });

  it("penalty at .01", () => {
    const r = evaluateStopwatch(101);
    expect(r.eventType).toBe("PENALTY_START");
    expect(r.subGame?.type).toBe("PENALTY");
  });

  it("corner when >= 1998ms", () => {
    const r = evaluateStopwatch(1998);
    expect(r.eventType).toBe("CORNER_START");
    expect(r.subGame?.type).toBe("CORNER");
  });

  it("save/miss for other values", () => {
    const r = evaluateStopwatch(50);
    expect(r.eventType).toBe("MISS");
    expect(r.goal).toBe(false);
  });
});

describe("evaluateNumberGuess (free kick)", () => {
  it("goal when digit matches last digit", () => {
    expect(evaluateNumberGuess(3, 103)).toBe(true);
    expect(evaluateNumberGuess(7, 207)).toBe(true);
  });

  it("miss when digit does not match", () => {
    expect(evaluateNumberGuess(3, 105)).toBe(false);
  });
});

describe("evaluateEvenOdd (penalty)", () => {
  it("even matches", () => {
    expect(evaluateEvenOdd(true, 100)).toBe(true);
    expect(evaluateEvenOdd(true, 102)).toBe(true);
  });

  it("odd matches", () => {
    expect(evaluateEvenOdd(false, 101)).toBe(true);
    expect(evaluateEvenOdd(false, 103)).toBe(true);
  });

  it("wrong choice fails", () => {
    expect(evaluateEvenOdd(true, 101)).toBe(false);
    expect(evaluateEvenOdd(false, 100)).toBe(false);
  });
});

describe("evaluateCornerGuess", () => {
  it("goal when guess matches last two digits", () => {
    expect(evaluateCornerGuess(42, 142)).toBe(true);
    expect(evaluateCornerGuess(0, 100)).toBe(true);
  });

  it("miss when guess does not match", () => {
    expect(evaluateCornerGuess(42, 143)).toBe(false);
  });
});

describe("calculateDivision", () => {
  it("Rookie at 0 RP", () => {
    expect(calculateDivision(0)).toBe(10);
  });

  it("Legend at 950 RP", () => {
    expect(calculateDivision(950)).toBe(1);
  });

  it("Competitor at 450 RP", () => {
    expect(calculateDivision(450)).toBe(6);
  });

  it("boundary at 99 -> Rookie", () => {
    expect(calculateDivision(99)).toBe(10);
  });

  it("boundary at 100 -> Beginner", () => {
    expect(calculateDivision(100)).toBe(9);
  });
});
