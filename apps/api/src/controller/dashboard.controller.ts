import { Request, Response, NextFunction } from "express";
import { eq, desc, count, sql } from "drizzle-orm";
import db from "../config/db";
import { bookings } from "../model/bookings";
import { users } from "../model/users";
import { services } from "../model/services";
import { DashboardStats } from "@repo/types";
import { formatBooking } from "./booking.controller";
import memoryCache from "../utils/cache";

/**
 * Admin: Retrieve consolidated business analytics and metrics.
 * Highly optimized with single aggregate SQL query and in-memory caching.
 * GET /api/admin/dashboard/stats
 */
export const getDashboardStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cacheKey = "dashboard:stats";
    const cached = memoryCache.get<DashboardStats>(cacheKey);
    if (cached) {
      res.status(200).json({
        success: true,
        message: "Dashboard statistics retrieved successfully",
        data: cached,
      });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    // Parallel execution of condensed aggregate query and auxiliary lookups
    const [bookingStatsRes, customersRes, activeServicesRes, recentRows] = await Promise.all([
      db.execute(sql`
        SELECT
          count(*)::int AS total_bookings,
          count(*) FILTER (WHERE status = 'PENDING')::int AS pending_bookings,
          count(*) FILTER (WHERE status = 'CONFIRMED')::int AS confirmed_bookings,
          count(*) FILTER (WHERE status = 'COMPLETED')::int AS completed_bookings,
          count(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled_bookings,
          coalesce(sum(amount) FILTER (WHERE status = 'COMPLETED'), 0)::numeric AS total_revenue,
          count(*) FILTER (WHERE booking_date = ${todayStr})::int AS today_bookings,
          count(*) FILTER (WHERE booking_date >= ${todayStr} AND status IN ('PENDING', 'CONFIRMED'))::int AS upcoming_bookings
        FROM bookings
      `),
      db.select({ val: count() }).from(users).where(eq(users.role, "CUSTOMER")),
      db.select({ val: count() }).from(services).where(eq(services.isActive, true)),
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
        .orderBy(desc(bookings.createdAt))
        .limit(5),
    ]);

    const bookingAgg: any = (bookingStatsRes as any).rows?.[0] || (bookingStatsRes as any)[0] || {};
    const [customerCount] = customersRes;
    const [activeServicesCount] = activeServicesRes;

    const recentBookings = recentRows.map((r) =>
      formatBooking(r.booking, r.service, r.customer)
    );

    const stats: DashboardStats = {
      totalBookings: Number(bookingAgg.total_bookings || 0),
      pendingBookings: Number(bookingAgg.pending_bookings || 0),
      confirmedBookings: Number(bookingAgg.confirmed_bookings || 0),
      completedBookings: Number(bookingAgg.completed_bookings || 0),
      cancelledBookings: Number(bookingAgg.cancelled_bookings || 0),
      totalCustomers: Number(customerCount?.val || 0),
      activeServices: Number(activeServicesCount?.val || 0),
      totalRevenue: Number(bookingAgg.total_revenue || 0),
      todayBookings: Number(bookingAgg.today_bookings || 0),
      upcomingBookings: Number(bookingAgg.upcoming_bookings || 0),
      recentBookings,
    };

    // Cache stats for 15 seconds to eliminate repetitive load
    memoryCache.set(cacheKey, stats, 15);

    res.status(200).json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
