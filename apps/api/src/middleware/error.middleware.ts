import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { NODE_ENV, PRODUCTION } from "../config/env";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Operational App Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: getErrorTitle(err.statusCode),
    });
    return;
  }

  // Zod Validation Errors
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    const message = firstIssue ? firstIssue.message : "Validation failed";
    res.status(400).json({
      success: false,
      message,
      error: "Bad Request",
    });
    return;
  }

  // PostgreSQL Duplicate Key Violation (code 23505)
  if ("code" in err && (err as { code: string }).code === "23505") {
    res.status(409).json({
      success: false,
      message: "A record with these details already exists.",
      error: "Conflict",
    });
    return;
  }

  // Unhandled / Unexpected Server Errors
  if (NODE_ENV !== PRODUCTION) {
    console.error("[Unhandled Server Error]:", err);
  } else {
    console.error("[Unhandled Server Error]:", err.message);
  }

  res.status(500).json({
    success: false,
    message: "An internal server error occurred.",
    error: "Internal Server Error",
  });
};

const getErrorTitle = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
      return "Bad Request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Not Found";
    case 409:
      return "Conflict";
    case 429:
      return "Too Many Requests";
    default:
      return "Server Error";
  }
};
