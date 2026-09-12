import jwt, { JwtPayload } from "jsonwebtoken";
import { Response } from "express";
import { JWT_KEY, COOKIE_NAME, ADMIN_COOKIE_NAME, NODE_ENV, PRODUCTION } from "../config/env";
import { UserRole } from "@repo/types";

export interface TokenPayload {
  id: string;
  role: UserRole;
}

const JWT_EXPIRES_IN = "30d";
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_KEY, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_KEY) as JwtPayload & Partial<TokenPayload>;
    if (!decoded || typeof decoded !== "object" || !decoded.id) {
      return null;
    }
    return {
      id: decoded.id,
      role: (decoded.role as UserRole) || "CUSTOMER",
    };
  } catch {
    return null;
  }
};

const isProd = NODE_ENV === PRODUCTION;
const sameSitePolicy = isProd ? "none" : "lax";

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSitePolicy,
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  });
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSitePolicy,
    path: "/",
  });
  res.cookie(COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSitePolicy,
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  });
};

export const setAdminAuthCookie = (res: Response, token: string): void => {
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSitePolicy,
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  });
};

export const clearAdminAuthCookie = (res: Response): void => {
  res.clearCookie(ADMIN_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSitePolicy,
    path: "/",
  });
  res.cookie(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSitePolicy,
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  });
};
