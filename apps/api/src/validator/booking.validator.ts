import { z } from "zod";
import {
  isValidDateString,
  isPastDate,
  timeToMinutes,
  BUSINESS_HOURS_START,
  BUSINESS_HOURS_END,
} from "../utils/time";

export const availabilityQuerySchema = z.object({
  date: z
    .string({ message: "Date is required" })
    .trim()
    .refine((val) => isValidDateString(val), {
      message: "Invalid date format. Expected valid YYYY-MM-DD calendar date",
    })
    .refine((val) => !isPastDate(val), {
      message: "Cannot check availability for past dates",
    }),
});

export const createBookingSchema = z.object({
  serviceId: z
    .string({ message: "Service ID is required" })
    .uuid("Invalid service ID format"),
  bookingDate: z
    .string({ message: "Booking date is required" })
    .trim()
    .refine((val) => isValidDateString(val), {
      message: "Invalid date format. Expected valid YYYY-MM-DD calendar date",
    })
    .refine((val) => !isPastDate(val), {
      message: "Cannot book appointments for past dates",
    }),
  startTime: z
    .string({ message: "Start time is required" })
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Start time must be formatted as HH:mm (24-hour)")
    .refine(
      (val) => {
        const mins = timeToMinutes(val);
        return mins >= timeToMinutes(BUSINESS_HOURS_START) && mins < timeToMinutes(BUSINESS_HOURS_END);
      },
      {
        message: `Start time must be within working hours (${BUSINESS_HOURS_START} to ${BUSINESS_HOURS_END})`,
      }
    ),
});

export const bookingIdParamSchema = z.object({
  id: z.string({ message: "Booking ID is required" }).uuid("Invalid booking ID format"),
});

export const adminBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(10),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"], {
    message: "Invalid status value. Must be PENDING, CONFIRMED, COMPLETED, or CANCELLED",
  }).optional(),
  date: z
    .string()
    .trim()
    .refine((val) => isValidDateString(val), {
      message: "Invalid date format. Expected valid YYYY-MM-DD calendar date",
    })
    .optional(),
  serviceId: z.string().uuid("Invalid service ID format").optional(),
  search: z.string().trim().max(100, "Search query cannot exceed 100 characters").optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"], {
    message: "Status must be one of PENDING, CONFIRMED, COMPLETED, CANCELLED",
  }),
});

export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingIdParamInput = z.infer<typeof bookingIdParamSchema>;
export type AdminBookingsQueryInput = z.infer<typeof adminBookingsQuerySchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;

