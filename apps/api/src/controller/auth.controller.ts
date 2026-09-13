import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import db from "../config/db";
import { users } from "../model/users";
import { hashPassword, comparePassword } from "../utils/password";
import {
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  setAdminAuthCookie,
  clearAdminAuthCookie,
} from "../utils/token";
import { User, UserRole, ApiResponse } from "@repo/types";

export const register = async (
  req: Request,
  res: Response<ApiResponse<User>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();

    // Check if email already exists in PostgreSQL
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email address already exists.",
        error: "Conflict",
      });
      return;
    }

    const hashedPassword = await hashPassword(password);

    // Registration ALWAYS enforces role = 'CUSTOMER'. Never trust client-supplied role.
    const [createdUser] = await db
      .insert(users)
      .values({
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "CUSTOMER",
      })
      .returning();

    if (!createdUser) {
      res.status(500).json({
        success: false,
        message: "Unable to create account. Please try again.",
        error: "Internal Server Error",
      });
      return;
    }

    // Prepare safe user object (password explicitly omitted)
    const safeUser: User = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role as UserRole,
      createdAt: createdUser.createdAt,
      updatedAt: createdUser.updatedAt,
    };

    const token = generateToken({ id: safeUser.id, role: safeUser.role });
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: "Customer account created successfully.",
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response<ApiResponse<User>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    // Generic error response to prevent user enumeration attacks
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        error: "Unauthorized",
      });
      return;
    }

    const isMatch = await comparePassword(String(password), user.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        error: "Unauthorized",
      });
      return;
    }

    // Prepare safe user object (password explicitly omitted)
    const safeUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const token = generateToken({ id: safeUser.id, role: safeUser.role });
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  _req: Request,
  res: Response<ApiResponse<void>>
): Promise<void> => {
  clearAuthCookie(res);
  clearAdminAuthCookie(res);
  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

export const getMe = async (
  req: Request,
  res: Response<ApiResponse<User>>
): Promise<void> => {
  // req.user is guaranteed by protect middleware
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Unauthorized. Session not found.",
      error: "Unauthorized",
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Authenticated session active.",
    data: req.user,
  });
};

export const adminLogin = async (
  req: Request,
  res: Response<ApiResponse<User>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid administrator credentials.",
        error: "Unauthorized",
      });
      return;
    }

    const isMatch = await comparePassword(String(password), user.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid administrator credentials.",
        error: "Unauthorized",
      });
      return;
    }

    if (user.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Access denied. Administrator privileges required.",
        error: "Forbidden",
      });
      return;
    }

    const safeUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const token = generateToken({ id: safeUser.id, role: safeUser.role });
    setAdminAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: "Admin authenticated successfully.",
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

export const adminLogout = async (
  _req: Request,
  res: Response<ApiResponse<void>>
): Promise<void> => {
  clearAdminAuthCookie(res);
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: "Admin logged out successfully.",
  });
};

export const adminGetMe = async (
  req: Request,
  res: Response<ApiResponse<User>>
): Promise<void> => {
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(401).json({
      success: false,
      message: "Administrator session not active.",
      error: "Unauthorized",
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Admin session active.",
    data: req.user,
  });
};
