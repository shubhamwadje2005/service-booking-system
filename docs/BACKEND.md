# Backend Architecture & Technical Specification: Service Booking System

> **Sole Authority Architecture**: A production-grade Express REST API engineered in TypeScript, backed by PostgreSQL via Drizzle ORM, with absolute server-side control over pricing, duration, slot calculation, and collision-free scheduling.

---

## 1. System Overview & Technology Stack

The backend of the Service Booking System is an enterprise Express application running in a TypeScript Turborepo monorepo. It enforces strict separation of concerns, zero client trust, atomic database transactions, and comprehensive role-based access control (RBAC).

| Layer | Technology | Purpose / Configuration |
| :--- | :--- | :--- |
| **Runtime & Language** | Node.js 20+ & TypeScript 5+ | Strongly typed backend with strict compilation flags |
| **Web Framework** | Express 4.x | Fast, unopinionated HTTP REST API server on port 5000 |
| **Database Engine** | PostgreSQL 16+ (Hosted on Neon) | ACID-compliant relational storage with native DATE and TIME types |
| **ORM & Query Builder** | Drizzle ORM (`drizzle-orm/node-postgres`) | Zero-overhead, type-safe SQL query generation and migrations |
| **Connection Pooling** | `pg` (`node-postgres` Pool) | Resilient connection pool with SSL certificate validation |
| **Input Validation** | Zod 3.x | Schema-based runtime validation of HTTP body, query, and path params |
| **Authentication** | JWT (`jsonwebtoken`) & bcryptjs | 7-day signed JWT tokens stored in secure `HTTP-only` cookies |
| **Monorepo Contracts** | `@repo/types` (Shared workspace) | End-to-end type parity between backend, database, and frontend |

---

## 2. High-Level Backend Architecture

```mermaid
flowchart TD
    Client["Client (Next.js / Mobile / Postman)"]

    subgraph Server ["Express API Server (Port 5000)"]
        Cors["CORS & Cookie Parser"]
        RateLimit["In-Memory Rate Limiter (15 req/min on Auth)"]
        Router["Express Routers (/api/auth, /api/services, /api/bookings, /api/admin)"]
        AuthMid["Protect & RBAC Middleware"]
        ValidateMid["Zod Request Validation Middleware"]
        Controllers["Feature Controllers"]
        ErrorMid["Centralized Error Handler (AppError)"]
    end

    subgraph DataLayer ["Data Access & Storage"]
        Drizzle["Drizzle ORM Models & Queries"]
        PgPool["pg.Pool Connection Pool"]
        Postgres[("PostgreSQL Database (Neon)")]
    end

    Client -->|HTTP / Cookies / Bearer| Cors
    Cors --> RateLimit
    RateLimit --> Router
    Router --> AuthMid
    AuthMid --> ValidateMid
    ValidateMid --> Controllers
    Controllers -->|SQL via Drizzle| Drizzle
    Drizzle --> PgPool
    PgPool --> Postgres
    Controllers -.->|Throws Errors| ErrorMid
    ErrorMid -->|Sanitized JSON Error| Client
```

---

## 3. Database Architecture & Data Modeling

The database uses a normalized relational architecture centered around three primary tables: `users`, `services`, and `bookings`.

