import { Request, Response, NextFunction } from "express";
import { eq, inArray, desc, count, sum, sql, gte } from "drizzle-orm";
import db from "../config/db";
import { bookings } from "../model/bookings";
import { users } from "../model/users";
import { services } from "../model/services";
import { DashboardStats } from "@repo/types";
import { formatBooking } from "./booking.controller";

/**
 * Admin: Retrieve consolidated business analytics and metrics.
 * GET /api/admin/dashboard/stats
 */
export const getDashboardStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. Booking counts by status
    const [totalBookingsRes] = await db.select({ val: count() }).from(bookings);
    const [pendingRes] = await db
      .select({ val: count() })
      .from(bookings)
      .where(eq(bookings.status, "PENDING"));
    const [confirmedRes] = await db
      .select({ val: count() })
      .from(bookings)
      .where(eq(bookings.status, "CONFIRMED"));
    const [completedRes] = await db
      .select({ val: count() })
      .from(bookings)
      .where(eq(bookings.status, "COMPLETED"));
    const [cancelledRes] = await db
      .select({ val: count() })
      .from(bookings)
      .where(eq(bookings.status, "CANCELLED"));

    // 2. Customers and Active Services counts
    const [customersRes] = await db
      .select({ val: count() })
      .from(users)
      .where(eq(users.role, "CUSTOMER"));

    const [activeServicesRes] = await db
      .select({ val: count() })
      .from(services)
      .where(eq(services.isActive, true));

    // 3. Realized Revenue from COMPLETED bookings directly from DB
    const [revenueRes] = await db
      .select({ val: sum(bookings.amount) })
      .from(bookings)
      .where(eq(bookings.status, "COMPLETED"));

    // 4. Today's Bookings and Upcoming Bookings
    const [todayRes] = await db
      .select({ val: count() })
      .from(bookings)
      .where(eq(bookings.bookingDate, todayStr));

    const [upcomingRes] = await db
      .select({ val: count() })
      .from(bookings)
      .where(
        sql`${bookings.bookingDate} >= ${todayStr} AND ${bookings.status} IN ('PENDING', 'CONFIRMED')`
      );

    // 5. Recent 5 bookings
    const recentRows = await db
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
      .limit(5);

    const recentBookings = recentRows.map((r) =>
      formatBooking(r.booking, r.service, r.customer)
    );

    const stats: DashboardStats = {
      totalBookings: Number(totalBookingsRes?.val || 0),
      pendingBookings: Number(pendingRes?.val || 0),
      confirmedBookings: Number(confirmedRes?.val || 0),
      completedBookings: Number(completedRes?.val || 0),
      cancelledBookings: Number(cancelledRes?.val || 0),
      totalCustomers: Number(customersRes?.val || 0),
      activeServices: Number(activeServicesRes?.val || 0),
      totalRevenue: Number(revenueRes?.val || 0),
      todayBookings: Number(todayRes?.val || 0),
      upcomingBookings: Number(upcomingRes?.val || 0),
      recentBookings,
    };

    res.status(200).json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
