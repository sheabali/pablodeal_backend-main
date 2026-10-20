import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/prisma/client";

import "dotenv/config";

import { config } from "../config";

const connectionString = config.db.url;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
  adapter,
  log: config.app.env === "development" ? ["error"] : ["error"],
});

export { prisma };
