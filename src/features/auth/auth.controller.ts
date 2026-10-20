import type { Request, Response } from "express";

import { StatusCodes } from "@/core/constants";
import { config } from "@/core/config";
import { prisma } from "@/core/database";
import { sendResponse } from "@/core/utils";
import { catchAsync } from "@/core/utils/catch-async";
import { JwtUtils } from "@/core/utils/jwt";

import { AuthService } from "./auth.service";
import {
  loginSchema,
  signupSchema,
  verifyEmailSchema,
} from "./auth.validation";

export const signup = catchAsync(async (req: Request, res: Response) => {
  const { email, password, name } = signupSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.verified) {
    sendResponse.error(res, "Email already in use.", StatusCodes.CONFLICT);
    return;
  }

  const userId =
    existing?.id ?? (await AuthService.createUser(email, password, name)).id;

  const rawToken = await AuthService.createVerificationToken(
    userId,
    "MAGIC_LINK",
  );

  const data: Record<string, string> = {};

  if (config.app.env === "development") {
    data["verificationLink"] =
      `${config.app.serverUrl}/api/v1/auth/verify-email?token=${rawToken}&email=${email}`;
    data["rawToken"] = rawToken;
  }

  sendResponse.ok(
    res,
    "Account created. Please check your email to verify.",
    data,
  );
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await AuthService.verifyPassword(email, password);
  if (!user) {
    sendResponse.unauthorized(res, "Invalid email or password.");
    return;
  }

  const { sessionToken } = await AuthService.createSession(
    user.id,
    req.headers["user-agent"],
    req.ip,
  );

  const jwt = await JwtUtils.sign({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  sendResponse.ok(res, "Authenticated", {
    token: jwt,
    sessionToken,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

export const verifyEmailPost = catchAsync(
  async (req: Request, res: Response) => {
    const { token, email } = verifyEmailSchema.parse(req.body);

    const user = await AuthService.verifyEmail(token, email);
    if (!user) {
      sendResponse.badRequest(res, "Invalid or expired token.");
      return;
    }

    sendResponse.ok(res, "Email verified successfully.");
  },
);

export const verifyEmailGet = catchAsync(
  async (req: Request, res: Response) => {
    const token = (req.query["token"] as string) ?? "";
    const email = (req.query["email"] as string) ?? "";

    const user = await AuthService.verifyEmail(token, email);
    if (!user) {
      res.redirect(`${config.app.frontendUrl}/error`);
      return;
    }

    res.redirect(`${config.app.frontendUrl}/login`);
  },
);
