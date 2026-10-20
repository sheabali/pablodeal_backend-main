import crypto from "crypto";

import { config } from "@/core/config";
import { prisma } from "@/core/database";

const TOKEN_BYTE_LENGTH = 32;
const TOKEN_EXPIRY_MS = config.auth.tokenExpiryMinutes * 60 * 1000;
const SESSION_EXPIRY_MS = config.auth.sessionExpiryDays * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(TOKEN_BYTE_LENGTH).toString("hex");
  return { raw, hash: hashToken(raw) };
}

export const AuthService = {
  async createUser(email: string, password: string, name?: string) {
    const hashed = await Bun.password.hash(password);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role: "USER" },
    });

    await prisma.playerStats.create({ data: { userId: user.id } });

    return user;
  },

  async verifyPassword(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const valid = await Bun.password.verify(password, user.password);
    if (!valid) return null;
    return user;
  },

  async createVerificationToken(
    userId: string,
    type: "MAGIC_LINK" | "RESET_PASSWORD" | "NEW_EMAIL",
  ) {
    await prisma.verificationToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });

    const { raw, hash } = generateToken();
    await prisma.verificationToken.create({
      data: {
        userId,
        tokenHash: hash,
        type,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
      },
    });

    return raw;
  },

  async verifyEmail(token: string, email: string) {
    const tokenHash = hashToken(token);
    const record = await prisma.verificationToken.findFirst({
      where: {
        tokenHash,
        type: "MAGIC_LINK",
        usedAt: null,
        expiresAt: { gte: new Date() },
      },
      include: { user: true },
    });

    if (!record || record.user.email !== email) return null;

    await prisma.$transaction([
      prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: { verified: true },
      }),
    ]);

    return record.user;
  },

  async createSession(userId: string, userAgent?: string, ip?: string) {
    const { raw, hash } = generateToken();
    const refreshRaw = crypto.randomBytes(TOKEN_BYTE_LENGTH).toString("hex");

    await prisma.session.create({
      data: {
        userId,
        tokenHash: hash,
        refreshToken: refreshRaw,
        userAgent,
        ip,
        expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
      },
    });

    return { sessionToken: raw, refreshToken: refreshRaw };
  },
};
