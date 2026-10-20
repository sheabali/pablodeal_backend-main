// src/core/cache/index.ts
import { redis } from "@/core/database/redis";

export const cache = {
  get: async (key: string) => await redis.get(key),
  set: async (key: string, value: string, ttl: number = 3600) =>
    await redis.set(key, value, "EX", ttl),
};
