import { prisma } from "@/core/database";
import { logger } from "@/core/logger";
import type { GameEventType } from "@/prisma/enums";
import {
  evaluateStopwatch,
  evaluateNumberGuess,
  evaluateEvenOdd,
  evaluateCornerGuess,
  MATCH_DURATION_MS,
} from "./game.types";
import type {
  GameRoomState,
  GamePhase,
  TurnSide,
  PlayerConnection,
  TurnResult,
} from "./game.types";

type EventCallback = (event: string, data: unknown) => void;

export interface GameRoomOptions {
  solo?: boolean;
  onMatchEnd?: (room: GameRoom) => Promise<void> | void;
}

export class GameRoom {
  state: GameRoomState;
  private emitToPlayer1: EventCallback;
  private emitToPlayer2: EventCallback;
  private matchInterval: ReturnType<typeof setInterval> | null = null;
  private turnTimeout: ReturnType<typeof setTimeout> | null = null;
  private onMatchEndCallback?: (room: GameRoom) => Promise<void> | void;

  constructor(
    gameId: string,
    player1: PlayerConnection,
    player2: PlayerConnection,
    emit1: EventCallback,
    emit2: EventCallback,
    options: GameRoomOptions = {},
  ) {
    this.state = {
      gameId,
      player1,
      player2,
      mode: options.solo === true ? "SOLO" : "DUEL",
      phase: "WAITING",
      currentTurn: "player1",
      turnNumber: 0,
      matchStartTime: 0,
      turnStartTime: 0,
      player1Score: 0,
      player2Score: 0,
      stoppageTimeMs: 0,
      lastEventTime: Date.now(),
      subGameData: null,
    };
    this.emitToPlayer1 = emit1;
    this.emitToPlayer2 = emit2;
    this.onMatchEndCallback = options.onMatchEnd;
  }

  private get currentPlayer(): PlayerConnection {
    return this.state.currentTurn === "player1"
      ? this.state.player1
      : this.state.player2;
  }

  private get opponentPlayer(): PlayerConnection {
    return this.state.currentTurn === "player1"
      ? this.state.player2
      : this.state.player1;
  }

  private emitToCurrent(event: string, data: unknown) {
    const cb =
      this.state.currentTurn === "player1"
        ? this.emitToPlayer1
        : this.emitToPlayer2;
    cb(event, data);
  }

  private emitToOpponent(event: string, data: unknown) {
    const cb =
      this.state.currentTurn === "player1"
        ? this.emitToPlayer2
        : this.emitToPlayer1;
    cb(event, data);
  }

  private emitToBoth(event: string, data: unknown) {
    this.emitToPlayer1(event, data);
    this.emitToPlayer2(event, data);
  }

  private getScore(which: TurnSide): number {
    return which === "player1"
      ? this.state.player1Score
      : this.state.player2Score;
  }

  private addScore(which: TurnSide) {
    if (which === "player1") this.state.player1Score++;
    else this.state.player2Score++;
    this.emitToBoth("game:score_update", {
      player1Score: this.state.player1Score,
      player2Score: this.state.player2Score,
    });
  }

  private switchTurn() {
    if (this.state.mode === "SOLO") return;
    this.state.currentTurn =
      this.state.currentTurn === "player1" ? "player2" : "player1";
  }

  private setPhase(phase: GamePhase) {
    this.state.phase = phase;
  }

  private broadcastState() {
    this.emitToBoth("game:state", {
      phase: this.state.phase,
      currentTurn: this.state.currentTurn,
      turnNumber: this.state.turnNumber,
      player1Score: this.state.player1Score,
      player2Score: this.state.player2Score,
      stoppageTimeMs: this.state.stoppageTimeMs,
    });
  }

  async startMatch() {
    this.state.matchStartTime = Date.now();
    this.state.lastEventTime = this.state.matchStartTime;

    await prisma.game.update({
      where: { id: this.state.gameId },
      data: { status: "ACTIVE", startedAt: new Date() },
    });

    this.emitToBoth("game:match_start", {
      gameId: this.state.gameId,
      player1: { id: this.state.player1.userId },
      player2: { id: this.state.player2.userId },
    });

    this.startMatchClock();
    this.beginTurn();
  }

  private startMatchClock() {
    this.matchInterval = setInterval(() => {
      const elapsed = Date.now() - this.state.matchStartTime;
      const totalTime = MATCH_DURATION_MS + this.state.stoppageTimeMs;

      this.emitToBoth("game:match_clock", {
        elapsed,
        totalTime,
        stoppageTimeMs: this.state.stoppageTimeMs,
      });

      if (elapsed >= totalTime) {
        this.endMatch();
      }
    }, 100);
  }

  private beginTurn() {
    this.state.turnNumber++;
    this.setPhase("WAITING");
    this.broadcastState();

    this.emitToCurrent("game:turn_start", {
      turnNumber: this.state.turnNumber,
    });
  }

