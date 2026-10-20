import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { StatusCodes } from "@/core/constants";
import { AppError } from "@/core/utils/app-error";
import { sendResponse } from "@/core/utils/send-response";

const ignoredPaths = ["/health", "/favicon.ico"];

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (res.headersSent) return;

  // Store on locals so requestLogger picks it up
  res.locals["error"] = { message: err.message, stack: err.stack };

  // Zod validation errors
  if (err instanceof ZodError) {
    const issues = (
      err as unknown as {
        issues: Array<{ path: (string | number)[]; message: string }>;
      }
    ).issues;

    const details = issues.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    }));
    (res.locals["error"] as Record<string, unknown>)["issues"] = details;

    if (ignoredPaths.includes(req.path)) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).end();
      return;
    }

    sendResponse.validationError(res, details, "Validation failed");
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    (res.locals["error"] as Record<string, unknown>)["statusCode"] =
      err.statusCode;

    if (ignoredPaths.includes(req.path)) {
      res.status(err.statusCode).end();
      return;
    }

    sendResponse.error(res, err.message, err.statusCode, err.data);
    return;
  }

  // Unknown/unhandled errors
  if (ignoredPaths.includes(req.path)) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    return;
  }

  sendResponse.error(res, "Something went wrong");
};
