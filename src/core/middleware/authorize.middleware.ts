import type { NextFunction, Request, Response } from "express";

import { sendResponse } from "@/core/utils";
import { JwtUtils } from "@/core/utils/jwt";
import { Role } from "@/prisma/enums";

export const authorize = (...roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers["authorization"];

    if (!header?.startsWith("Bearer ")) {
      sendResponse.unauthorized(res, "Authentication required.");
      return;
    }

    const token = header.split(" ")[1]!;
    const payload = await JwtUtils.verify(token);

    if (!payload) {
      sendResponse.unauthorized(res, "Invalid or expired token.");
      return;
    }

    req.user = payload;

    if (roles.length > 0 && !roles.includes(req.user?.role as Role)) {
      sendResponse.forbidden(res, "Insufficient permissions");
      return;
    }

    next();
  };
};