### 3.1 Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : places
    SERVICES ||--o{ BOOKINGS : "scheduled for"

    USERS {
        uuid id PK "gen_random_uuid()"
        varchar name "Full Name"
        varchar email UK "Unique Email Address"
        text password "Hashed Password (bcrypt)"
        varchar role "CUSTOMER or ADMIN"
        timestamptz created_at "Account creation time"
        timestamptz updated_at "Account update time"
    }

    SERVICES {
        uuid id PK "gen_random_uuid()"
        varchar name "Service Name"
        text description "Detailed scope"
        numeric price "Authoritative Price (numeric 10,2)"
        integer duration "Duration in Minutes (e.g. 30, 60, 120)"
        boolean is_active "Logical active state flag"
        timestamptz created_at "Service creation time"
        timestamptz updated_at "Service update time"
    }

    BOOKINGS {
        uuid id PK "gen_random_uuid()"
        uuid customer_id FK "References USERS(id) ON DELETE CASCADE"
        uuid service_id FK "References SERVICES(id) ON DELETE RESTRICT"
        date booking_date "Scheduled appointment date (PostgreSQL DATE)"
        time start_time "Slot start time (PostgreSQL TIME)"
        time end_time "Computed end time (start_time + duration)"
        numeric amount "Authoritative booking price at reservation"
        varchar status "PENDING | CONFIRMED | COMPLETED | CANCELLED"
        timestamptz created_at "Order placed timestamp"
        timestamptz updated_at "Status update timestamp"
    }
```

### 3.2 Detailed Table Specifications

#### 1. `users` Table
Stores all user accounts (Customers and Administrators).
* **Primary Key**: `id` (`uuid`, default `gen_random_uuid()`)
* **Unique Constraints**: `email` (case-insensitive indexing recommended)
* **Role Column**: `role` (`varchar(20)`), default `'CUSTOMER'`, allowed values: `'CUSTOMER'`, `'ADMIN'`.
* **Password Storage**: Salting and hashing via `bcryptjs` (salt rounds: 10). Password hashes are strictly excluded from all public API outputs.

#### 2. `services` Table
Stores catalog items available for customer appointment booking.
* **Primary Key**: `id` (`uuid`, default `gen_random_uuid()`)
* **Price**: `numeric(10, 2)` mapped to JavaScript `number` on retrieval.
* **Duration**: `integer` representing total execution minutes (e.g., 30, 45, 60, 90, 120).
* **Soft Delete Policy**: Protected by `ON DELETE RESTRICT` on `bookings.service_id`. Records are never physically deleted with SQL `DELETE` if historical bookings exist. Deletion is executed logically via `isActive = false`, automatically hiding the service from the public customer storefront.

#### 3. `bookings` Table
Stores all scheduled customer appointments.
* **Primary Key**: `id` (`uuid`, default `gen_random_uuid()`)
* **Foreign Keys**:
  * `customer_id` $\rightarrow$ `users(id)` with `ON DELETE CASCADE`
  * `service_id` $\rightarrow$ `services(id)` with `ON DELETE RESTRICT` (prevents orphaned booking history)
* **Native Date & Time Types**:
  * `booking_date`: PostgreSQL native `DATE` (`YYYY-MM-DD`).
  * `start_time`: PostgreSQL native `TIME` (`HH:mm:ss`).
  * `end_time`: PostgreSQL native `TIME` (`HH:mm:ss`), calculated strictly by server as `start_time + duration`.
* **Status**: `'PENDING'` (default), `'CONFIRMED'`, `'COMPLETED'`, `'CANCELLED'`.

### 3.3 Database Indexes & Query Optimization

| Index Name | Table & Columns | Performance Benefit |
| :--- | :--- | :--- |
| `users_email_unique` | `users(email)` | Instant $O(1)$ email lookup during login and registration |
| `bookings_customer_id_idx` | `bookings(customer_id)` | Accelerates customer history queries (`GET /api/bookings/my`) |
| `bookings_service_id_idx` | `bookings(service_id)` | Accelerates service-specific joins and cascade checks |
| `bookings_date_service_status_idx` | `bookings(booking_date, service_id, status)` | **Critical compound index** for sub-millisecond slot availability calculations and conflict detection |
| `bookings_status_idx` | `bookings(status)` | Accelerates admin dashboard status metric aggregations |
| `bookings_created_at_idx` | `bookings(created_at)` | Accelerates admin newest-first sorting (`ORDER BY created_at DESC`) |

---

## 4. Booking Engine, Overlap Detection & Security Rules

### 4.1 The Core Law: Backend Is Sole Authority
The frontend client is considered completely untrusted. Clients submit only intent:
```json
{
  "serviceId": "c82e9b47-fe50-452c-9314-8ff1aa17ffee",
  "bookingDate": "2026-09-15",
  "startTime": "10:00"
}
```
Any client-supplied fields attempting to set `amount`, `endTime`, `customerId`, `price`, `duration`, or `status` are **discarded**. The server loads authoritative price and duration directly from PostgreSQL.

### 4.2 Overlapping Slot Prevention Algorithm
Two appointment intervals $[S_1, E_1)$ and $[S_2, E_2)$ collide if and only if:
$$\text{Overlap} \iff S_{\text{new}} < E_{\text{existing}} \quad \text{AND} \quad E_{\text{new}} > S_{\text{existing}}$$

* Active bookings (`PENDING` and `CONFIRMED`) block future slots.
* Cancelled bookings (`CANCELLED`) do **not** block slots.
* Adjoining slots (e.g. 10:00–11:00 and 11:00–12:00) do **not** overlap ($11:00 < 11:00$ is False).

### 4.3 17-Step Booking Creation Pipeline
When a customer posts to `POST /api/bookings`:
1. Authenticate request via cookie or `Authorization: Bearer` header.
2. Verify role is `CUSTOMER`.
3. Validate payload syntax with Zod (valid UUID, valid `YYYY-MM-DD`, valid `HH:mm`).
4. Prevent past date bookings: `bookingDate < today` returns `400 Bad Request`.
5. Prevent past time today: if booking date is today and `startTime <= currentTime`, returns `400 Bad Request`.
6. Query service from PostgreSQL by `serviceId`.
7. Verify service exists and `isActive === true`.
8. Read authoritative `duration` and `price` from database row.
9. Calculate `endTime` by adding duration to `startTime` (`minutesToTime(timeToMinutes(startTime) + duration)`).
10. Check operating hours: start must be $\ge$ `09:00` and end must be $\le$ `18:00`.
11. Compute `amount = Number(service.price)`.
12. Begin atomic transaction with PostgreSQL advisory lock:
    ```sql
    SELECT pg_advisory_xact_lock(hashtext(serviceId || bookingDate));
    ```
13. Inside transaction, query active bookings for that service and date (`status IN ('PENDING', 'CONFIRMED')`).
14. Test new $[S, E)$ against all active bookings using the overlap condition.
15. If collision found, throw `ConflictError` (`409 Conflict`) and rollback transaction.
16. Insert booking record into `bookings` table with status `'PENDING'`.
17. Commit transaction, release advisory lock, and return `201 Created` with persisted booking.

### 4.4 Booking Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: Customer books slot
    PENDING --> CONFIRMED: Admin approves booking
    PENDING --> CANCELLED: Customer cancels OR Admin rejects
    CONFIRMED --> COMPLETED: Service fulfilled
    CONFIRMED --> CANCELLED: Admin cancels / emergency
    COMPLETED --> [*]
    CANCELLED --> [*]
```

* Customers can cancel their own bookings only when status is `PENDING` or `CONFIRMED`.
* Completed or already cancelled bookings cannot be modified.

---

## 5. Complete REST API Specification

### 5.1 Standard Response Format
All responses adhere to a uniform structure:
```json
// Success
{
  "success": true,
  "message": "Human readable confirmation",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Descriptive error message",
  "error": "BAD_REQUEST | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | INTERNAL_SERVER_ERROR"
}
```

### 5.2 Endpoint Matrix

| Method | Endpoint | Access / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Server health check (`200 OK`) |
| `POST` | `/api/auth/register` | Public | Register customer account, sets HTTP-only cookie (`201 Created`) |
| `POST` | `/api/auth/login` | Public | Login customer or admin, sets HTTP-only cookie (`200 OK`) |
| `POST` | `/api/auth/logout` | Public | Clear session cookie (`200 OK`) |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated user profile (`200 OK`) |
| `GET` | `/api/services` | Public | Get active services catalog sorted by newest first (`200 OK`) |
| `GET` | `/api/services/:id` | Public | Get active service details by UUID (`200 OK`) |
| `GET` | `/api/services/:id/availability` | Public | Calculate open time slots for date query param (`200 OK`) |
| `POST` | `/api/bookings` | Customer | Create new appointment booking with conflict checking (`201 Created`) |
| `GET` | `/api/bookings/my` | Customer | Get personal booking history sorted newest first (`200 OK`) |
| `GET` | `/api/bookings/:id` | Authenticated | Get booking details (customer can access only own records) (`200 OK`) |
| `PATCH` | `/api/bookings/:id/cancel` | Customer | Cancel own appointment (`200 OK`) |
| `GET` | `/api/admin/dashboard/stats` | Admin | Real-time analytics: revenue, counts, recent feed (`200 OK`) |
| `GET` | `/api/admin/services` | Admin | List all services (active and inactive) (`200 OK`) |
| `POST` | `/api/admin/services` | Admin | Create new catalog service (`201 Created`) |
| `PUT` | `/api/admin/services/:id` | Admin | Update service name, description, price, duration (`200 OK`) |
| `DELETE` | `/api/admin/services/:id` | Admin | Soft-delete service (`isActive = false`) (`200 OK`) |
| `GET` | `/api/admin/bookings` | Admin | Paginated bookings with search, status, and date filters (`200 OK`) |
| `GET` | `/api/admin/bookings/:id` | Admin | Admin detail view of any booking (`200 OK`) |
| `PATCH` | `/api/admin/bookings/:id/status` | Admin | Transition booking state (`CONFIRMED`, `COMPLETED`, `CANCELLED`) (`200 OK`) |

---

## 6. Middleware Architecture & Security

1. **`protect(role?: UserRole)`**:
   * Reads JWT token from HTTP-only cookie (`req.cookies['USER']`) or `Authorization: Bearer <token>`.
   * Verifies signature with `JWT_KEY`.
   * Queries PostgreSQL to verify user exists and is valid.
   * Checks role: if `role === "ADMIN"`, rejects non-admin users with `403 Forbidden`.
   * Attaches clean user object to `req.user`.
2. **`validate(schemas: { body?, query?, params? })`**:
   * Compares incoming requests against Zod schemas.
   * Throws `BadRequestError` (`400`) with formatted validation issues if invalid.
3. **`rateLimiter`**:
   * Sliding window in-memory limiter protecting `/api/auth/*` routes (15 requests/minute).
4. **`errorHandler`**:
   * Centralized Express error middleware catching all operational errors (`AppError`).
   * Prevents database stack traces or credentials from leaking into production responses.

---

## 7. Directory Structure

```
apps/api/
├── src/
│   ├── config/
│   │   ├── db.ts              # PostgreSQL connection pool & Drizzle client
│   │   └── env.ts             # Environment variable validation & defaults
│   ├── controller/
│   │   ├── auth.controller.ts     # Register, login, logout, me handlers
│   │   ├── service.controller.ts  # Catalog & availability calculations
│   │   ├── booking.controller.ts  # 17-step booking engine & customer actions
│   │   └── admin.controller.ts    # Dashboard analytics & operations
│   ├── middleware/
│   │   ├── auth.middleware.ts     # JWT authentication & RBAC protection
│   │   ├── error.middleware.ts    # Centralized error handler
│   │   ├── rateLimit.middleware.ts# Brute force protection
│   │   └── validate.middleware.ts # Zod request validation
│   ├── model/
│   │   ├── users.ts           # Users Drizzle schema
│   │   ├── services.ts        # Services Drizzle schema
│   │   └── bookings.ts        # Bookings Drizzle schema
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── service.routes.ts
│   │   ├── booking.routes.ts
│   │   └── admin.routes.ts
│   ├── utils/
│   │   ├── errors.ts          # Standard AppError classes
│   │   ├── password.ts        # bcrypt hashing helpers
│   │   ├── seedAdmin.ts       # Idempotent admin account bootstrapper
│   │   ├── time.ts            # Time arithmetic, overlap formulas, slots
│   │   └── token.ts           # JWT sign & verify helpers
│   ├── validator/
│   │   ├── auth.validator.ts
│   │   ├── service.validator.ts
│   │   └── booking.validator.ts
│   └── index.ts               # Express entrypoint, CORS, port 5000 listener
├── drizzle.config.ts          # Drizzle kit configuration
└── package.json
```

---

## 8. Development Setup & Environment Variables

### 8.1 Required Environment Variables (`apps/api/.env`)
```env
PORT=5000
DATABASE_URL="postgresql://user:password@neon-host/dbname?sslmode=require"
JWT_KEY="super-secret-jwt-signing-key-min-32-chars"
FRONTEND_URL="http://localhost:3000"
SEED_ADMIN_EMAIL="admin@gmail.com"
SEED_ADMIN_PASSWORD="password123"
```

### 8.2 Database Synchronization Commands
```bash
# Push schema changes to PostgreSQL database
npm run db:push

# Generate Drizzle migration files
npm run db:generate

# Start Express development server with live reload
npm run dev
```