  handleStartStopwatch() {
    if (this.state.phase !== "WAITING") {
      this.emitToCurrent("game:error", { message: "Not your turn to start" });
      return;
    }

    this.state.turnStartTime = Date.now();
    this.setPhase("STOPWATCH_RUNNING");
    this.broadcastState();

    this.emitToCurrent("game:stopwatch_start", {
      turnNumber: this.state.turnNumber,
      startTime: this.state.turnStartTime,
    });

    this.turnTimeout = setTimeout(() => {
      if (this.state.phase === "STOPWATCH_RUNNING") {
        this.handleStopwatchTimeout();
      }
    }, 2000);
  }

  handleStopStopwatch() {
    if (this.state.phase !== "STOPWATCH_RUNNING") {
      this.emitToCurrent("game:error", { message: "Stopwatch not running" });
      return;
    }

    if (this.turnTimeout) {
      clearTimeout(this.turnTimeout);
      this.turnTimeout = null;
    }

    const now = Date.now();
    const elapsedMs = now - this.state.turnStartTime;

    this.emitToBoth("game:stopwatch_stop", {
      turnNumber: this.state.turnNumber,
      stopwatchValueMs: elapsedMs,
    });

    this.processTurnResult(elapsedMs);
  }

  private handleStopwatchTimeout() {
    this.setPhase("EVALUATING");
    this.broadcastState();

    const result: TurnResult = {
      eventType: "CORNER_START",
      stopwatchValueMs: 1998,
      goal: false,
      subGame: { type: "CORNER" },
    };

    this.processResult(result);
  }

  private processTurnResult(elapsedMs: number) {
    this.setPhase("EVALUATING");
    this.broadcastState();

    const result = evaluateStopwatch(Math.min(elapsedMs, 1998));
    this.processResult(result);
  }

  private async processResult(result: TurnResult) {
    await this.recordEvent(result);

    if (result.goal) {
      this.addScore(this.state.currentTurn);
    }

    switch (result.eventType) {
      case "DIRECT_GOAL":
        this.emitToBoth("game:result", {
          type: "DIRECT_GOAL",
          stopwatchValueMs: result.stopwatchValueMs,
          goal: true,
        });
        this.afterGoal();
        break;

      case "FREE_KICK_START":
        this.state.subGameData = result.subGame!;
        this.setPhase("FREE_KICK_SELECT");
        this.emitToBoth("game:result", {
          type: "FREE_KICK_START",
          stopwatchValueMs: result.stopwatchValueMs,
          goal: false,
        });
        this.emitToCurrent("game:sub_game", { type: "FREE_KICK" });
        break;

      case "PENALTY_START":
        this.state.subGameData = result.subGame!;
        this.setPhase("PENALTY_SELECT");
        this.emitToBoth("game:result", {
          type: "PENALTY_START",
          stopwatchValueMs: result.stopwatchValueMs,
          goal: false,
        });
        this.emitToCurrent("game:sub_game", { type: "PENALTY" });
        break;

      case "CORNER_START":
        this.state.subGameData = result.subGame!;
        this.setPhase("CORNER_SELECT");
        this.emitToBoth("game:result", {
          type: "CORNER_START",
          stopwatchValueMs: result.stopwatchValueMs,
          goal: false,
        });
        this.emitToCurrent("game:sub_game", { type: "CORNER" });
        break;

      default:
        this.emitToBoth("game:result", {
          type: "SAVE",
          stopwatchValueMs: result.stopwatchValueMs,
          goal: false,
        });
        this.afterGoal();
    }
  }

  handleFreeKickSelect(digit: number) {
    if (this.state.phase !== "FREE_KICK_SELECT") return;
    this.state.subGameData = { type: "FREE_KICK", selection: String(digit) };
    this.setPhase("STOPWATCH_RUNNING");
    this.state.turnStartTime = Date.now();
    this.emitToCurrent("game:stopwatch_start", {
      turnNumber: this.state.turnNumber,
      subGame: true,
    });

    this.turnTimeout = setTimeout(() => {
      if (this.state.phase === "STOPWATCH_RUNNING") {
        this.handleSubStopwatchTimeout();
      }
    }, 2000);
  }

  handlePenaltySelect(even: boolean) {
    if (this.state.phase !== "PENALTY_SELECT") return;
    this.state.subGameData = {
      type: "PENALTY",
      selection: even ? "even" : "odd",
    };
    this.setPhase("STOPWATCH_RUNNING");
    this.state.turnStartTime = Date.now();
    this.emitToCurrent("game:stopwatch_start", {
      turnNumber: this.state.turnNumber,
      subGame: true,
    });

    this.turnTimeout = setTimeout(() => {
      if (this.state.phase === "STOPWATCH_RUNNING") {
        this.handleSubStopwatchTimeout();
      }
    }, 2000);
  }

  handleCornerSelect(digits: number) {
    if (this.state.phase !== "CORNER_SELECT") return;
    this.state.subGameData = {
      type: "CORNER",
      selection: String(digits).padStart(2, "0"),
    };
    this.setPhase("STOPWATCH_RUNNING");
    this.state.turnStartTime = Date.now();
    this.emitToCurrent("game:stopwatch_start", {
      turnNumber: this.state.turnNumber,
      subGame: true,
    });

    this.turnTimeout = setTimeout(() => {
      if (this.state.phase === "STOPWATCH_RUNNING") {
        this.handleSubStopwatchTimeout();
      }
    }, 1200);
  }

