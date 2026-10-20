import { Router } from "express";

import { authorize } from "@/core/middleware/authorize.middleware";
import { validateBody } from "@/core/middleware/validate.middleware";
import { z } from "zod";
import { catchAsync } from "@/core/utils/catch-async";
import { sendResponse } from "@/core/utils";

import { NotificationService } from "./notification.service";

const router = Router();

const registerTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]),
});

router.get(
  "/",
  authorize(),
  catchAsync(async (req, res) => {
    const userId = req.user!.userId;
    const unreadOnly = req.query["unread"] === "true";
    const notifications = await NotificationService.getForUser(
      userId,
      unreadOnly,
    );
    sendResponse.ok(res, "Notifications", notifications);
  }),
);

router.get(
  "/unread-count",
  authorize(),
  catchAsync(async (req, res) => {
    const userId = req.user!.userId;
    const count = await NotificationService.getUnreadCount(userId);
    sendResponse.ok(res, "Unread count", { count });
  }),
);

router.post(
  "/read/:notificationId",
  authorize(),
  catchAsync(async (req, res) => {
    const userId = req.user!.userId;
    const notificationId = String(req.params["notificationId"]);
    await NotificationService.markAsRead(notificationId, userId);
    sendResponse.ok(res, "Marked as read");
  }),
);

router.post(
  "/read-all",
  authorize(),
  catchAsync(async (req, res) => {
    const userId = req.user!.userId;
    await NotificationService.markAllAsRead(userId);
    sendResponse.ok(res, "All notifications marked as read");
  }),
);

router.post(
  "/device-token",
  authorize(),
  validateBody(registerTokenSchema),
  catchAsync(async (req, res) => {
    const userId = req.user!.userId;
    const { token, platform } = req.body;
    await NotificationService.registerDeviceToken(userId, token, platform);
    sendResponse.ok(res, "Device token registered");
  }),
);

router.delete(
  "/device-token",
  authorize(),
  validateBody(z.object({ token: z.string() })),
  catchAsync(async (req, res) => {
    const token: string = req.body.token;
    await NotificationService.removeDeviceToken(token);
    sendResponse.ok(res, "Device token removed");
  }),
);

export { router as notificationRouter };
