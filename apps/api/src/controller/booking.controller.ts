import { Request, Response, NextFunction } from "express";
import { eq, ne, and, desc, sql } from "drizzle-orm";
import db from "../config/db";
import { bookings, BookingSelect } from "../model/bookings";
import { services } from "../model/services";
import { Booking, BookingStatus } from "@repo/types";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  AppError,
} from "../utils/errors";
import { assertOwnership } from "../utils/ownership";
import { CreateBookingInput } from "../validator/booking.validator";
import {
  BUSINESS_HOURS_START,
  BUSINESS_HOURS_END,
  timeToMinutes,
  addMinutesToTime,
  isOverlap,
  isPastTimeToday,
} from "../utils/time";

/**
 * Normalizes a database booking row into the shared domain Booking interface.
 */
export const formatBooking = (
  b: BookingSelect,
  serviceObj?: { id: string; name: string; duration: number; price: string | number },
  customerObj?: { id: string; name: string; email: string }
): Booking => {
  const result: Booking = {
    id: b.id,
    customerId: b.customerId,
    serviceId: b.serviceId,
    bookingDate: b.bookingDate,
    startTime: b.startTime.slice(0, 5),
    endTime: b.endTime.slice(0, 5),
    amount: Number(b.amount),
    status: b.status as BookingStatus,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };

  if (serviceObj) {
    result.service = {
      id: serviceObj.id,
      name: serviceObj.name,
      duration: serviceObj.duration,
      price: Number(serviceObj.price),
    };
  }

  if (customerObj) {
    result.customer = {
      id: customerObj.id,
      name: customerObj.name,
      email: customerObj.email,
    };
  }

  return result;
};

/**
 * Customer: Securely create a new booking.
 * Operates inside a serializing PostgreSQL transaction with advisory locks to prevent double-booking.
 * POST /api/bookings
 */
export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = req.user!.id;
    const body: CreateBookingInput = req.body;
    const { serviceId, bookingDate, startTime } = body;

    const createdBooking = await db.transaction(async (tx) => {
      // 1. Transaction-level advisory lock on (serviceId || bookingDate) to serialize concurrent bookings
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${serviceId} || ${bookingDate}));`
      );

      // 2. Fetch service from PostgreSQL
      const [service] = await tx
        .select()
        .from(services)
        .where(eq(services.id, serviceId));

      if (!service || !service.isActive) {
        throw new NotFoundError("Service not found or is currently inactive");
      }

      // 3. Compute endTime from database duration
      const duration = service.duration;
      const endTime = addMinutesToTime(startTime, duration);

      // 4. Validate working hours boundaries
      if (timeToMinutes(startTime) < timeToMinutes(BUSINESS_HOURS_START)) {
        throw new BadRequestError(`Start time cannot be before working hours (${BUSINESS_HOURS_START})`);
      }

      if (timeToMinutes(endTime) > timeToMinutes(BUSINESS_HOURS_END)) {
        throw new BadRequestError(`Booking duration extends beyond working hours (${BUSINESS_HOURS_END})`);
      }

      // 5. Reject slots in the past for today's date
      if (isPastTimeToday(bookingDate, startTime)) {
        throw new BadRequestError("Cannot book a time slot in the past");
      }

      // 6. Query existing active bookings for this service on this date (PENDING, CONFIRMED, COMPLETED)
      const existingBookings = await tx
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.serviceId, serviceId),
            eq(bookings.bookingDate, bookingDate),
            ne(bookings.status, "CANCELLED")
          )
        );

      // 7. Detect collision: newStart < existingEnd AND newEnd > existingStart
      const hasConflict = existingBookings.some((b) =>
        isOverlap(startTime, endTime, b.startTime, b.endTime)
      );

      if (hasConflict) {
        throw new ConflictError("The requested time slot has already been booked. Please choose another time.");
      }

      // 8. Insert new booking with DB service price and initial status 'PENDING'
      const [created] = await tx
        .insert(bookings)
        .values({
          customerId,
          serviceId: service.id,
          bookingDate,
          startTime,
          endTime,
          amount: service.price, // Authoritative price directly from PostgreSQL
          status: "PENDING",
        })
        .returning();

      if (!created) {
        throw new AppError("Failed to create booking", 500);
      }

      return { booking: created, service };
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: formatBooking(createdBooking.booking, createdBooking.service),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Customer: Retrieve all bookings placed by the authenticated customer.
 * GET /api/bookings/my
 */
export const getMyBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = req.user!.id;

    const rows = await db
      .select({
        booking: bookings,
        service: {
          id: services.id,
          name: services.name,
          duration: services.duration,
          price: services.price,
        },
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(bookings.customerId, customerId))
      .orderBy(desc(bookings.createdAt));

    const formatted = rows.map((r) => formatBooking(r.booking, r.service));

    res.status(200).json({
      success: true,
      message: "Customer bookings retrieved successfully",
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Customer/Admin: Retrieve booking details by ID with strict ownership validation.
 * GET /api/bookings/:id
 */
export const getBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);

    const [row] = await db
      .select({
        booking: bookings,
        service: {
          id: services.id,
          name: services.name,
          duration: services.duration,
          price: services.price,
        },
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(bookings.id, id));

    if (!row) {
      throw new NotFoundError("Booking not found");
    }

    // Verify ownership: customers can only view their own; admins can view any
    assertOwnership(req.user!, row.booking.customerId);

    res.status(200).json({
      success: true,
      message: "Booking retrieved successfully",
      data: formatBooking(row.booking, row.service),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Customer/Admin: Cancel an eligible booking (soft update to status = 'CANCELLED').
 * PATCH /api/bookings/:id/cancel
 */
export const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);

    const [existing] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id));

    if (!existing) {
      throw new NotFoundError("Booking not found");
    }

    // Verify ownership: customer can only cancel their own booking
    assertOwnership(req.user!, existing.customerId);

    if (existing.status === "COMPLETED") {
      throw new BadRequestError("Completed bookings cannot be cancelled");
    }

    if (existing.status === "CANCELLED") {
      res.status(200).json({
        success: true,
        message: "Booking is already cancelled",
        data: formatBooking(existing),
      });
      return;
    }

    const [updated] = await db
      .update(bookings)
      .set({
        status: "CANCELLED",
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, id))
      .returning();

    if (!updated) {
      throw new AppError("Failed to cancel booking", 500);
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: formatBooking(updated),
    });
  } catch (error) {
    next(error);
  }
};
