import { StatusCodes } from "@/core/constants";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly data: unknown;

  constructor(statusCode: number, message: string, data?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.name = "AppError";
  }
}

export function throwError(
  statusCode: number,
  message: string,
  data?: unknown,
): never {
  throw new AppError(statusCode, message, data);
}

export function assertFound<T>(
  value: T | null | undefined,
  statusCode?: number,
  message?: string,
): asserts value is T {
  if (value == null)
    throw new AppError(
      statusCode ?? StatusCodes.NOT_FOUND,
      message ?? "Not found",
    );
}

export function assertCondition(
  condition: boolean,
  statusCode?: number,
  message?: string,
): asserts condition is true {
  if (!condition)
    throw new AppError(
      statusCode ?? StatusCodes.BAD_REQUEST,
      message ?? "Assertion failed",
    );
}
