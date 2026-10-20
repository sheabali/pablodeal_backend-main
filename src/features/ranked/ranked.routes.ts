import { Router } from "express";

import { authorize } from "@/core/middleware/authorize.middleware";
import * as rankedController from "./ranked.controller";

const router = Router({ mergeParams: true });

router.get("/profile", authorize(), rankedController.getProfile);
router.get("/leaderboard", rankedController.getLeaderboard);
router.get("/history", authorize(), rankedController.getMatchHistory);
router.get("/season", rankedController.getActiveSeason);
router.get("/stats", authorize(), rankedController.getStats);

export { router as rankedRouter };
