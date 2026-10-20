import type { NextFunction, Request, Response } from "express";
import { createHash } from "node:crypto";

import { config } from "@/core/config";

import { LOGIN_PAGE } from "./bullboard.login";

const COOKIE_NAME = "bull_token";

const signToken = (): string => {
  const payload = `${config.bullboard.user}:${Date.now()}`;
  const hmac = createHash("sha256")
    .update(`${payload}:${config.bullboard.secret}`)
    .digest("hex");
  return `${payload}:${hmac}`;
};

const verifyToken = (token: string): boolean => {
  const parts = token.split(":");
  if (parts.length < 3) return false;
  const payload = parts.slice(0, -1).join(":");
  const sig = parts[parts.length - 1]!;
  const expected = createHash("sha256")
    .update(`${payload}:${config.bullboard.secret}`)
    .digest("hex");
  return sig === expected;
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Login form
  if (req.method === "GET" && req.path === "/login") {
    return res.type("html").send(LOGIN_PAGE);
  }

  // Login submit
  if (req.method === "POST" && req.path === "/login") {
    const { user, pass } = req.body ?? {};
    if (user === config.bullboard.user && pass === config.bullboard.pass) {
      res.cookie(COOKIE_NAME, signToken(), {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24,
        path: "/admin/queues",
      });
      return res.redirect("/admin/queues");
    }
    return res.redirect("/admin/queues/login?error=1");
  }

  // Logout
  if (req.method === "GET" && req.path === "/logout") {
    res.clearCookie(COOKIE_NAME, { path: "/admin/queues" });
    return res.redirect("/admin/queues/login");
  }

  // All other routes — check cookie
  const token = req.cookies?.[COOKIE_NAME];
  if (!token || !verifyToken(token)) {
    return res.redirect("/admin/queues/login");
  }

  next();
};
