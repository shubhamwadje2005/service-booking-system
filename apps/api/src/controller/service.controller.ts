import { Request, Response, NextFunction } from "express";
import { eq, ne, and, or, ilike, desc, asc, SQL } from "drizzle-orm";
import db from "../config/db";
import { services, ServiceSelect, ServiceInsert } from "../model/services";
import { bookings } from "../model/bookings";
import { Service, AvailabilitySlot, AvailabilityResponse } from "@repo/types";
import { NotFoundError, AppError } from "../utils/errors";
import { CreateServiceInput, UpdateServiceInput } from "../validator/service.validator";
import {
  BUSINESS_HOURS_START,
  BUSINESS_HOURS_END,
  timeToMinutes,
  minutesToTime,
  addMinutesToTime,
  isOverlap,
  isPastTimeToday,
} from "../utils/time";
import memoryCache from "../utils/cache";

const invalidateServiceCaches = () => {
  memoryCache.clearPrefix("services:");
  memoryCache.clearPrefix("service:");
  memoryCache.clearPrefix("dashboard:");
};

/**
 * Normalizes a database service record to the shared Service domain type.
 * Price is stored in PostgreSQL as numeric(10,2) and must be converted to a JavaScript number.
 */
export const formatService = (service: ServiceSelect): Service => {
  let parsedSlots: string[] | null = null;
  if (service.customSlots) {
    try {
      parsedSlots = JSON.parse(service.customSlots);
    } catch {
      parsedSlots = null;
    }
  }
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    price: Number(service.price),
    duration: service.duration,
    isActive: service.isActive,
    image: service.image || null,
    customSlots: parsedSlots,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
};

/**
 * Public: Get active services with optional search filter.
 * GET /api/services
 */
