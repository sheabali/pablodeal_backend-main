import type { JwtPayload } from "@/core/utils";

declare module "express" {
  interface Request {
    user?: JwtPayload;
  }
}
