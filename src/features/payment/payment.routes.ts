import express, { Router } from "express";

import { StatusCodes } from "@/core/constants";
import { authorize } from "@/core/middleware/authorize.middleware";
import { validateBody } from "@/core/middleware/validate.middleware";
import { sendResponse } from "@/core/utils";
import { throwError } from "@/core/utils/app-error";
import { catchAsync } from "@/core/utils/catch-async";
import { z } from "zod";

import { prisma } from "@/core/database";
import { logger } from "@/core/logger";
import { LeagueService } from "@/features/league/league.service";
import { StripeService } from "./stripe.service";

import { JwtUtils } from "@/core/utils/jwt";
import { announceActivity } from "@/features/league/league.broadcast";
import { NotificationService } from "@/features/notification/notification.service";

const router = Router();

const createCheckoutSchema = z.object({
  leagueId: z.string().min(1),
  redirect: z.boolean().optional(),
});

router.post(
  "/checkout",
  authorize(),
  validateBody(createCheckoutSchema),
  catchAsync(async (req, res) => {
    const userId = req.user!.userId;
    const { leagueId, redirect } = req.body;
    const shouldRedirect =
      redirect === true ||
      req.query["redirect"] === "true" ||
      req.query["redirect"] === "1";

    const league = await prisma.league.findUnique({
      where: { id: leagueId },
    });
    if (!league) throwError(StatusCodes.NOT_FOUND, "League not found");

    const team = await prisma.leagueTeam.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    });
    if (!team) {
      throwError(StatusCodes.FORBIDDEN, "You are not a member of this league");
    }

    const leagueConfig = await LeagueService.getConfig();

    const result = await StripeService.createCheckoutSession({
      userId,
      leagueId,
      packSize: leagueConfig.packSize,
      priceCents: leagueConfig.packPriceCents,
      leagueName: league.name,
    });

    const checkoutUrl = result.checkoutUrl || result.url;

    if (shouldRedirect) {
      return res.redirect(303, checkoutUrl);
    }

    sendResponse.ok(res, "Checkout session created", {
      sessionId: result.sessionId,
      url: checkoutUrl,
      checkoutUrl,
      requiresPayment: true,
      packSize: leagueConfig.packSize,
      priceCents: leagueConfig.packPriceCents,
    });
  }),
);

router.get(
  "/checkout",
  catchAsync(async (req, res) => {
    let userId: string | undefined;

    // Check authorization header first, then query token
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const payload = await JwtUtils.verify(authHeader.slice(7));
      if (payload?.userId) userId = payload.userId;
    } else if (req.query["token"] && typeof req.query["token"] === "string") {
      const payload = await JwtUtils.verify(req.query["token"]);
      if (payload?.userId) userId = payload.userId;
    }

    if (!userId) {
      throwError(StatusCodes.UNAUTHORIZED, "Authentication required");
    }

    const leagueId = req.query["leagueId"] as string;
    if (!leagueId) {
      throwError(StatusCodes.BAD_REQUEST, "Missing leagueId query parameter");
    }

    const league = await prisma.league.findUnique({
      where: { id: leagueId },
    });
    if (!league) throwError(StatusCodes.NOT_FOUND, "League not found");

    const team = await prisma.leagueTeam.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    });
    if (!team) {
      throwError(StatusCodes.FORBIDDEN, "You are not a member of this league");
    }

    const leagueConfig = await LeagueService.getConfig();

    const result = await StripeService.createCheckoutSession({
      userId,
      leagueId,
      packSize: leagueConfig.packSize,
      priceCents: leagueConfig.packPriceCents,
      leagueName: league.name,
    });

    const checkoutUrl = result.checkoutUrl || result.url;

    if (req.query["redirect"] !== "false") {
      return res.redirect(303, checkoutUrl);
    }

    sendResponse.ok(res, "Checkout session created", {
      sessionId: result.sessionId,
      url: checkoutUrl,
      checkoutUrl,
      requiresPayment: true,
      packSize: leagueConfig.packSize,
      priceCents: leagueConfig.packPriceCents,
    });
  }),
);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  catchAsync(async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;
    if (!signature) {
      throwError(StatusCodes.BAD_REQUEST, "Missing stripe-signature header");
    }

    logger.info("Stripe webhook received", {
      signature: signature.slice(0, 10) + "...",
    });

    const result = await StripeService.handleWebhook(req.body, signature);

    if (result?.type === "payment_completed") {
      const { userId, leagueId, packSize } = result;

      logger.info("Stripe webhook payment completed", {
        userId,
        leagueId,
        packSize,
      });

      const matchday = await prisma.matchday.findFirst({
        where: { leagueId, status: "OPEN" },
      });

      if (matchday) {
        const team = await prisma.leagueTeam.findUnique({
          where: { leagueId_userId: { leagueId, userId } },
        });

        if (team) {
          const teamEntry = await prisma.matchdayEntry.findUnique({
            where: {
              matchdayId_teamId: {
                matchdayId: matchday.id,
                teamId: team.id,
              },
            },
          });

          if (teamEntry) {
            await prisma.matchdayEntry.update({
              where: { id: teamEntry.id },
              data: {
                purchasedAttempts: teamEntry.purchasedAttempts + packSize,
              },
            });
            logger.info("Attempt pack credited via webhook", {
              userId,
              leagueId,
              packSize,
            });

            announceActivity(
              leagueId,
              `${team.name} has purchased ${packSize} additional attempt(s)`,
              { teamId: team.id, packSize },
            );

            await NotificationService.create({
              userId,
              title: "Attempt Pack Purchased",
              body: `You received ${packSize} extra attempts for Matchday #${matchday.number}!`,
              type: "attempt_purchased",
              data: { leagueId, matchdayId: matchday.id, packSize },
            });
          }
        }
      }
    } else {
      logger.warn("Stripe webhook event ignored", {
        result: result ?? "null",
      });
    }

    res.status(200).json({ received: true });
  }),
);

export { router as paymentRouter };
