import { prisma } from "@/core/database";
import { logger } from "@/core/logger";
import type {
  CreateNotificationInput,
  SendPushInput,
} from "./notification.types";

export const NotificationService = {
  async create(input: CreateNotificationInput) {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        body: input.body,
        type: input.type,
        data: (input.data ?? {}) as any,
      },
    });

    await this.sendPush({
      userId: input.userId,
      title: input.title,
      body: input.body,
      data: input.data,
    });

    return notification;
  },

  async createBulk(
    userIds: string[],
    title: string,
    body: string,
    type: CreateNotificationInput["type"],
    data?: Record<string, unknown>,
  ) {
    if (userIds.length === 0) return [];

    const notifications = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title,
        body,
        type,
        data: (data ?? {}) as any,
      })),
    });

    for (const userId of userIds) {
      await this.sendPush({ userId, title, body, data });
    }

    return notifications;
  },

  async getForUser(userId: string, unreadOnly = false) {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  },

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },

  async registerDeviceToken(userId: string, token: string, platform: string) {
    return prisma.deviceToken.upsert({
      where: { token },
      update: { active: true, platform },
      create: { userId, token, platform },
    });
  },

  async removeDeviceToken(token: string) {
    return prisma.deviceToken.updateMany({
      where: { token },
      data: { active: false },
    });
  },

  async sendPush(input: SendPushInput) {
    const deviceTokens = await prisma.deviceToken.findMany({
      where: { userId: input.userId, active: true },
    });

    if (deviceTokens.length === 0) {
      logger.info("No device tokens for user", { userId: input.userId });
      return;
    }

    // Placeholder for push notification providers (FCM, APNs, etc.)
    // In production, integrate with firebase-admin or a push service
    for (const device of deviceTokens) {
      logger.info("Push notification sent", {
        userId: input.userId,
        platform: device.platform,
        title: input.title,
      });
    }
  },
};
