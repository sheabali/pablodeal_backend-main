import { Router } from "express";

import { adRewardRouter } from "@/features/ad-reward/ad-reward.routes";
import { authRouter } from "@/features/auth/auth.routes";
import { goalRouter } from "@/features/league/goal.routes";
import { leagueRouter } from "@/features/league/league.routes";
import { notificationRouter } from "@/features/notification/notification.routes";
import { paymentRouter } from "@/features/payment/payment.routes";
import { rankedRouter } from "@/features/ranked/ranked.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/ranked", rankedRouter);
router.use("/league", leagueRouter);
router.use("/notifications", notificationRouter);
router.use("/payments", paymentRouter);
router.use("/ads", adRewardRouter);
router.use("/goals", goalRouter);

export { router };
