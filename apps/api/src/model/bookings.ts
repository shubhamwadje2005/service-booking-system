import { pgTable, uuid, varchar, numeric, timestamp, date, time, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { services } from "./services";

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    bookingDate: date("booking_date", { mode: "string" }).notNull(), // PostgreSQL native DATE
    startTime: time("start_time").notNull(), // PostgreSQL native TIME
    endTime: time("end_time").notNull(), // PostgreSQL native TIME
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    status: varchar("status", { length: 20 }).default("PENDING").notNull(), // 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("bookings_customer_id_idx").on(table.customerId),
    index("bookings_service_id_idx").on(table.serviceId),
    index("bookings_date_service_status_idx").on(table.bookingDate, table.serviceId, table.status),
    index("bookings_status_idx").on(table.status),
    index("bookings_created_at_idx").on(table.createdAt),
  ]
);

export const bookingsRelations = relations(bookings, ({ one }) => ({
  customer: one(users, {
    fields: [bookings.customerId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
}));

export type BookingSelect = typeof bookings.$inferSelect;
export type BookingInsert = typeof bookings.$inferInsert;
