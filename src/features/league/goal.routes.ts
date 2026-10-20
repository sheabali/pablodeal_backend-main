import { Router } from "express";
import { authorize } from "@/core/middleware/authorize.middleware";
import { validateBody } from "@/core/middleware/validate.middleware";
import { saveGoalSchema } from "./league.validation";
import * as leagueController from "./league.controller";

const router = Router();

router.post(
  "/save",
  authorize(),
  validateBody(saveGoalSchema),
  leagueController.saveGoal,
);

router.get("/saved", authorize(), leagueController.getSavedGoals);

router.delete("/:goalId", authorize(), leagueController.deleteSavedGoal);

export { router as goalRouter };
