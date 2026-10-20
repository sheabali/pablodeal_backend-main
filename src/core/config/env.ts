import { z } from "zod";

const envSchema = z.object({
  PROJECT_NAME: z.string().default("My App"),

  PORT: z.coerce.number().default(3000),
  SERVER_URL: z.url().default("http://localhost:5037"),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string(),

  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_USERNAME: z.string().optional(),

  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),

  TMDB_API_KEY: z.string().optional(),
  TMDB_BASE_URL: z.string().default("https://api.themoviedb.org/3"),

  JWT_SECRET: z.string().default("dev-secret-change-in-production"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  BULL_USER: z.string().default("admin"),
  BULL_PASS: z.string().default("admin"),
  BULL_SECRET: z.string().default("bull-secret-change-in-production"),

  FRONTEND_URL: z.string().default("http://localhost:3000"),

  CORS_ORIGIN: z.string().default("*"),

  TOKEN_EXPIRY_MINUTES: z.coerce.number().default(15),
  SESSION_EXPIRY_DAYS: z.coerce.number().default(30),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_CURRENCY: z.string().default("eur"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  // Convert Zod errors to a flattened object for clean logging
  const formattedErrors = parsedEnv.error.issues.map((issue) => ({
    path: issue.path.join(","),
    message: issue.message,
  }));

  console.error("❌ Invalid environment variables detected at startup", {
    errors: formattedErrors,
  });

  process.exit(1);
}

export const env = parsedEnv.data;
