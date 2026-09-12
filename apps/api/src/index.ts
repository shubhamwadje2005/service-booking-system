import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { FRONTEND_URL, LIVE_URL, LOCAL_URL, PORT } from "./config/env";
import authRoutes from "./routes/auth.routes";
import { serviceRouter, adminServiceRouter } from "./routes/service.routes";
import bookingRouter from "./routes/booking.routes";
import adminBookingRouter from "./routes/admin.booking.routes";
import adminDashboardRouter from "./routes/dashboard.routes";
import uploadRouter from "./routes/upload.routes";
import { errorHandler } from "./middleware/error.middleware";
import { seedAdmin } from "./seed";

const app = express();

// Trust reverse proxy (essential for secure cookies on Render, Railway, Fly.io)
app.set("trust proxy", 1);

// Middlewares
app.use(cookieParser());

const allowedOrigins = [
  FRONTEND_URL,
  LIVE_URL,
  LOCAL_URL,
  "http://localhost:3000",
  "http://localhost:5000",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);
app.use(express.json());

// Health and Status Check
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Service Booking API is running",
  });
});

app.get("/api", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Service Booking API is running",
    version: "1.0.0",
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Service Booking API is running",
    timestamp: new Date().toISOString(),
  });
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// Service Routes
app.use("/api/services", serviceRouter);
app.use("/api/admin/services", adminServiceRouter);

// Booking Routes
app.use("/api/bookings", bookingRouter);
app.use("/api/admin/bookings", adminBookingRouter);

// Dashboard Routes
app.use("/api/admin/dashboard", adminDashboardRouter);

// Upload Routes (Admin Cloudinary Media)
app.use("/api/admin/upload", uploadRouter);

// 404 Catch-all Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Requested API endpoint not found.",
    error: "Not Found",
  });
});

// Centralized Error Handling
app.use(errorHandler);

const serverPort = Number(PORT) || 5000;

if (require.main === module) {
  app.listen(serverPort, async () => {
    console.log(`Server running on port ${serverPort}`);
    await seedAdmin();
  });
}

export default app;
// @ts-ignore
module.exports = app;