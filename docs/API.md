# API Specification: Service Booking System

This document provides the REST API documentation for the Service Booking System.

---

## Standard Response Format

All endpoints return responses in the following unified format:

```json
{
  "success": true,
  "message": "Human readable summary",
  "data": { ... }
}
```

On error:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error classification (e.g. Bad Request, Unauthorized, Forbidden, Conflict)"
}
```

### Standard Status Codes
* **`200 OK`**: Request succeeded with data payload.
* **`201 Created`**: New resource (user, booking) successfully created.
* **`400 Bad Request`**: Input validation failed (Zod schema rejection on body, query, or params).
* **`401 Unauthorized`**: Authentication missing, expired, or invalid credentials.
* **`403 Forbidden`**: Authenticated user lacks permission (e.g., Customer accessing Admin route, or Customer accessing another's booking).
* **`404 Not Found`**: Target endpoint or database record not found.
* **`409 Conflict`**: Conflicting state (duplicate email registration or booking slot overlap).
* **`429 Too Many Requests`**: Rate limit exceeded on sensitive endpoints (e.g., 15 req/min on `/api/auth/*`).
* **`500 Internal Server Error`**: Sanitized server error (zero credentials or stack traces exposed).

---

## 1. System Health & Diagnostics

### `GET /`
* **Status**: **Implemented**
* **Auth**: None
* **Role**: Public
* **Description**: Verifies the API server is operational.
* **Response `200 OK`**:
  ```json
  {
    "message": "API running successfully"
  }
  ```

---

## 2. Authentication (`/api/auth`)

### `POST /api/auth/register`
* **Status**: **Implemented (Phase 3)**
* **Auth**: None (Public)
* **Role**: Public (Creates `CUSTOMER` accounts)
* **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePassword123"
  }
  ```
* **Response `201 Created`**:
  * Sets HTTP-only cookie `USER`.
  * Returns:
    ```json
    {
      "success": true,
      "message": "Customer account created successfully.",
      "data": {
        "id": "UUID",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "CUSTOMER",
        "createdAt": "2026-09-11T10:00:00.000Z",
        "updatedAt": "2026-09-11T10:00:00.000Z"
      }
    }
    ```
* **Errors**: `400 Bad Request` (Zod validation), `409 Conflict` (Email already registered).

### `POST /api/auth/login`
* **Status**: **Implemented (Phase 3)**
* **Auth**: None (Public)
* **Role**: Public (Admins & Customers)
* **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "SecurePassword123"
  }
  ```
* **Response `200 OK`**: Sets HTTP-only cookie `USER` and returns authenticated safe user object.
* **Errors**: `400 Bad Request` (Validation), `401 Unauthorized` (Invalid credentials).

### `POST /api/auth/logout`
* **Status**: **Implemented (Phase 3)**
* **Auth**: None
* **Response `200 OK`**: Clears `USER` cookie.

### `GET /api/auth/me`
* **Status**: **Implemented (Phase 3)**
* **Auth**: Required (`USER` cookie or `Authorization: Bearer <token>`)
* **Role**: Any authenticated user
* **Response `200 OK`**: Returns current authenticated safe user profile.
* **Errors**: `401 Unauthorized` (Missing, invalid, or expired session).

---

## 3. Services Catalog (`/api/services`)

### `GET /api/services`
* **Status**: **Implemented (Phase 5)**
* **Auth**: None (Public)
* **Role**: Public / Customer
* **Query Parameters**:
  * `search` *(optional, string)*: Filter active services matching name or description (case-insensitive parameterized Drizzle query).
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Services retrieved successfully",
    "data": [
      {
        "id": "c82e9b47-fe50-452c-9314-8ff1aa17ffee",
        "name": "Hair Cut & Styling",
        "description": "Professional haircut and styling",
        "price": 50.00,
        "duration": 45,
        "isActive": true,
        "createdAt": "2026-09-11T10:00:00.000Z",
        "updatedAt": "2026-09-11T10:00:00.000Z"
      }
    ]
  }
  ```
* **Security**: Strictly returns active services only (`isActive = true`).

### `GET /api/services/:id`
* **Status**: **Implemented (Phase 5)**
* **Auth**: None (Public)
* **Role**: Public / Customer
* **Route Params**: `id` (UUID format validated with Zod)
* **Response `200 OK`**: Single active service object.
* **Errors**:
  * `400 Bad Request`: If `:id` is not a valid UUID format (rejected prior to DB lookup).
  * `404 Not Found`: If service does not exist OR if service is inactive (`isActive = false`).

### `GET /api/services/:id/availability`
* **Status**: **Implemented (Phase 6)**
* **Auth**: None (Public)
* **Role**: Public / Customer
* **Query Parameters**: `date=YYYY-MM-DD` (Required, validated calendar date, non-past)
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Availability retrieved successfully",
    "data": {
      "serviceId": "UUID",
      "serviceName": "Hair Cut & Styling",
      "duration": 60,
      "date": "2026-09-15",
      "workingHours": {
        "start": "09:00",
        "end": "18:00"
      },
      "slots": [
        { "startTime": "09:00", "endTime": "10:00", "isAvailable": true, "available": true },
        { "startTime": "10:00", "endTime": "11:00", "isAvailable": false, "available": false },
        { "startTime": "11:00", "endTime": "12:00", "isAvailable": true, "available": true }
      ]
    }
  }
  ```
* **Algorithm**:
  * Working hours: `09:00` to `18:00`.
  * Collision formula: `newStart < existingEnd AND newEnd > existingStart`.
  * Occupied by: `PENDING`, `CONFIRMED`, `COMPLETED` bookings.
  * Ignored: `CANCELLED` bookings.
  * Same-day past slots are marked `isAvailable = false`.
* **Errors**: `400 Bad Request` (Malformed UUID, invalid date, past date), `404 Not Found` (Missing or inactive service).

---

## 4. Admin Services Management (`/api/admin/services`)

### `GET /api/admin/services`
* **Status**: **Implemented (Phase 5)**
* **Auth**: Required (`protect("ADMIN")`)
* **Role**: `ADMIN`
* **Query Parameters**:
  * `search` *(optional, string)*: Filter by name or description.
  * `active` *(optional, "true" | "false")*: Filter by active or inactive status.
* **Response `200 OK`**: Complete listing of services (both active and inactive) for administration.

### `POST /api/admin/services`
* **Status**: **Implemented (Phase 5)**
* **Auth**: Required (`protect("ADMIN")`)
* **Role**: `ADMIN` (Customers receive `403 Forbidden`)
* **Request Body**:
  ```json
  {
    "name": "Full Suit Tailoring",
    "description": "Bespoke fitting and stitching",
    "price": 149.99,
    "duration": 90,
    "isActive": true
  }
  ```
* **Validation**:
  * `name`: required, trimmed, 2–100 characters.
  * `description`: optional string, max 1000 characters.
  * `price`: positive number (> 0), max 100,000, stored in PostgreSQL `numeric(10,2)`.
  * `duration`: positive integer (5–1440 minutes).
  * `isActive`: optional boolean (defaults to `true`).
* **Response `201 Created`**: Returns created service object with numeric price.
* **Errors**: `400 Bad Request` (Validation error), `401 Unauthorized`, `403 Forbidden`.

### `PUT /api/admin/services/:id`
* **Status**: **Implemented (Phase 5)**
* **Auth**: Required (`protect("ADMIN")`)
* **Role**: `ADMIN` (Customers receive `403 Forbidden`)
* **Route Params**: `id` (UUID format validated with Zod)
* **Request Body**: Partial updates for `name`, `description`, `price`, `duration`, `isActive`. Internal fields (`id`, `createdAt`, `updatedAt`) are immutable.
* **Response `200 OK`**: Returns updated service.
* **Errors**: `400 Bad Request` (Malformed UUID or invalid input), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### `DELETE /api/admin/services/:id`
* **Status**: **Implemented (Phase 5)**
* **Auth**: Required (`protect("ADMIN")`)
* **Role**: `ADMIN` (Customers receive `403 Forbidden`)
* **Route Params**: `id` (UUID format validated with Zod)
* **Behavior**: **Soft Delete**. Sets `isActive = false` and updates `updatedAt`. Physical records are strictly preserved to maintain booking foreign key integrity (`ON DELETE RESTRICT`). If already inactive, returns clean response without data corruption.
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Service deactivated successfully",
    "data": { ... }
  }
  ```
* **Errors**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

## 5. Customer Bookings (`/api/bookings`)

### `POST /api/bookings`
* **Status**: **Implemented (Phase 7)**
* **Auth**: Required (`protect("CUSTOMER")`)
* **Role**: `CUSTOMER` (Admins receive `403 Forbidden`)
* **Request Body**:
  ```json
  {
    "serviceId": "UUID",
    "bookingDate": "2026-09-15",
    "startTime": "11:00"
  }
  ```
  *(Note: `amount`, `endTime`, `customerId`, and `status` are computed exclusively by PostgreSQL and the server; any client-supplied values for these fields are strictly ignored).*
* **Concurrency Protection**: Handled inside a serializing PostgreSQL transaction using `pg_advisory_xact_lock(hashtext(serviceId || bookingDate))` to prevent race conditions and duplicate double-bookings.
* **Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Booking created successfully",
    "data": {
      "id": "UUID",
      "customerId": "UUID",
      "serviceId": "UUID",
      "bookingDate": "2026-09-15",
      "startTime": "11:00",
      "endTime": "12:00",
      "amount": 85.00,
      "status": "PENDING",
      "createdAt": "2026-09-11T10:00:00.000Z",
      "updatedAt": "2026-09-11T10:00:00.000Z"
    }
  }
  ```
* **Errors**: `400 Bad Request` (Validation, past date/time, bounds error), `401 Unauthorized`, `403 Forbidden` (Admin attempt), `404 Not Found` (Service missing/inactive), `409 Conflict` (Slot collision).

### `GET /api/bookings/my`
* **Status**: **Implemented (Phase 7)**
* **Auth**: Required (`protect("CUSTOMER")`)
* **Role**: `CUSTOMER`
* **Response `200 OK`**: List of bookings placed by the authenticated customer, ordered by newest first, joined with service details.

### `GET /api/bookings/:id`
* **Status**: **Implemented (Phase 7)**
* **Auth**: Required (`protect()`)
* **Role**: `CUSTOMER` (Own booking) or `ADMIN`
* **Response `200 OK`**: Booking details.
* **Errors**: `400 Bad Request` (Malformed UUID), `403 Forbidden` (Customer trying to view another's booking), `404 Not Found`.

### `PATCH /api/bookings/:id/cancel`
* **Status**: **Implemented (Phase 7)**
* **Auth**: Required (`protect()`)
* **Role**: `CUSTOMER` (Own booking) or `ADMIN`
* **Response `200 OK`**: Booking with status updated to `CANCELLED`.
* **Errors**: `400 Bad Request` (Cannot cancel `COMPLETED` booking), `403 Forbidden` (Another customer's booking), `404 Not Found`.

---

## 6. Admin Bookings & Metrics (`/api/admin`)

### `GET /api/admin/bookings`
* **Status**: **Implemented (Phase 8)**
* **Auth**: Required (`protect("ADMIN")`)
* **Role**: `ADMIN` only
* **Query Parameters**:
  * `page` *(optional, integer >= 1, default 1)*: Page number for pagination.
  * `limit` *(optional, integer 1-100, default 10)*: Page size.
  * `status` *(optional, enum)*: Filter by `PENDING`, `CONFIRMED`, `COMPLETED`, or `CANCELLED`.
  * `date` *(optional, YYYY-MM-DD)*: Filter bookings for a specific calendar date.
  * `serviceId` *(optional, UUID)*: Filter bookings by service offering.
  * `search` *(optional, string)*: Case-insensitive search on customer name or email.
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Admin bookings retrieved successfully",
    "data": {
      "items": [
        {
          "id": "e8913b8f-1234-4567-89ab-cdef01234567",
          "customerId": "u1234567-1234-4567-89ab-cdef01234567",
          "serviceId": "s1234567-1234-4567-89ab-cdef01234567",
          "bookingDate": "2026-11-20",
          "startTime": "09:00",
          "endTime": "10:00",
          "amount": 150.00,
          "status": "CONFIRMED",
          "createdAt": "2026-09-11T10:00:00.000Z",
          "updatedAt": "2026-09-11T10:05:00.000Z",
          "customer": {
            "id": "u1234567-1234-4567-89ab-cdef01234567",
            "name": "Alice AdminTest",
            "email": "alice@example.com"
          },
          "service": {
            "id": "s1234567-1234-4567-89ab-cdef01234567",
            "name": "Deep Tissue Massage",
            "duration": 60,
            "price": 150.00
          }
        }
      ],
      "total": 45,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
  ```
* **Errors**: `401 Unauthorized`, `403 Forbidden` (Customer access), `400 Bad Request` (Invalid query parameter).

### `GET /api/admin/bookings/:id`
* **Status**: **Implemented (Phase 8)**
* **Auth**: Required (`protect("ADMIN")`)
* **Role**: `ADMIN` only
* **Route Params**: `id` (UUID format)
* **Response `200 OK`**: Full booking object joined with customer and service details.
* **Errors**: `400 Bad Request` (Invalid UUID), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### `PATCH /api/admin/bookings/:id/status`
* **Status**: **Implemented (Phase 8)**
* **Auth**: Required (`protect("ADMIN")`)
* **Role**: `ADMIN` only
* **Route Params**: `id` (UUID format)
* **Request Body**:
  ```json
  {
    "status": "CONFIRMED"
  }
  ```
* **Status Transition State Machine**:
  * `PENDING` $\rightarrow$ `CONFIRMED` | `CANCELLED`
  * `CONFIRMED` $\rightarrow$ `COMPLETED` | `CANCELLED`
  * Terminal states (`COMPLETED`, `CANCELLED`) reject updates with `400 Bad Request`.
* **Advisory Lock & Collision Guard**:
  * When transitioning to `CONFIRMED`, acquires `pg_advisory_xact_lock(hashtext(serviceId || bookingDate))`.
  * Verifies no active booking (`PENDING`, `CONFIRMED`, `COMPLETED` excluding self) overlaps the time slot ($newStart < existingEnd \land newEnd > existingStart$).
  * If collision detected, returns `409 Conflict`.
* **Response `200 OK`**: Updated booking object.
* **Errors**: `400 Bad Request` (Invalid status or illegal transition), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (Slot collision).

### `GET /api/admin/dashboard/stats`
* **Status**: **Implemented (Phase 8)**
* **Auth**: Required (`protect("ADMIN")`)
* **Role**: `ADMIN` only
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Dashboard statistics retrieved successfully",
    "data": {
      "totalBookings": 112,
      "pendingBookings": 14,
      "confirmedBookings": 28,
      "completedBookings": 62,
      "cancelledBookings": 8,
      "totalCustomers": 45,
      "activeServices": 7,
      "totalRevenue": 9300.00,
      "todayBookings": 6,
      "upcomingBookings": 22,
      "recentBookings": [ ... ]
    }
  }
  ```
* **Revenue Calculation**: Authoritatively derived directly from PostgreSQL as `COALESCE(SUM(amount), 0)` for realized bookings (`status = 'COMPLETED'`).
* **Errors**: `401 Unauthorized`, `403 Forbidden`.

