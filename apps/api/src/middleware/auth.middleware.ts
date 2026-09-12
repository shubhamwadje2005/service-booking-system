import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import db from "../config/db";
import { users } from "../model/users";
import { verifyToken } from "../utils/token";
import { COOKIE_NAME, ADMIN_COOKIE_NAME } from "../config/env";
import { User, UserRole } from "@repo/types";

type MiddlewareFn = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const verifyAndAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
  allowedRoles: UserRole[]
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. If route strictly requires ADMIN only:
    if (allowedRoles.length === 1 && allowedRoles[0] === "ADMIN") {
      if (req.cookies && req.cookies[ADMIN_COOKIE_NAME]) {
        token = req.cookies[ADMIN_COOKIE_NAME];
      } else if (req.cookies && req.cookies[COOKIE_NAME]) {
        token = req.cookies[COOKIE_NAME];
      }
    } else {
      // 2. Customer or general route: check customer COOKIE_NAME first, fallback to ADMIN_COOKIE_NAME
      if (req.cookies && req.cookies[COOKIE_NAME]) {
        token = req.cookies[COOKIE_NAME];
      } else if (req.cookies && req.cookies[ADMIN_COOKIE_NAME]) {
        token = req.cookies[ADMIN_COOKIE_NAME];
      }
    }

    // 3. Fallback to Authorization Bearer header if present
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      const isRoleAdmin = allowedRoles.includes("ADMIN");
      res.status(401).json({
        success: false,
        message: isRoleAdmin
          ? "Administrator login required. Please sign in as admin."
          : "Authentication required. Please sign in.",
        error: "Unauthorized",
      });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired session. Please log in again.",
        error: "Unauthorized",
      });
      return;
    }

    // Always fetch latest authoritative user status & role from PostgreSQL
    const foundUser = await db.query.users.findFirst({
      where: eq(users.id, decoded.id),
    });

    if (!foundUser) {
      res.status(401).json({
        success: false,
        message: "User session is no longer active.",
        error: "Unauthorized",
      });
      return;
    }

    const safeUser: User = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role as UserRole,
      createdAt: foundUser.createdAt,
      updatedAt: foundUser.updatedAt,
    };

    // Role-based authorization check
    if (allowedRoles.length > 0 && !allowedRoles.includes(safeUser.role)) {
      res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
        error: "Forbidden",
      });
      return;
    }

    req.user = safeUser;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Authentication failed.",
      error: "Unauthorized",
    });
  }
};

/**
 * Reusable authentication and role authorization middleware.
 * Supports:
 * - protect(): any authenticated user
 * - protect("ADMIN"): authenticated ADMIN only
 * - protect("CUSTOMER"): authenticated CUSTOMER only
 * - protect(req, res, next): standard Express middleware usage without calling as a factory
 */
export function protect(...roles: UserRole[]): MiddlewareFn;
export function protect(req: Request, res: Response, next: NextFunction): Promise<void>;
export function protect(
  ...args: (UserRole | Request | Response | NextFunction)[]
): MiddlewareFn | Promise<void> {
  // Direct middleware usage: protect(req, res, next)
  if (
    args.length >= 2 &&
    typeof (args[0] as Request)?.headers === "object" &&
    typeof (args[1] as Response)?.status === "function"
  ) {
    const req = args[0] as Request;
    const res = args[1] as Response;
    const next = args[2] as NextFunction;
    return verifyAndAuthenticate(req, res, next, []);
  }

  // Factory usage: protect(), protect("ADMIN"), protect("CUSTOMER")
  const roles = args as UserRole[];
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return verifyAndAuthenticate(req, res, next, roles);
  };
}
