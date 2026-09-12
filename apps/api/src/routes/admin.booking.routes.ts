import { Router } from "express";
import {
  getAdminBookings,
  getAdminBookingById,
  updateAdminBookingStatus,
} from "../controller/admin.booking.controller";
import { protect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  adminBookingsQuerySchema,
  bookingIdParamSchema,
  updateBookingStatusSchema,
} from "../validator/booking.validator";

export const adminBookingRouter = Router();

// Strict RBAC: All admin booking endpoints require protect("ADMIN")
adminBookingRouter.use(protect("ADMIN"));

adminBookingRouter.get(
  "/",
  validate({ query: adminBookingsQuerySchema }),
  getAdminBookings
);

adminBookingRouter.get(
  "/:id",
  validate({ params: bookingIdParamSchema }),
  getAdminBookingById
);

adminBookingRouter.patch(
  "/:id/status",
  validate({ params: bookingIdParamSchema, body: updateBookingStatusSchema }),
  updateAdminBookingStatus
);

export default adminBookingRouter;
