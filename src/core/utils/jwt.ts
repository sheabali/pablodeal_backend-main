import { jwtVerify, SignJWT } from "jose";

import { config } from "@/core/config";
import { Role } from "@/prisma/enums";

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  sessionId?: string;
}

const secret = new TextEncoder().encode(config.auth.jwtSecret);

const sign = async (payload: JwtPayload): Promise<string> => {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(config.auth.jwtExpiresIn)
    .sign(secret);
};

const verify = async (token: string): Promise<JwtPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
};

export const JwtUtils = { sign, verify };