export const getServices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const cacheKey = `services:public:${search || "all"}`;

    const cached = memoryCache.get<Service[]>(cacheKey);
    if (cached) {
      res.setHeader("Cache-Control", "public, max-age=15, stale-while-revalidate=60");
      res.status(200).json({
        success: true,
        message: "Services retrieved successfully",
        data: cached,
      });
      return;
    }

    const conditions: SQL[] = [eq(services.isActive, true)];

    if (search) {
      const searchPattern = `%${search}%`;
      const searchCondition = or(
        ilike(services.name, searchPattern),
        ilike(services.description, searchPattern)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    const rows = await db
      .select()
      .from(services)
      .where(and(...conditions))
      .orderBy(desc(services.createdAt));

    const formatted = rows.map(formatService);
    memoryCache.set(cacheKey, formatted, 60);

    res.setHeader("Cache-Control", "public, max-age=15, stale-while-revalidate=60");
    res.status(200).json({
      success: true,
      message: "Services retrieved successfully",
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public: Get service by ID.
 * Inactive services are hidden from public view (returns 404).
 * GET /api/services/:id
 */
export const getServiceById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const cacheKey = `service:public:${id}`;

    const cached = memoryCache.get<Service>(cacheKey);
    if (cached) {
      res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
      res.status(200).json({
        success: true,
        message: "Service retrieved successfully",
        data: cached,
      });
      return;
    }

    const [row] = await db
      .select()
      .from(services)
      .where(eq(services.id, id));

    if (!row || !row.isActive) {
      throw new NotFoundError("Service not found");
    }

    const formatted = formatService(row);
    memoryCache.set(cacheKey, formatted, 60);

    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    res.status(200).json({
      success: true,
      message: "Service retrieved successfully",
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get all services (both active and inactive) for administrative management.
 * GET /api/admin/services
 */
export const getAdminServices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const active = typeof req.query.active === "string" ? req.query.active.trim() : "";
    const cacheKey = `services:admin:${search || "all"}:${active || "all"}`;

    const cached = memoryCache.get<Service[]>(cacheKey);
    if (cached) {
      res.status(200).json({
        success: true,
        message: "Admin services retrieved successfully",
        data: cached,
      });
      return;
    }

    const conditions: SQL[] = [];

    if (active === "true") {
      conditions.push(eq(services.isActive, true));
    } else if (active === "false") {
      conditions.push(eq(services.isActive, false));
    }

    if (search) {
      const searchPattern = `%${search}%`;
      const searchCondition = or(
        ilike(services.name, searchPattern),
        ilike(services.description, searchPattern)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    const rows = conditions.length > 0
      ? await db.select().from(services).where(and(...conditions)).orderBy(desc(services.createdAt))
      : await db.select().from(services).orderBy(desc(services.createdAt));

    const formatted = rows.map(formatService);
    memoryCache.set(cacheKey, formatted, 30);

    res.status(200).json({
      success: true,
      message: "Admin services retrieved successfully",
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Create a new service.
 * POST /api/admin/services
 */
export const createService = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body: CreateServiceInput = req.body;

    const customSlotsStr = body.customSlots && body.customSlots.length > 0
      ? JSON.stringify(body.customSlots)
      : null;

    const [created] = await db
      .insert(services)
      .values({
        name: body.name,
        description: body.description ?? null,
        price: body.price.toFixed(2),
        duration: body.duration,
        isActive: body.isActive ?? true,
        image: body.image ?? null,
        customSlots: customSlotsStr,
      })
      .returning();

    if (!created) {
      throw new AppError("Failed to create service", 500);
    }

    invalidateServiceCaches();

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: formatService(created),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update an existing service.
 * PUT /api/admin/services/:id
 */
export const updateService = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const body: UpdateServiceInput = req.body;

    const [existing] = await db
      .select()
      .from(services)
      .where(eq(services.id, id));

    if (!existing) {
      throw new NotFoundError("Service not found");
    }

    const updatePayload: Partial<ServiceInsert> = {};

    if (body.name !== undefined) {
      updatePayload.name = body.name;
    }
    if (body.description !== undefined) {
      updatePayload.description = body.description;
    }
    if (body.price !== undefined) {
      updatePayload.price = body.price.toFixed(2);
    }
    if (body.duration !== undefined) {
      updatePayload.duration = body.duration;
    }
    if (body.isActive !== undefined) {
      updatePayload.isActive = body.isActive;
    }
    if (body.image !== undefined) {
      updatePayload.image = body.image ?? null;
    }
    if (body.customSlots !== undefined) {
      updatePayload.customSlots = body.customSlots && body.customSlots.length > 0
        ? JSON.stringify(body.customSlots)
        : null;
    }

    // If no fields provided to change, return existing
    if (Object.keys(updatePayload).length === 0) {
      res.status(200).json({
        success: true,
        message: "Service updated successfully",
        data: formatService(existing),
      });
      return;
    }

    updatePayload.updatedAt = new Date();

    const [updated] = await db
      .update(services)
      .set(updatePayload)
      .where(eq(services.id, id))
      .returning();

    if (!updated) {
      throw new AppError("Failed to update service", 500);
    }

    invalidateServiceCaches();

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: formatService(updated),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Soft delete (deactivate) a service.
 * Sets isActive = false. Does NOT physically delete to preserve booking references and audit history.
 * DELETE /api/admin/services/:id
 */
export const deleteService = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);

    const [existing] = await db
      .select()
      .from(services)
      .where(eq(services.id, id));

    if (!existing) {
      throw new NotFoundError("Service not found");
    }

    // If already inactive, return clean response without re-modifying
    if (!existing.isActive) {
      res.status(200).json({
        success: true,
        message: "Service is already inactive",
        data: formatService(existing),
      });
      return;
    }

    const [deactivated] = await db
      .update(services)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))
      .returning();

    if (!deactivated) {
      throw new AppError("Failed to deactivate service", 500);
    }

    invalidateServiceCaches();

    res.status(200).json({
      success: true,
      message: "Service deactivated successfully",
      data: formatService(deactivated),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public: Get real-time availability slots for a service on a given date.
 * GET /api/services/:id/availability?date=YYYY-MM-DD
 */
export const getServiceAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const date = String(req.query.date);

    // Fetch active service and existing bookings concurrently
    const [serviceResult, existingBookings] = await Promise.all([
      db.select().from(services).where(eq(services.id, id)),
      db.select().from(bookings).where(
        and(
          eq(bookings.serviceId, id),
          eq(bookings.bookingDate, date),
          ne(bookings.status, "CANCELLED")
        )
      ),
    ]);

    const service = serviceResult[0];

    if (!service || !service.isActive) {
      throw new NotFoundError("Service not found or is currently inactive");
    }

    // Parse custom slots if configured by admin
    let activeSlotStarts: string[] = [];
    if (service.customSlots) {
      try {
        const parsed = JSON.parse(service.customSlots);
        if (Array.isArray(parsed) && parsed.length > 0) {
          activeSlotStarts = parsed;
        }
      } catch {
        activeSlotStarts = [];
      }
    }

    const slots: AvailabilitySlot[] = [];

    if (activeSlotStarts.length > 0) {
      // Sort slots chronologically
      activeSlotStarts.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));

      for (const slotStart of activeSlotStarts) {
        const slotEnd = addMinutesToTime(slotStart, service.duration);

        // Check collision with any existing PENDING, CONFIRMED, or COMPLETED booking
        const hasConflict = existingBookings.some((b) =>
          isOverlap(slotStart, slotEnd, b.startTime, b.endTime)
        );

        const isPast = isPastTimeToday(date, slotStart);
        const isAvailable = !hasConflict && !isPast;

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          isAvailable,
          available: isAvailable,
        });
      }
    } else {
      // Default: Generate slots within working hours
      let currentMin = timeToMinutes(BUSINESS_HOURS_START);
      const endMin = timeToMinutes(BUSINESS_HOURS_END);

      while (currentMin + service.duration <= endMin) {
        const slotStart = minutesToTime(currentMin);
        const slotEnd = minutesToTime(currentMin + service.duration);

        // Check collision with any existing PENDING, CONFIRMED, or COMPLETED booking
        const hasConflict = existingBookings.some((b) =>
          isOverlap(slotStart, slotEnd, b.startTime, b.endTime)
        );

        const isPast = isPastTimeToday(date, slotStart);
        const isAvailable = !hasConflict && !isPast;

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          isAvailable,
          available: isAvailable,
        });

        currentMin += service.duration;
      }
    }

    const responseData: AvailabilityResponse = {
      serviceId: service.id,
      serviceName: service.name,
      duration: service.duration,
      date,
      workingHours: {
        start: BUSINESS_HOURS_START,
        end: BUSINESS_HOURS_END,
      },
      slots,
    };

    res.status(200).json({
      success: true,
      message: "Availability retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};
