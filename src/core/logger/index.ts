import { createPinoLogger, ILogger, LogMetadata } from "./providers";

export * from "./startup";

// Initialize the chosen provider
const loggerProvider: ILogger = createPinoLogger();

// Export the functional interface directly
export const logger = {
  info: <T extends LogMetadata>(msg: string, meta?: T) =>
    loggerProvider.info(msg, meta),
  error: <T extends LogMetadata>(msg: string, meta?: T) =>
    loggerProvider.error(msg, meta),
  warn: <T extends LogMetadata>(msg: string, meta?: T) =>
    loggerProvider.warn(msg, meta),
};
