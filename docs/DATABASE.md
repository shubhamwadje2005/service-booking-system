# Database Documentation: Service Booking System

This document describes the PostgreSQL database architecture, table definitions, data types, constraints, indexes, and relationships implemented via Drizzle ORM.

---

## Database Technology

* **Database Engine**: PostgreSQL 16+ (hosted on Neon Serverless PostgreSQL)
* **Driver**: `pg` (node-postgres connection pool)
* **ORM**: Drizzle ORM (`drizzle-orm/node-postgres` with `drizzle-orm/pg-core`)
* **Migration & Synchronization**: `drizzle-kit push` (`apps/api/drizzle.config.ts`)

---

## Entity Relationship Overview

The database uses a clean, normalized relational design centered on 3 core tables:

```
+---------------+              +------------------+              +------------------+
|     users     |              |     bookings     |              |     services     |
+---------------+              +------------------+              +------------------+
| id (PK)       |<--- 1:N ---->| customer_id (FK) |              | id (PK)          |
| name          |              | service_id (FK)  |<--- N:1 ---->| name             |
| email         |              | booking_date     |              | description      |
| password      |              | start_time       |              | price            |
| role          |              | end_time         |              | duration         |
| created_at    |              | amount           |              | is_active        |
| updated_at    |              | status           |              | created_at       |
+---------------+              | created_at       |              | updated_at       |
                               | updated_at       |              +------------------+
                               +------------------+
```

---

## Table Specifications

### 1. `users` Table

Stores authenticated users of the system (both Administrators and Customers).

| Column | PostgreSQL Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | **NO** | `gen_random_uuid()` | Unique user identifier (Primary Key) |
| `name` | `varchar(255)` | **NO** | None | Full legal or display name |
| `email` | `varchar(255)` | **NO** | None | Unique email address used for authentication |
| `password` | `text` | **NO** | None | Securely hashed password (bcrypt) |
| `role` | `varchar(20)` | **NO** | `'CUSTOMER'` | User authorization role: `'ADMIN'` or `'CUSTOMER'` |
| `created_at` | `timestamptz` | **NO** | `now()` | Timestamp of account creation (UTC) |
| `updated_at` | `timestamptz` | **NO** | `now()` | Timestamp of last record update (UTC) |

#### Constraints & Indexes
* **Primary Key**: `users_pkey` on `id`
* **Unique Constraint**: `users_email_unique` on `email`

---

### 2. `services` Table

Stores the catalog of bookable services managed by administrators.

| Column | PostgreSQL Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | **NO** | `gen_random_uuid()` | Unique service identifier (Primary Key) |
| `name` | `varchar(255)` | **NO** | None | Name of the service |
| `description` | `text` | **YES** | `NULL` | Detailed description of what the service includes |
| `price` | `numeric(10, 2)` | **NO** | None | Authoritative service price in currency units |
| `duration` | `integer` | **NO** | None | Duration of the service in minutes (e.g. 30, 45, 60) |
| `is_active` | `boolean` | **NO** | `true` | Active status flag; inactive services are hidden from customers |
| `created_at` | `timestamptz` | **NO** | `now()` | Timestamp of service creation (UTC) |
| `updated_at` | `timestamptz` | **NO** | `now()` | Timestamp of last service update (UTC) |

#### Constraints & Indexes
* **Primary Key**: `services_pkey` on `id`
* **Soft Delete Policy**: To preserve relational integrity with `bookings.service_id` (`ON DELETE RESTRICT`), rows in this table are never physically deleted via SQL `DELETE`. Deletion is represented logically via `is_active = false`. Inactive services are filtered out from public customer APIs.

---

### 3. `bookings` Table

Stores service bookings created by customers and managed by administrators.

| Column | PostgreSQL Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | **NO** | `gen_random_uuid()` | Unique booking identifier (Primary Key) |
| `customer_id` | `uuid` | **NO** | None | Foreign Key referencing `users(id)` (`ON DELETE CASCADE`) |
| `service_id` | `uuid` | **NO** | None | Foreign Key referencing `services(id)` (`ON DELETE RESTRICT`) |
| `booking_date` | `date` | **NO** | None | Scheduled booking date (PostgreSQL native `DATE`) |
| `start_time` | `time` | **NO** | None | Scheduled start time (PostgreSQL native `TIME`) |
| `end_time` | `time` | **NO** | None | Calculated end time (`start_time + duration`) |
| `amount` | `numeric(10, 2)` | **NO** | None | Authoritative booking cost calculated from service price |
| `status` | `varchar(20)` | **NO** | `'PENDING'` | Status: `'PENDING'`, `'CONFIRMED'`, `'COMPLETED'`, `'CANCELLED'` |
| `created_at` | `timestamptz` | **NO** | `now()` | Timestamp when booking was placed (UTC) |
| `updated_at` | `timestamptz` | **NO** | `now()` | Timestamp of last status or record update (UTC) |

#### Constraints & Foreign Keys
* **Primary Key**: `bookings_pkey` on `id`
* **Foreign Key 1**: `customer_id` references `users(id)` with `ON DELETE CASCADE`
* **Foreign Key 2**: `service_id` references `services(id)` with `ON DELETE RESTRICT` (protects historical booking records from being orphaned)

#### Performance & Query Indexes
* `bookings_customer_id_idx`: B-tree index on `(customer_id)` — Accelerates customer booking history queries (`GET /api/bookings/my`).
* `bookings_service_id_idx`: B-tree index on `(service_id)` — Accelerates service-specific lookup queries.
* `bookings_date_service_status_idx`: Compound B-tree index on `(booking_date, service_id, status)` — Crucial index for real-time availability slot calculations and collision checks during booking insertion.
* `bookings_status_idx`: B-tree index on `(status)` — Optimizes administrative filtering and dashboard metric aggregations.
* `bookings_created_at_idx`: B-tree index on `(created_at)` — Accelerates newest-first pagination and sorting (`ORDER BY created_at DESC`) for administrative queries.

---

## Enumerated Domain Values

### User Roles
* `ADMIN`: Administrative account with full management privileges (services, bookings, metrics).
* `CUSTOMER`: Standard user account with booking and personal history privileges.

### Booking Statuses
* `PENDING`: Initial state upon creation by customer.
* `CONFIRMED`: Approved/confirmed by administrator.
* `COMPLETED`: Service successfully fulfilled.
* `CANCELLED`: Cancelled by customer (before completion) or rejected by administrator.
