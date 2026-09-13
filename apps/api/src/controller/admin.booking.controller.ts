import { Request, Response, NextFunction } from "express";
import { eq, ne, and, or, ilike, desc, count, sql, SQL } from "drizzle-orm";
import db from "../config/db";
import { bookings } from "../model/bookings";
import { users } from "../model/users";
import { services } from "../model/services";
import { BookingStatus } from "@repo/types";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  AppError,
} from "../utils/errors";
import { formatBooking } from "./booking.controller";
import { isOverlap } from "../utils/time";
import {
  AdminBookingsQueryInput,
  UpdateBookingStatusInput,
} from "../validator/booking.validator";
import memoryCache from "../utils/cache";

/**
 * Admin: Retrieve paginated, filtered, and searchable list of all bookings.
 * GET /api/admin/bookings
 */
export const getAdminBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query as unknown as AdminBookingsQueryInput;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const status = query.status;
    const date = query.date;
    const serviceId = query.serviceId;
    const search = query.search?.trim();

    const conditions: (SQL | undefined)[] = [];

    if (status) {
      conditions.push(eq(bookings.status, status));
    }

    if (date) {
      conditions.push(eq(bookings.bookingDate, date));
    }

    if (serviceId) {
      conditions.push(eq(bookings.serviceId, serviceId));
    }

    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Concurrently fetch total count and paginated items
    const [[countResult], rows] = await Promise.all([
      db
        .select({ total: count() })
        .from(bookings)
        .innerJoin(users, eq(bookings.customerId, users.id))
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .where(whereClause),
      db
        .select({
          booking: bookings,
          customer: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
          service: {
            id: services.id,
            name: services.name,
            duration: services.duration,
            price: services.price,
          },
        })
        .from(bookings)
        .innerJoin(users, eq(bookings.customerId, users.id))
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .where(whereClause)
        .orderBy(desc(bookings.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
    ]);

    const total = Number(countResult?.total || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    const items = rows.map((r) =>
      formatBooking(r.booking, r.service, r.customer)
    );

    res.status(200).json({
      success: true,
      message: "Admin bookings retrieved successfully",
      data: {
        items,
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Retrieve single booking details by ID with customer & service details.
 * GET /api/admin/bookings/:id
 */
export const getAdminBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);

    const [row] = await db
      .select({
        booking: bookings,
        customer: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        service: {
          id: services.id,
          name: services.name,
          duration: services.duration,
          price: services.price,
        },
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.customerId, users.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(bookings.id, id));

    if (!row) {
      throw new NotFoundError("Booking not found");
    }

    res.status(200).json({
      success: true,
      message: "Admin booking retrieved successfully",
      data: formatBooking(row.booking, row.service, row.customer),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update booking status with strict state machine and collision detection.
 * PATCH /api/admin/bookings/:id/status
 */
export const updateAdminBookingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const body: UpdateBookingStatusInput = req.body;
    const newStatus: BookingStatus = body.status;

    // Fetch existing booking with service and customer
    const [existing] = await db
      .select({
        booking: bookings,
        customer: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        service: {
          id: services.id,
          name: services.name,
          duration: services.duration,
          price: services.price,
        },
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.customerId, users.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(bookings.id, id));

    if (!existing) {
      throw new NotFoundError("Booking not found");
    }

    const currentStatus = existing.booking.status as BookingStatus;

    // If already in target status, return existing
    if (currentStatus === newStatus) {
      res.status(200).json({
        success: true,
        message: `Booking is already ${newStatus}`,
        data: formatBooking(existing.booking, existing.service, existing.customer),
      });
      return;
    }

    // If confirming or completing booking, check for collisions inside a serialized transaction
    const updated = await db.transaction(async (tx) => {
      if (newStatus === "CONFIRMED" || newStatus === "COMPLETED") {
        // Advisory lock on service + date
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${existing.booking.serviceId} || ${existing.booking.bookingDate}));`
        );

        // Check conflicting active bookings (PENDING, CONFIRMED, COMPLETED), excluding this booking
        const conflictingBookings = await tx
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.serviceId, existing.booking.serviceId),
              eq(bookings.bookingDate, existing.booking.bookingDate),
              ne(bookings.id, id),
              ne(bookings.status, "CANCELLED")
            )
          );

        const hasConflict = conflictingBookings.some((b) =>
          isOverlap(
            existing.booking.startTime.slice(0, 5),
            existing.booking.endTime.slice(0, 5),
            b.startTime.slice(0, 5),
            b.endTime.slice(0, 5)
          )
        );

        if (hasConflict) {
          throw new ConflictError(
            "Cannot confirm booking: the requested time slot conflicts with another active booking"
          );
        }
      }

      const [resUpdate] = await tx
        .update(bookings)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, id))
        .returning();

      if (!resUpdate) {
        throw new AppError("Failed to update booking status", 500);
      }

      return resUpdate;
    });

    memoryCache.clearPrefix("dashboard:");

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${newStatus} successfully`,
      data: formatBooking(updated, existing.service, existing.customer),
    });
  } catch (error) {
    next(error);
  }
};
