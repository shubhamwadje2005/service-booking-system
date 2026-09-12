import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { FRONTEND_URL, PORT } from "./config/env";
import authRoutes from "./routes/auth.routes";
import { serviceRouter, adminServiceRouter } from "./routes/service.routes";
import bookingRouter from "./routes/booking.routes";
import adminBookingRouter from "./routes/admin.booking.routes";
import adminDashboardRouter from "./routes/dashboard.routes";
import uploadRouter from "./routes/upload.routes";
import { errorHandler } from "./middleware/error.middleware";
import { seedAdmin } from "./seed";

const app = express();

// Middlewares
app.use(cookieParser());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

// Base Health Check
app.get("/", (_req, res) => {
  res.json({ message: "API running successfully" });
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