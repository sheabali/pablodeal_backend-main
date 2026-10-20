import { Router } from "express";

import { authorize } from "@/core/middleware/authorize.middleware";
import { validateBody } from "@/core/middleware/validate.middleware";
import { z } from "zod";
import { catchAsync } from "@/core/utils/catch-async";
import { sendResponse } from "@/core/utils";

import { AdRewardService } from "./ad-reward.service";

const router = Router();

const verifyAdSchema = z.object({
  leagueId: z.string().min(1),
  adProvider: z.string().min(1),
  adImpressionId: z.string().min(1),
});

router.post(
  "/verify",
  authorize(),
  validateBody(verifyAdSchema),
  catchAsync(async (req, res) => {
    const userId = req.user!.userId;
    const { leagueId, adProvider, adImpressionId } = req.body;

    const result = await AdRewardService.verifyAndGrant({
      userId,
      leagueId,
      adProvider,
      adImpressionId,
    });

    sendResponse.ok(res, "Ad reward granted", result);
  }),
);

export { router as adRewardRouter };
