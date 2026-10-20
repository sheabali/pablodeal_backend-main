// src/core/database/redis.ts
import Redis from "ioredis";

// src/core/database/redis.ts
import { config } from "@/core/config";

export const redisConfig = {
  host: config.db.redisHost,
  port: config.db.redisPort,
  password: config.db.redisPassword,
  username: config.db.redisUsername,

  // Add other connection options as needed
};

export const redis = new Redis(config.db.redisUrl, {
  maxRetriesPerRequest: null, // Required for BullMQ
});
