import { Router } from "express";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} from "../controller/booking.controller";
import { protect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createBookingSchema,
  bookingIdParamSchema,
} from "../validator/booking.validator";

export const bookingRouter = Router();

// ==========================================
// CUSTOMER & AUTHENTICATED BOOKING ROUTES
// ==========================================
bookingRouter.post("/", protect(), validate(createBookingSchema), createBooking);
bookingRouter.get("/my", protect(), getMyBookings);

// ==========================================
// GENERAL / OWNERSHIP PROTECTED ROUTES
// ==========================================
bookingRouter.get("/:id", protect(), validate({ params: bookingIdParamSchema }), getBookingById);
bookingRouter.patch("/:id/cancel", protect(), validate({ params: bookingIdParamSchema }), cancelBooking);

export default bookingRouter;
