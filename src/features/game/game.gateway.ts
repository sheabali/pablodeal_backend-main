import { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import type { Socket } from "socket.io";

import { JwtUtils } from "@/core/utils/jwt";
import { logger } from "@/core/logger";
import { MatchmakingService } from "@/features/matchmaking/matchmaking.service";
import { prisma } from "@/core/database";
import { GameRoomManager } from "./game.room";
import type { PlayerConnection } from "./game.types";
import {
  subscribeLeagueBroadcasts,
  type LeagueSocketEvent,
} from "@/features/league/league.broadcast";

let io: Server | null = null;

export function setupGameGateway(httpServer: HTTPServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth["token"] ?? socket.handshake.query["token"];
      if (!token || typeof token !== "string") {
        return next(new Error("Authentication required"));
      }
      const payload = await JwtUtils.verify(token);
      if (!payload || !payload.userId) {
        return next(new Error("Invalid token"));
      }
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  setupLeagueBroadcasts();

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;
    logger.info("Player connected", { userId, socketId: socket.id });

    socket.on("league:join", async (data: { leagueId: string }) => {
      try {
        const team = await prisma.leagueTeam.findUnique({
          where: {
            leagueId_userId: { leagueId: data.leagueId, userId },
          },
        });
        const league = await prisma.league.findUnique({
          where: { id: data.leagueId },
        });

        if (!team && !league) {
          socket.emit("league:error", { message: "League not found" });
          return;
        }

        const isAdmin = league?.adminId === userId;
        if (!team && !isAdmin) {
          socket.emit("league:error", {
            message: "You are not a member of this league",
          });
          return;
        }

        socket.join(`league:${data.leagueId}`);
        socket.data.leagueIds = [
          ...new Set([...(socket.data.leagueIds ?? []), data.leagueId]),
        ];
        logger.info("Joined league room", {
          userId,
          leagueId: data.leagueId,
        });
      } catch (err) {
        logger.error("League join error", { err, userId });
        socket.emit("league:error", { message: "Failed to join league" });
      }
    });

    socket.on("league:leave", (data: { leagueId: string }) => {
      socket.leave(`league:${data.leagueId}`);
      socket.data.leagueIds = (socket.data.leagueIds ?? []).filter(
        (id: string) => id !== data.leagueId,
      );
      logger.info("Left league room", { userId, leagueId: data.leagueId });
    });

    socket.on(
      "matchmaking:join",
      async (data: { type: "casual" | "ranked" }) => {
        try {
          let result;
          if (data.type === "ranked") {
            result = await MatchmakingService.joinRanked(userId, socket.id);
          } else {
            result = await MatchmakingService.joinCasual(userId, socket.id);
          }

          if (result.matched && result.gameId && result.opponentId) {
            const p1: PlayerConnection = {
              userId,
              socketId: socket.id,
              score: 0,
            };
            const p2: PlayerConnection = {
              userId: result.opponentId,
              socketId: "",
              score: 0,
            };

            const opponentSocket = await findSocketByUserId(result.opponentId);
            if (!opponentSocket) {
              socket.emit("matchmaking:error", {
                message: "Opponent disconnected",
              });
              return;
            }

            p2.socketId = opponentSocket.id;

            const room = GameRoomManager.createRoom(
              result.gameId,
              p1,
              p2,
              (event, data) => socket.emit(event, data),
              (event, data) => opponentSocket.emit(event, data),
            );

            joinGameRoom(socket, result.gameId);
            joinGameRoom(opponentSocket, result.gameId);

            socket.emit("game:match_found", {
              gameId: result.gameId,
              opponentId: result.opponentId,
              yourSide: "player1",
            });
            opponentSocket.emit("game:match_found", {
              gameId: result.gameId,
              opponentId: userId,
              yourSide: "player2",
            });

            room.startMatch();
          }
        } catch (err) {
          logger.error("Matchmaking error", { err, userId });
          socket.emit("matchmaking:error", {
            message: "Failed to join queue",
          });
        }
      },
    );

    socket.on("matchmaking:leave", async () => {
      await MatchmakingService.leave(userId);
      logger.info("Left matchmaking", { userId });
    });

    socket.on("game:start_stopwatch", () => {
      const room = GameRoomManager.getRoomByUserId(userId);
      if (!room) return;
      room.handleStartStopwatch();
    });

    socket.on("game:stop_stopwatch", () => {
      const room = GameRoomManager.getRoomByUserId(userId);
      if (!room) return;
      room.handleStopStopwatch();
    });

    socket.on("game:free_kick_select", (data: { digit: number }) => {
      const room = GameRoomManager.getRoomByUserId(userId);
      if (!room) return;
      room.handleFreeKickSelect(data.digit);
    });

    socket.on("game:penalty_select", (data: { even: boolean }) => {
      const room = GameRoomManager.getRoomByUserId(userId);
      if (!room) return;
      room.handlePenaltySelect(data.even);
    });

    socket.on("game:corner_select", (data: { digits: number }) => {
      const room = GameRoomManager.getRoomByUserId(userId);
      if (!room) return;
      room.handleCornerSelect(data.digits);
    });

    socket.on("game:sub_stopwatch_stop", () => {
      const room = GameRoomManager.getRoomByUserId(userId);
      if (!room) return;
      room.handleSubStopwatchStop();
    });

    socket.on("disconnect", async () => {
      logger.info("Player disconnected", { userId, socketId: socket.id });
      await MatchmakingService.leave(userId);
    });
  });

  return io;
}

function setupLeagueBroadcasts() {
  subscribeLeagueBroadcasts((payload: LeagueSocketEvent) => {
    if (!io) return;
    io.to(`league:${payload.leagueId}`).emit(payload.event, payload.data);
    logger.info("League broadcast forwarded", {
      leagueId: payload.leagueId,
      event: payload.event,
    });
  });
}

async function findSocketByUserId(userId: string): Promise<Socket | null> {
  if (!io) return null;
  const sockets = await io.fetchSockets();
  for (const s of sockets) {
    if (s.data.userId === userId) {
      return s as unknown as Socket;
    }
  }
  return null;
}

function joinGameRoom(socket: Socket, gameId: string) {
  socket.join(`game:${gameId}`);
}

export function getIO(): Server | null {
  return io;
}
