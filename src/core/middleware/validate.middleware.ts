import type { NextFunction, Request, Response } from "express";
import { z, ZodError } from "zod";
import type { ZodType } from "zod";

import { StatusCodes } from "@/core/constants";
import { logger } from "@/core/logger";
import { AppError } from "@/core/utils/app-error";
import {
  formatFieldList,
  formatZodIssues,
} from "@/core/utils/format-zod-issues";

type SchemaInput = ZodType | ((req: Request) => ZodType);

export const validateBody = (schema: ZodType) =>
  validateRequest(z.object({ body: schema }));

interface ParsedRequest {
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export const validateRequest = (schema: SchemaInput) => {
  return async (req: Request, _: Response, next: NextFunction) => {
    try {
      const resolvedSchema =
        typeof schema === "function" ? schema(req) : schema;

      const parsed = (await resolvedSchema.parseAsync({
        body: req.body ?? {},
        query: req.query ?? {},
        params: req.params ?? {},
      })) as ParsedRequest;

      if (parsed.body) req.body = parsed.body;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const { formattedErrors, uniqueLabels } = formatZodIssues(error.issues);
        const fieldList = formatFieldList(uniqueLabels);

        logger.warn("Validation failed", {
          fields: uniqueLabels,
          errors: formattedErrors,
        });

        return next(
          new AppError(
            StatusCodes.UNPROCESSABLE_ENTITY,
            `Please provide valid ${fieldList}.`,
            formattedErrors,
          ),
        );
      }

      next(error);
    }
  };
};