  handleSubStopwatchStop() {
    if (this.state.phase !== "STOPWATCH_RUNNING" || !this.state.subGameData)
      return;

    if (this.turnTimeout) {
      clearTimeout(this.turnTimeout);
      this.turnTimeout = null;
    }

    const now = Date.now();
    const elapsedMs = now - this.state.turnStartTime;

    this.setPhase("EVALUATING");
    this.broadcastState();

    const subGame = this.state.subGameData;
    let goal = false;
    let goalEventType: GameEventType = "MISS";

    switch (subGame.type) {
      case "FREE_KICK": {
        const selectedDigit = parseInt(subGame.selection ?? "0", 10);
        goal = evaluateNumberGuess(selectedDigit, elapsedMs);
        goalEventType = goal ? "FREE_KICK_GOAL" : "FREE_KICK_MISS";
        break;
      }
      case "PENALTY": {
        const even = subGame.selection === "even";
        goal = evaluateEvenOdd(even, elapsedMs);
        goalEventType = goal ? "PENALTY_GOAL" : "PENALTY_MISS";
        break;
      }
      case "CORNER": {
        const guess = parseInt(subGame.selection ?? "0", 10);
        goal = evaluateCornerGuess(guess, elapsedMs);
        goalEventType = goal ? "CORNER_GOAL" : "CORNER_MISS";
        break;
      }
    }

    if (goal) {
      this.addScore(this.state.currentTurn);
    }

    this.state.subGameData = null;

    this.emitToBoth("game:result", {
      type: goalEventType,
      stopwatchValueMs: elapsedMs,
      goal,
      subGame,
    });

    this.afterGoal();
  }

  private handleSubStopwatchTimeout() {
    this.handleSubStopwatchStop();
  }

  private afterGoal() {
    const elapsed = Date.now() - this.state.matchStartTime;
    const totalTime = MATCH_DURATION_MS + this.state.stoppageTimeMs;

    if (elapsed >= totalTime) {
      this.endMatch();
      return;
    }

    this.switchTurn();
    setTimeout(() => this.beginTurn(), 1500);
  }

  private async endMatch() {
    if (this.state.phase === "MATCH_END") return;
    this.setPhase("MATCH_END");

    if (this.matchInterval) clearInterval(this.matchInterval);
    if (this.turnTimeout) clearTimeout(this.turnTimeout);

    const p1Score = this.state.player1Score;
    const p2Score = this.state.player2Score;
    let winnerId: string | null = null;

    if (this.state.mode === "SOLO") {
      if (p1Score > 0) winnerId = this.state.player1.userId;
    } else {
      if (p1Score > p2Score) winnerId = this.state.player1.userId;
      else if (p2Score > p1Score) winnerId = this.state.player2.userId;
    }

    await prisma.game.update({
      where: { id: this.state.gameId },
      data: {
        status: "FINISHED",
        winnerId,
        endedAt: new Date(),
        player1Score: p1Score,
        player2Score: p2Score,
      },
    });

    this.emitToBoth("game:match_end", {
      winnerId,
      player1Score: p1Score,
      player2Score: p2Score,
      player1Id: this.state.player1.userId,
      player2Id: this.state.player2.userId,
    });

    if (this.onMatchEndCallback) {
      await this.onMatchEndCallback(this);
    }

    GameRoomManager.removeRoom(this.state.gameId);
  }

  private async recordEvent(result: TurnResult) {
    const playerId = this.currentPlayer.userId;
    try {
      await prisma.gameEvent.create({
        data: {
          gameId: this.state.gameId,
          playerId,
          type: result.eventType,
          turnNumber: this.state.turnNumber,
          stopwatchValueMs: result.stopwatchValueMs,
          matched: result.goal,
          selectedValue: this.state.subGameData?.selection ?? null,
        },
      });
    } catch (err) {
      logger.error("Failed to record game event", { err });
    }
  }

  cleanup() {
    if (this.matchInterval) clearInterval(this.matchInterval);
    if (this.turnTimeout) clearTimeout(this.turnTimeout);
  }
}

export class GameRoomManager {
  private static rooms = new Map<string, GameRoom>();

  static createRoom(
    gameId: string,
    player1: PlayerConnection,
    player2: PlayerConnection,
    emit1: EventCallback,
    emit2: EventCallback,
    options?: GameRoomOptions,
  ): GameRoom {
    const room = new GameRoom(gameId, player1, player2, emit1, emit2, options);
    this.rooms.set(gameId, room);
    return room;
  }

  static getRoom(gameId: string): GameRoom | undefined {
    return this.rooms.get(gameId);
  }

  static removeRoom(gameId: string) {
    const room = this.rooms.get(gameId);
    if (room) {
      room.cleanup();
      this.rooms.delete(gameId);
    }
  }

  static getRoomByUserId(userId: string): GameRoom | undefined {
    for (const room of this.rooms.values()) {
      if (
        room.state.player1.userId === userId ||
        room.state.player2.userId === userId
      ) {
        return room;
      }
    }
    return undefined;
  }
}
