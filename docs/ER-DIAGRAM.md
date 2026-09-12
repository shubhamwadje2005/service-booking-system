# Entity Relationship Diagram: Service Booking System

The following diagram illustrates the relational data model for the Service Booking System using PostgreSQL and Drizzle ORM.

```mermaid
erDiagram
    users {
        uuid id PK "gen_random_uuid()"
        varchar name "NOT NULL"
        varchar email UK "NOT NULL, UNIQUE"
        text password "NOT NULL, Hashed"
        varchar role "NOT NULL, DEFAULT 'CUSTOMER'"
        timestamptz created_at "NOT NULL, DEFAULT now()"
        timestamptz updated_at "NOT NULL, DEFAULT now()"
    }

    services {
        uuid id PK "gen_random_uuid()"
        varchar name "NOT NULL"
        text description "NULLABLE"
        numeric price "NOT NULL, precision 10, scale 2"
        integer duration "NOT NULL, minutes"
        boolean is_active "NOT NULL, DEFAULT true"
        timestamptz created_at "NOT NULL, DEFAULT now()"
        timestamptz updated_at "NOT NULL, DEFAULT now()"
    }

    bookings {
        uuid id PK "gen_random_uuid()"
        uuid customer_id FK "REFERENCES users(id) ON DELETE CASCADE"
        uuid service_id FK "REFERENCES services(id) ON DELETE RESTRICT"
        date booking_date "NOT NULL, format YYYY-MM-DD"
        time start_time "NOT NULL, format HH:mm"
        time end_time "NOT NULL, format HH:mm"
        numeric amount "NOT NULL, precision 10, scale 2"
        varchar status "NOT NULL, DEFAULT 'PENDING'"
        timestamptz created_at "NOT NULL, DEFAULT now()"
        timestamptz updated_at "NOT NULL, DEFAULT now()"
    }

    users ||--o{ bookings : "places (1:N)"
    services ||--o{ bookings : "contains (1:N)"
```

---

## Relationship Semantics

### 1. User to Bookings (`users ||--o{ bookings`)
* **Multiplicity**: One User can place zero, one, or many Bookings (`1:N`).
* **Cascade Behavior**: If a user is removed, their associated bookings cascade delete (`ON DELETE CASCADE`).
* **Ownership**: Every booking strictly belongs to one customer (`customer_id`).

### 2. Service to Bookings (`services ||--o{ bookings`)
* **Multiplicity**: One Service can be referenced by zero, one, or many Bookings (`1:N`).
* **Protection Behavior**: Deletion of a service that has associated historical bookings is restricted (`ON DELETE RESTRICT`) to preserve audit and financial records. Administrators deactivate services (`is_active = false`) instead of hard deletion.
