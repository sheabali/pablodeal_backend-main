import type { NextFunction, Request, Response } from "express";

import { logger } from "@/core/logger";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startTime = Date.now();

  const ignoreRouteList = ["/public", "/favicon.ico", "/api/v1/health"];

  const shouldIgnore =
    ignoreRouteList.some((route) => req.path.startsWith(route)) ||
    req.path.startsWith("/admin/");

  if (shouldIgnore) return next();

  res.on("finish", () => {
    if (ignoreRouteList.some((route) => req.path.startsWith(route))) {
      return;
    }
    const duration = Date.now() - startTime;
    const status = res.statusCode;

    const err = res.locals?.["error"] as
      { message: string; stack?: string } | undefined;

    const msg = [
      `${req.method} ${req.originalUrl || req.url}`,
      `${status}`,
      `${duration}ms`,
      req.ip,
      err?.message,
    ]
      .filter(Boolean)
      .join(" — ");

    if (status >= 500) {
      logger.error(msg);
    } else if (status >= 400) {
      logger.warn(msg);
    } else {
      logger.info(msg);
    }

    if (err?.stack) {
      logger.error(`TRACE:\n${err.stack}`);
    }
  });

  next();
};
