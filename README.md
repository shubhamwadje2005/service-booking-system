# Service Booking System

> A professional, secure, full-stack Service Booking System engineered for high-concurrency scheduling, bulletproof pricing security, and real-time availability slot calculation.

[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue.svg)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-ef4444.svg)](https://turbo.build/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-336791.svg)](https://orm.drizzle.team/)
[![Express](https://img.shields.io/badge/Express-API-000000.svg)](https://expressjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black.svg)](https://nextjs.org/)

---

## 1. Project Overview

The **Service Booking System** is an enterprise-grade appointment and service scheduling platform designed for modern service-oriented businesses. The platform guarantees strict data isolation, zero double-booking, and absolute server-side authority over pricing, durations, and availability.

Built inside a TypeScript Turborepo monorepo, the application features an Express REST API backend backed by PostgreSQL via Drizzle ORM, a responsive Next.js frontend utilizing Redux Toolkit and RTK Query, and a shared domain types library ensuring 100% end-to-end type safety.

---

## 2. Project Objective

To deliver a production-ready, hiring-round-standard booking engine that resolves classic scheduling vulnerabilities:
* Eliminates double-booking through atomic SQL-level overlap detection algorithms.
* Prevents price tampering by calculating all totals, durations, and end times exclusively on the server.
* Enforces strict role-based access control (RBAC) and customer data isolation.
* Delivers sub-millisecond response times using native PostgreSQL date/time types and composite B-tree indexes.

---

## 3. Key Features

### Customer Experience
* **Service Discovery**: Browse active services with detailed descriptions, transparent pricing, and duration estimates.
* **Interactive Availability**: Real-time slot calculation that shows only genuine open slots for any selected date.
* **Streamlined Booking**: Effortless appointment booking with instant confirmation.
* **Booking Management**: Personal dashboard to review past, upcoming, and pending appointments with one-click cancellation.
* **Authentication**: Seamless registration and login using secure HTTP-only cookies.

### Administrator Controls
* **Metrics Dashboard**: Real-time business intelligence—total revenue, active services, booking statuses breakdown, and upcoming volume.
* **Service Catalog CRUD**: Create, edit, activate, and deactivate bookable services without data corruption.
* **Booking Lifecycle Management**: Approve (`PENDING` $\rightarrow$ `CONFIRMED`), complete (`CONFIRMED` $\rightarrow$ `COMPLETED`), or cancel bookings with state machine validation.

---

## 4. User Roles

The system strictly enforces two distinct user roles:

| Role | Permissions & Access Scope |
| :--- | :--- |
| **`CUSTOMER`** | Register account, view active services, query availability, place bookings, view own bookings, cancel own pending/confirmed bookings. Cannot access administrative endpoints or other customers' records. |
| **`ADMIN`** | Full system control: manage services catalog, view all customer bookings, transition booking statuses, view business metrics and revenue analytics. |

---

## 5. Technology Stack

* **Monorepo Management**: [Turborepo](https://turbo.build/) with npm workspaces
* **Backend**: Node.js, [Express 5](https://expressjs.com/), TypeScript
* **Database**: [PostgreSQL 16](https://www.postgresql.org/) (Neon Serverless)
* **Database Driver & ORM**: `pg` (Pool), [Drizzle ORM](https://orm.drizzle.team/), [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
* **Security & Auth**: `bcryptjs` (password hashing), `jsonwebtoken` (JWT), `cookie-parser`
* **Validation**: [Zod](https://zod.dev/) for runtime input schema enforcement
* **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/)
* **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) & RTK Query
* **Forms & Validation**: [React Hook Form](https://react-hook-form.com/), `@hookform/resolvers`, Zod
* **Shared Packages**: `@repo/types` (shared TypeScript domain contracts)

---

## 6. Monorepo Structure

```
.
├── apps/
│   ├── api/                     # Express REST API backend
│   │   ├── src/
│   │   │   ├── config/          # db.ts (pg Pool + Drizzle) & env.ts
│   │   │   ├── controller/      # API route controllers
│   │   │   ├── middleware/      # Protect, validator, error handler
│   │   │   ├── model/           # Drizzle PostgreSQL schemas (users, services, bookings)
│   │   │   ├── routes/          # Express route definitions
│   │   │   ├── utils/           # JWT, password, seed utilities
│   │   │   └── index.ts         # Server entry point
│   │   ├── drizzle.config.ts    # Drizzle Kit configuration
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                     # Next.js frontend application
│       ├── app/                 # Next.js App Router pages
│       ├── config/              # Frontend env configuration
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── types/                   # Shared TypeScript domain contracts (@repo/types)
│   │   └── src/index.ts         # User, Service, Booking, DTOs, Stats
│   ├── ui/                      # Shared UI components
│   ├── eslint-config/           # ESLint configuration
│   └── typescript-config/       # Base tsconfig presets
│
├── docs/                        # Complete technical documentation suite
│   ├── API.md                   # REST API documentation
│   ├── ARCHITECTURE.md          # End-to-end architecture & request flows
│   ├── BOOKING-LOGIC.md         # Overlap algorithm & business rules
│   ├── DATABASE.md              # Database tables, columns, indexes, constraints
│   ├── DEVELOPMENT.md           # Engineering progress & phase tracking
│   └── ER-DIAGRAM.md            # Mermaid entity-relationship diagram
│
├── package.json                 # Root monorepo workspace package.json
└── turbo.json                   # Turborepo task pipeline configuration
```

---

## 7. Database Architecture

The application strictly uses **PostgreSQL + pg + Drizzle ORM**.

* **`users`**: Stores administrators and customers with bcrypt hashed passwords and unique email constraints.
* **`services`**: Stores service catalog items with authoritative duration (minutes) and numeric price.
* **`bookings`**: Stores customer appointments with native PostgreSQL `date` and `time` columns. Foreign keys ensure referential integrity (`ON DELETE CASCADE` for users, `ON DELETE RESTRICT` for services to preserve financial history).

For complete column definitions, constraints, and query indexes, see [docs/DATABASE.md](docs/DATABASE.md) and [docs/ER-DIAGRAM.md](docs/ER-DIAGRAM.md).

---

## 8. Booking Business Logic & Security

* **Server-Side Price Authority**: Client-supplied `amount` and `endTime` are completely discarded. The server computes `amount = service.price` and `endTime = startTime + duration`.
* **Zero Double-Booking (Overlap Algorithm)**:
  An overlap with an active existing booking exists if:
  $$\text{Start}_{\text{new}} < \text{End}_{\text{existing}} \quad \text{AND} \quad \text{End}_{\text{new}} > \text{Start}_{\text{existing}}$$
  Colliding appointments return `409 Conflict`.
* **Customer Ownership Protection**: Customers can view and cancel only their own bookings. Requests to view another customer's booking are rejected with `403 Forbidden`.
* **Status State Machine**:
  * `PENDING` $\rightarrow$ `CONFIRMED` or `CANCELLED`
  * `CONFIRMED` $\rightarrow$ `COMPLETED` or `CANCELLED`
  * Completed or cancelled bookings cannot be resurrected or cancelled again.

For complete algorithmic specifications and edge-case tables, see [docs/BOOKING-LOGIC.md](docs/BOOKING-LOGIC.md).

---

## 9. Environment Variables

Configuration is centralized in `apps/api/src/config/env.ts` and `apps/web/config/env.ts`.

### Backend (`apps/api/src/.env`)
| Variable | Description | Safe Example |
| :--- | :--- | :--- |
| `PG_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `PORT` | Backend server port | `5000` |
| `JWT_KEY` | Secret key for signing authentication tokens | `your-secure-jwt-secret` |
| `NODE_ENV` | Environment identifier | `development` / `production` |
| `LOCAL_URL` | Local client URL for CORS | `http://localhost:3000` |
| `LIVE_URL` | Production client URL for CORS | `https://your-domain.vercel.app` |
| `SEED_ADMIN_NAME` | Initial admin username for seeding | `admin` |
| `SEED_ADMIN_EMAIL` | Initial admin email for seeding | `admin@example.com` |
| `SEED_ADMIN_PASSWORD` | Initial admin password for seeding | `Admin@123` |
| `SEED_ADMIN_ROLE` | Admin role identifier | `admin` |

### Frontend (`apps/web/.env`)
| Variable | Description | Safe Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_BACKEND_URL` | URL of backend API | `http://localhost:5000` |
| `NEXT_PUBLIC_NODE_ENV` | Environment identifier | `development` |

---

## 10. Local Setup & Development

### Prerequisites
* **Node.js**: `>= 20.x` (Recommended: Node 22+ or 24+)
* **npm**: `>= 10.x`
* **PostgreSQL**: Accessible PostgreSQL 15+ database instance (or Neon DB)

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <REPO_URL_PLACEHOLDER>
   cd "Service Booking System"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   * Verify/create `apps/api/src/.env` with your PostgreSQL `PG_URL` and `JWT_KEY`.
   * Verify/create `apps/web/.env` with `NEXT_PUBLIC_BACKEND_URL=http://localhost:5000`.

4. **Synchronize Database Schema**:
   ```bash
   npm run db:push --workspace=api
   ```

5. **Typecheck Workspaces**:
   ```bash
   npm run check-types
   ```

6. **Run Production Builds**:
   ```bash
   npm run build --workspace=api   # Compiles backend TypeScript to dist/
   npm run build --workspace=web   # Compiles Next.js frontend to .next/
   ```

7. **Run Automated Test Suites**:
   ```bash
   npm run test:auth --workspace=api            # Phase 3 Authentication tests (33 assertions)
   npm run test:security --workspace=api        # Phase 4 Authorization & Security tests (20 assertions)
   npm run test:services --workspace=api        # Phase 5 Service Management tests (20 assertions)
   npm run test:bookings --workspace=api        # Phase 6 & 7 Availability & Booking tests (36 assertions)
   npm run test:admin-bookings --workspace=api  # Phase 8 Admin Bookings & Dashboard tests (32 assertions)
   # Total: 141/141 automated integration tests passing
   ```

8. **Start Development Servers**:
   ```bash
   npm run dev
   ```
   * **API Backend**: Runs on `http://localhost:5000`
   * **Web Frontend**: Runs on `http://localhost:3000`

---

## 11. Frontend Architecture & Routes

The frontend is built using **Next.js 16 (App Router)**, **TypeScript**, **Redux Toolkit / RTK Query**, and a high-performance **Vanilla CSS** design system.

### Architecture Highlights
* **Authoritative Server Truth**: The frontend never trusts or calculates booking prices, durations, or end times. All values are server-derived.
* **Cookie-Based Sessions**: Uses HTTP-only cookie authentication (`credentials: 'include'`) for zero client-side token exposure.
* **Role-Based Navigation**: The dynamic `Navbar` automatically discovers user role (`ADMIN` vs `CUSTOMER`) via `useGetMeQuery()` and restricts administrative links.
* **Mobile-First Responsiveness**: Every screen is tested from 320px to 1920px with mobile hamburger menus, touch targets, and responsive card layouts that avoid table overflow.
* **Real-Time Collision Handling**: Immediate 409 conflict notifications and automatic availability re-fetching when competing bookings occur.

### Complete Route Map

| Route | Access Scope | Description |
| :--- | :--- | :--- |
| `/` | Public | Professional SaaS Landing Page: Hero, Popular Services from API, How It Works, Why Choose Us, CTA banner. |
| `/services` | Public | Service Catalog: Real-time search, duration badges, price displays, loading skeletons, and empty states. |
| `/services/[id]` | Public / Customer | Service Details & Booking: Date picker, live slot engine, booking summary, confirmation modal, and 409 handling. |
| `/bookings` | Customer | My Bookings: Filter tabs (`ALL`, `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`), desktop table + mobile cards. |
| `/bookings/[id]` | Customer | Booking Details: Comprehensive appointment view with one-click cancellation dialog. |
| `/login` | Public | Dual Login Portal: Customer & Admin sign-in with quick-fill demo credentials and automatic role redirection. |
| `/register` | Public | Customer Registration: Name, email, password, confirmation validation with instant session setup. |
| `/admin` | Admin only | Business Dashboard: Real-time PostgreSQL stats, realized revenue, and recent appointments. |
| `/admin/bookings` | Admin only | Admin Booking Portal: Customer search, status filter, date filter, pagination, and state machine transitions. |
| `/admin/services` | Admin only | Admin Services Catalog: Create, edit, activate, and deactivate bookable services. |


---

## 12. Demo Credentials

The backend automatically seeds an initial Administrator account on startup if none exists:

* **Role**: `ADMIN`
  * **Email**: `admin@example.com` *(or value in `SEED_ADMIN_EMAIL`)*
  * **Password**: `admin@123` *(or value in `SEED_ADMIN_PASSWORD`)*
* **Role**: `CUSTOMER`
  * New customers can register directly through `/register` or `/api/auth/register`.
  * Demo Customer: `customer@example.com` / `Customer@123`

---

## 13. Deployment & Repository Links

* **Live Application URL**: `[DEPLOYMENT_URL_PLACEHOLDER]`
* **GitHub Repository**: `[GITHUB_REPO_PLACEHOLDER]`

---

## 14. Assumptions & Technical Decisions

1. **Native DATE and TIME**: Standardized on PostgreSQL native `DATE` and `TIME` for bookings to leverage database-engine level validation, comparator indexing, and date-arithmetic.
2. **Dual Auth Mechanism**: Supports both secure `HTTP-only` cookies (for seamless Next.js browser sessions) and `Authorization: Bearer <token>` headers (for mobile/API clients).
3. **Restricted Service Deletion**: Services with historical bookings cannot be hard-deleted (`ON DELETE RESTRICT`) to preserve audit and revenue records; instead, they are deactivated (`isActive = false`).
4. **Focused Scope**: Unnecessary modules (e.g. employee assignments, ratings, payment gateways, multi-tenant billing) were deliberately omitted to maintain pristine focus on the core hiring requirements.

---

## 15. Documentation Index

For in-depth technical details, consult the comprehensive master documentation files:
* [Backend Architecture & Technical Specification](docs/BACKEND.md) — Database design (PostgreSQL & Drizzle ORM), 17-step booking engine, collision prevention algorithm, complete REST API specification, RBAC middleware, and setup guide.
* [Frontend Architecture & Technical Specification](docs/FRONTEND.md) — Next.js 16 App Router breakdown of all 14 pages, Redux Toolkit Query cache architecture, Vanilla CSS design system, Fixed Viewport admin console, and workflows.

