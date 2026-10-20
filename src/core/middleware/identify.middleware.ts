import type { NextFunction, Request, Response } from "express";

import { JwtUtils, type JwtPayload } from "@/core/utils/jwt";

export type AuthUser = JwtPayload;

export const identify = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.headers["authorization"];

  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = header.split(" ")[1]!;
  const payload = await JwtUtils.verify(token);

  if (payload) {
    req.user = payload;
  }

  next();
};
