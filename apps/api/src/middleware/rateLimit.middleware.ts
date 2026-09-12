import { Request, Response, NextFunction } from "express";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

/**
 * Lightweight, dependency-free in-memory rate limiter for sensitive endpoints.
 */
export const rateLimit = (options: RateLimitOptions) => {
  const { windowMs, max, message = "Too many requests. Please try again later." } = options;
  const store = new Map<string, ClientRecord>();

  // Cleanup expired client records periodically to avoid memory growth
  const cleanupInterval = Math.max(windowMs, 60000);
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, cleanupInterval);

  // Unref timer so it doesn't block Node.js process exit
  if (timer.unref) {
    timer.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment or health check, skip rate limiting
    if (process.env.NODE_ENV === "test") {
      next();
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();

    let record = store.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      store.set(ip, record);
      next();
      return;
    }

    record.count++;

    if (record.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      res.setHeader("Retry-After", retryAfterSeconds);
      res.status(429).json({
        success: false,
        message,
        error: "Too Many Requests",
      });
      return;
    }

    next();
  };
};
