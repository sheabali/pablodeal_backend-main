import chalk from "chalk";
import pino from "pino";

export type LogMetadata = Record<string, unknown>;

export interface ILogger {
  info: <T extends LogMetadata>(message: string, meta?: T) => void;
  error: <T extends LogMetadata>(message: string, meta?: T) => void;
  warn: <T extends LogMetadata>(message: string, meta?: T) => void;
  success: <T extends LogMetadata>(message: string, meta?: T) => void;
}

// Enable colors on Windows (chalk auto-detects TTY, but pino worker may not be a TTY)
chalk.level = 3;

const color = {
  info: (msg: string) => chalk.green(msg),
  warn: (msg: string) => chalk.yellowBright(msg),
  error: (msg: string) => chalk.redBright(msg),
  success: (msg: string) => chalk.greenBright(msg),
};

export const createPinoLogger = (): ILogger => {
  const isDev = process.env.NODE_ENV !== "production";

  const logger = pino({
    level: "info",
    transport: isDev
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  });

  return {
    info: (message, meta) => logger.info(meta as LogMetadata, message),
    error: (message, meta) =>
      logger.error(meta as LogMetadata, color.error(message)),
    warn: (message, meta) =>
      logger.warn(meta as LogMetadata, color.warn(message)),
    success: (message, meta) =>
      logger.info({ ...meta, type: "success" }, color.success(`✅ ${message}`)),
  };
};
