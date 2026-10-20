import type { NextFunction, Request, Response } from "express";
import { Router } from "express";

import { authorize } from "@/core/middleware/authorize.middleware";
import { uploadCrest } from "@/core/middleware/upload.middleware";
import { validateBody } from "@/core/middleware/validate.middleware";
import { sendResponse } from "@/core/utils";
import { Role } from "@/prisma/enums";

import { prisma } from "@/core/database";
import * as leagueController from "./league.controller";
import {
  createLeagueSchema,
  finishAttemptSchema,
  joinLeagueSchema,
  recordHitSchema,
  recordSubHitSchema,
  saveGoalSchema,
  updateConfigSchema,
} from "./league.validation";

const router = Router({ mergeParams: true });

router.get("/config", authorize(Role.ADMIN), leagueController.getConfig);
router.put(
  "/config",
  authorize(Role.ADMIN),
  validateBody(updateConfigSchema),
  leagueController.updateConfig,
);

router.post(
  "/",
  authorize(),
  validateBody(createLeagueSchema),
  leagueController.createLeague,
);
router.get("/", authorize(), leagueController.listLeagues);
router.post(
  "/join",
  authorize(),
  validateBody(joinLeagueSchema),
  leagueController.joinLeague,
);

router.get("/:leagueId", authorize(), leagueController.getLeague);
router.get("/:leagueId/teams", authorize(), leagueController.listTeams);
router.post("/:leagueId/start", authorize(), leagueController.startLeague);
router.get("/:leagueId/standings", authorize(), leagueController.getStandings);
router.get("/:leagueId/schedule", authorize(), leagueController.getSchedule);
router.get("/:leagueId/current", authorize(), leagueController.getCurrent);
router.get(
  "/:leagueId/matchday-live",
  authorize(),
  leagueController.getMatchdayLive,
);
router.get(
  "/:leagueId/matchdays/:number",
  authorize(),
  leagueController.getMatchday,
);
router.post(
  "/:leagueId/attempts/ad",
  authorize(),
  leagueController.grantAdAttempt,
);
router.post(
  "/:leagueId/attempts/purchase",
  authorize(),
  leagueController.purchaseAttemptPack,
);
router.get(
  "/:leagueId/attempts/purchase",
  authorize(),
  leagueController.purchaseAttemptPack,
);

// League Game Attempts API (ball hits, sub-hits, start, finish, history)
router.post(
  "/:leagueId/attempts/start",
  authorize(),
  leagueController.startAttempt,
);
router.post(
  "/:leagueId/attempts/hit",
  authorize(),
  validateBody(recordHitSchema),
  leagueController.recordHit,
);
router.post(
  "/:leagueId/attempts/sub-hit",
  authorize(),
  validateBody(recordSubHitSchema),
  leagueController.recordSubHit,
);
router.post(
  "/:leagueId/attempts/finish",
  authorize(),
  validateBody(finishAttemptSchema),
  leagueController.finishAttempt,
);
router.get(
  "/:leagueId/attempts/history",
  authorize(),
  leagueController.getAttemptHistory,
);

// Goal Saving API
router.post(
  "/:leagueId/goals/save",
  authorize(),
  validateBody(saveGoalSchema),
  leagueController.saveGoal,
);
router.get(
  "/:leagueId/goals/saved",
  authorize(),
  leagueController.getSavedGoals,
);
router.delete(
  "/:leagueId/goals/:goalId",
  authorize(),
  leagueController.deleteSavedGoal,
);

router.post(
  "/:leagueId/crest",
  authorize(),
  uploadCrest.single("crest"),
  (req: Request, res: Response, next: NextFunction) => {
    (async () => {
      const userId = (req as any).user!.userId;
      const leagueId = String(req.params["leagueId"]);

      const team = await prisma.leagueTeam.findUnique({
        where: { leagueId_userId: { leagueId: leagueId!, userId } },
      });
      if (!team) {
        return sendResponse.forbidden(
          res,
          "You are not a member of this league",
        );
      }

      if (!req.file) {
        return sendResponse.badRequest(res, "No file uploaded");
      }

      const crestUrl = `/public/uploads/crests/${req.file.filename}`;

      const updated = await prisma.leagueTeam.update({
        where: { id: team.id },
        data: { crestUrl },
      });

      sendResponse.ok(res, "Crest uploaded", { crestUrl: updated.crestUrl });
    })().catch(next);
  },
);

export { router as leagueRouter };
