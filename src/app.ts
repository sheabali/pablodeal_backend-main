import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { config } from "@/core/config";
import { globalErrorHandler } from "@/core/middleware/error.middleware";
import { requestLogger } from "@/core/middleware/logger.middleware";
import { sendResponse } from "@/core/utils";
import { router as apiRouter } from "@/routes";

import { docsRouter } from "./features/docs/docs.routes";
import { MoviesService } from "./features/tmdb-movies/tmdb-movies.service";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const staticAllowed = [
        "http://127.0.0.1:5500",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://206.162.244.144:3099",
      ];

      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
        origin,
      );
      const isCustomAllowed =
        config.cors.origin !== "*" &&
        (Array.isArray(config.cors.origin)
          ? config.cors.origin.includes(origin)
          : config.cors.origin === origin);

      if (staticAllowed.includes(origin) || isLocalhost || isCustomAllowed) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  }),
);

// Stripe webhook needs raw body — conditional body parser
app.use((req, res, next) => {
  if (req.originalUrl === "/api/v1/payments/webhook") {
    express.raw({ type: "application/json" })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/public", express.static("public"));
app.use(express.static("public"));

app.use(requestLogger);

// mountBullBoard(app);

app.get("/", async (req, res) => {
  const movies = await MoviesService.discover({});

  sendResponse.ok(res, "Welcome to the API", movies);
});

app.use(docsRouter);

app.use("/api/v1", apiRouter);

app.use((_req, res) => {
  sendResponse.notFound(res, "Route not found", {
    route: _req.originalUrl,
    timeStamp: new Date().toISOString(),
  });
});

app.use(globalErrorHandler);

export { app };
