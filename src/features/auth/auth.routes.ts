import { Router } from "express";

import { validateBody } from "@/core/middleware/validate.middleware";

import * as authController from "./auth.controller";
import {
  loginSchema,
  signupSchema,
  verifyEmailSchema,
} from "./auth.validation";

const router = Router({ mergeParams: true });

router.post("/signup", validateBody(signupSchema), authController.signup);
router.post("/login", validateBody(loginSchema), authController.login);
router.post(
  "/verify-email",
  validateBody(verifyEmailSchema),
  authController.verifyEmailPost,
);
router.get("/verify-email", authController.verifyEmailGet);

export { router as authRouter };
