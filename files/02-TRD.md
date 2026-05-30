# Technical Requirements Document (TRD)
### Restaurant Inventory & Sales Management System

| | |
|---|---|
| **Document** | Technical Requirements Document |
| **Version** | 1.0 (Draft for review) |
| **Status** | Pending sign-off |
| **Builds on** | 01-PRD.md v1.0 |
| **Scope** | v1 — single restaurant, single PC, offline-first, sync-ready |
| **Last updated** | 30 May 2026 |

---

## 1. Purpose & scope

This document translates the product requirements into a concrete technical design: the stack, architecture, deployment model, data principles, security, and the integrity rules that protect the system's invariants (no hard deletes, lock-on-print, snapshot pricing, atomic stock deduction, full audit). It deliberately stops short of table-level schema (see 05-Backend-Schema) and code structure (see 06-Implementation).

All choices serve three constraints from the PRD:
1. **Offline-first** on a single PC, deployed with Docker Compose.
2. **Sync-ready** so v2 can add multi-machine sync and an owner mobile view without re-architecting.
3. **Responsive web** usable on desktop and phone, in English and Urdu (RTL).

---

## 2. Architecture overview

A single-origin web application. Everything runs locally in Docker; the browser talks only to `localhost`. No external network is required to operate.

```
                         ┌──────────────────────────────────────────┐
                         │              Single PC (host)              │
                         │                                            │
   Browser (desktop /    │   ┌────────────┐      ┌────────────────┐   │
   phone on LAN)  ──────────▶│   nginx    │─────▶│   Frontend     │   │
                         │   │ reverse    │      │ (static React  │   │
                         │   │ proxy :80  │      │  build)        │   │
                         │   │            │      └────────────────┘   │
                         │   │            │      ┌────────────────┐   │
                         │   │            │─────▶│   Backend API  │   │
                         │   └────────────┘      │   (NestJS)     │   │
                         │                       └───────┬────────┘   │
                         │                               │            │
                         │   ┌────────────┐      ┌───────▼────────┐   │
   Thermal/A4 printer ◀──────│ print path │◀─────│  PostgreSQL    │   │
   (network or host)     │   └────────────┘      │  (volume)      │   │
                         │                       └───────┬────────┘   │
                         │                       ┌───────▼────────┐   │
                         │                       │ Backup volume  │   │
                         │                       │ (pg_dump files)│   │
                         │                       └────────────────┘   │
                         └──────────────────────────────────────────┘
```

**Components**
- **nginx** — serves the built frontend and reverse-proxies `/api` to the backend, giving a single origin (`http://localhost`) and avoiding CORS.
- **Frontend** — React SPA, built to static assets.
- **Backend** — NestJS API: business logic, RBAC, audit, printing, backups.
- **PostgreSQL** — durable store on a named Docker volume.
- **Backup** — scheduled `pg_dump` to a mounted backup volume / external drive.

---

## 3. Technology stack

Recommended stack with rationale. Alternatives are listed; these are recommendations, not hard mandates.

### 3.1 Frontend
- **React + TypeScript (Vite build).** Mature, responsive, large ecosystem.
- **Tailwind CSS** with logical properties + RTL plugin — clean responsive layouts and first-class RTL for Urdu.
- **TanStack Query** for server-state/data fetching and caching; keeps the UI snappy on the counter.
- **React Router** for navigation; **react-i18next** for English/Urdu localization.
- **Component layer:** a headless/utility kit (e.g., shadcn/ui or Mantine) for accessible inputs, tables, dialogs.

### 3.2 Backend
- **Node.js + TypeScript + NestJS.** Chosen because its **Guards** map directly onto the RBAC matrix and its **Interceptors** make global audit logging clean — both are core requirements. Modular structure keeps inventory, orders, billing, etc. cleanly separated and maintainable.
- *Alternative:* Fastify/Express if a lighter footprint is preferred; you lose the built-in guard/interceptor structure and rebuild it manually.
- **Validation:** `class-validator` + DTOs (or Zod) on every endpoint.

### 3.3 Database & data access
- **PostgreSQL.** Native UUIDs, JSONB (ideal for audit before/after and price snapshots), strong reporting/aggregation, excellent concurrency for the 3–4 simultaneous users, and the cleanest path to v2 sync. Runs trivially in Docker.
- *Alternative considered:* SQLite — simpler for a single PC, but weaker for concurrent writes, reporting, and future sync. Rejected for those reasons.
- **ORM:** **Prisma** for type-safe queries and first-class migrations. *Alternative:* TypeORM (NestJS-native).

### 3.4 Infrastructure
- **Docker Compose** orchestrating `nginx`, `frontend` (build artifact served by nginx), `backend`, `db`, and the backup mechanism.
- Single command (`docker compose up -d`) brings the whole system online on the PC.

---

## 4. Deployment & configuration

### 4.1 Compose services & volumes
| Service | Role | Persistence |
|---|---|---|
| `nginx` | Reverse proxy + static frontend on port 80 | — |
| `backend` | NestJS API | — |
| `db` | PostgreSQL | `pgdata` named volume |
| `backups` | Scheduled `pg_dump` (sidecar or backend cron) | `backups` volume → external drive mount |
| (uploads) | Restaurant logo / assets | `uploads` volume |

The frontend can be served as static files by nginx; the backend remains a separate service for clarity and future scaling.

### 4.2 Key environment variables
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Auth signing keys |
| `PRINT_MODE` | `a4` or `thermal` — selects the bill/KOT output path |
| `PRINTER_IP` / `PRINTER_PORT` | Network thermal printer target (thermal mode) |
| `DEFAULT_LANGUAGE` | `en` or `ur` |
| `DEFAULT_CURRENCY` | `PKR` |
| `BACKUP_DIR` | Mount path for backup files |
| `TZ` | Local timezone (for order timestamps, daily reports) |

Operational settings the **owner** can change at runtime (GST %, service %, backup schedule, restaurant identity) live in the **settings table**, not in env — env is for deployment-time wiring only. **Printer configuration (type and connection) is a user-selected in-app setting** — the user is asked what printer they have during setup — and the `PRINT_MODE` / `PRINTER_*` env vars serve only as initial bootstrap defaults.

---

## 5. Data architecture & sync-readiness

Even though v1 ships no sync engine, every entity is built so v2 sync is a pure addition:

- **UUID primary keys** (UUID v7 preferred — time-ordered, index-friendly) on all entities. No auto-increment IDs that would collide across machines.
- **Timestamps everywhere:** `created_at`, `updated_at`, and `created_by` / `updated_by`.
- **Soft delete only:** a `deleted_at` (or status) column; the application never issues hard `DELETE`. This satisfies the PRD's "never delete" rule *and* is exactly what sync needs.
- **Append-only event/outbox log:** every state change writes an immutable event (entity, type, payload, actor, timestamp). In v1 this powers the audit trail; in v2 it becomes the replication feed.
- **Row version** (integer or `updated_at`) for optimistic concurrency and a future last-write-wins merge baseline.

This design intentionally makes the audit log and the sync feed the *same underlying mechanism*, so we build it once.

---

## 6. Authentication & authorization

### 6.1 Authentication
- **Username + password** for all users; passwords hashed with **Argon2** (bcrypt acceptable).
- **PIN login** for Sales Managers: a short numeric PIN, hashed and rate-limited, for fast counter sign-in. Configurable per user by the admin.
- **Tokens:** short-lived JWT access token + refresh token, delivered in **httpOnly cookies** (mitigates XSS token theft; CSRF protection via same-site cookies + token). This works offline today and extends cleanly to the v2 mobile client.

### 6.2 Authorization (RBAC)
- The PRD permission matrix is enforced **server-side** via NestJS Guards on every route; the frontend only hides controls for UX.
- Sensitive capabilities are gated explicitly: **cancellation, discounts, user management, and settings are Super-Admin-only**; the backend rejects these for any other role regardless of client state.
- All authorization decisions and denials are logged.

---

## 7. Core transactional flows & integrity

These flows must be **atomic** — wrapped in a single database transaction — so the system can never end up half-updated.

### 7.1 Bill print (lock + deduct + bill + audit)
The defining transaction. On bill print, in one transaction:
1. Re-check the order is still in `Draft` and matches the client's version (optimistic lock) — reject if already printed or stale.
2. Set status to `Printed` (locked).
3. Create the **bill**, freezing the **method-independent** parts: each line's price × quantity, subtotal, discount (if admin), and service charge (dropped for Parcel). Compute and store the **per-payment-method options** (each method's GST/charge breakdown and grand total) for the transparent printed bill. The final GST/charges and grand total are **settled later when payment is recorded** (per chosen method), then frozen.
4. **Deduct stock** for every line — recipe ingredients (converted to each item's stock unit) or one unit of the resale item.
5. Write the **audit/outbox event(s)**.
6. Commit. The print render happens only after a successful commit (see 10.4).

```
sequence (bill print)
Sales Mgr ──▶ Backend: POST /orders/{id}/print
Backend  ── BEGIN TX
            ├─ verify Draft + version
            ├─ status = Printed (locked)
            ├─ create Bill (snapshot prices, GST, service, discount, totals)
            ├─ deduct stock per line (unit-converted)
            ├─ write audit + outbox events
            └─ COMMIT
Backend  ──▶ render bill (A4/thermal) ──▶ printer
Backend  ──▶ 200 {bill}
```

### 7.2 Cancellation (Super Admin) with restock prompt
In one transaction: verify caller is Super Admin → set status to `Cancelled` → if the admin chose **restock**, add the previously deducted quantities back to inventory; if not, leave them consumed → write audit. Never deletes.

### 7.3 Weighted-average cost on receipt
On each stock receipt, recompute the item's moving average in the same transaction that increases quantity:
```
new_avg_cost = (qty_on_hand * old_avg_cost + received_qty * received_unit_cost)
               / (qty_on_hand + received_qty)
```
Each receipt also stores its own unit cost for history.

### 7.4 Unit conversion
A units module defines families (weight / volume / count) and conversion factors to a base unit per family. Recipe quantities are stored in any compatible unit and converted to the item's stock unit at deduction time. Cross-family conversion is rejected at validation.

### 7.5 Concurrency
Orders carry a version; edits and the print transaction use optimistic locking so two sales managers can't silently overwrite the same draft. Conflicts return a clear "order changed, reload" error.

---

## 8. API design

- **REST over HTTP, JSON**, namespaced `/api/v1`, single origin behind nginx.
- Resource-oriented endpoints grouped by module; state transitions are explicit sub-resources (e.g., `POST /orders/{id}/kot`, `POST /orders/{id}/print`, `POST /orders/{id}/cancel`).
- **Validation** on every request via DTOs; **consistent error envelope** (`code`, `message`, `details`).
- **Pagination, filtering, sorting** on all list endpoints (orders, audit, reports).
- All mutating endpoints are **idempotent where feasible** and **transactional** per §7.

### 8.1 Module surface (overview, not exhaustive)
| Module | Representative endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/pin-login`, `POST /auth/refresh`, `POST /auth/logout` |
| Users | `GET/POST/PATCH /users`, `PATCH /users/{id}/deactivate` |
| Inventory items | `GET/POST/PATCH /items`, `GET /items/low-stock` |
| Categories | `GET/POST/PATCH /categories` |
| Dishes/menu | `GET/POST/PATCH /dishes` (recipe & resale types), `PATCH /dishes/{id}/availability` |
| Vendors | `GET/POST/PATCH /vendors`, `GET /vendors/{id}/dues` |
| Purchases | `POST /purchases` (receipt), `GET /purchases` |
| Returns | `POST /stock/returns` |
| Stock counts | `POST /stock/counts` (adjustment), `GET /stock/variance` |
| Orders | `GET/POST/PATCH /orders`, `POST /orders/{id}/kot`, `POST /orders/{id}/print`, `POST /orders/{id}/cancel`, `POST /orders/{id}/payment` |
| Reports | `GET /reports/sales`, `/reports/consumption`, `/reports/variance`, `/reports/pending`, `/reports/cancelled`, `/reports/margins` |
| Audit | `GET /audit` (Super Admin) |
| Settings | `GET/PATCH /settings`, `POST /settings/backup-now`, `PATCH /settings/backup-schedule` |

---

## 9. Audit logging architecture

- A **global interceptor** plus explicit domain events capture every meaningful action into the append-only event log: order created/edited/KOT/printed/reprinted/cancelled, payment recorded, stock received/adjusted/returned, price/availability changed, settings changed, user/login/auth-denied events.
- Each entry stores **actor, timestamp, action, target entity + id, and before/after JSONB** where relevant.
- The log is **write-only** from the application's perspective (no update/delete paths), making it tamper-evident, and is the same feed reused for v2 sync.

---

## 10. Printing architecture

### 10.1 User-selected printer configuration
During setup (and changeable any time after), the user is asked **what printer they have**, and the system follows that choice. Supported configurations:
- **A4 printer**
- **Thermal printer — network** (Ethernet/Wi-Fi, reached by IP)
- **Thermal printer — USB**

The selection (type + connection details such as IP/port or USB device) is stored in **settings**, so switching printers needs no redeploy. The `PRINT_MODE` / `PRINTER_*` env values serve only as the initial bootstrap defaults. Both KOT and bill use the configured printer; a shared template produces the receipt content, and only the rendering format and delivery transport differ by configuration.

### 10.2 Content rendering
- **Thermal:** ESC/POS commands sized for 58/80mm (`node-thermal-printer` or similar).
- **A4:** a server-generated **PDF**.

### 10.3 Delivery transport
Because the backend runs in a container, it cannot reliably reach USB devices on every host OS (notably Windows). Delivery therefore goes through a transport abstraction:
- **Network thermal** → backend sends ESC/POS directly to `PRINTER_IP:PRINTER_PORT`.
- **USB thermal** and **A4 to a local/OS printer** → delivered via a lightweight **host print agent**: a small native helper running on the PC that exposes a localhost endpoint, receives the print job (ESC/POS or PDF) from the backend, and passes it to the selected USB/OS printer. This makes USB printing work uniformly across Windows and Linux.
- *Linux-host shortcut:* a USB thermal printer may alternatively be passed into the backend container via a Docker `devices:` mapping, skipping the agent. The agent remains the portable default for mixed/Windows environments.

### 10.4 Reliability
- Printing happens **only after** the bill transaction commits, so a printer failure never corrupts data.
- If printing fails, the bill still exists and is **reprintable** (reprints are logged per PRD). The UI surfaces a clear "print failed — retry" action.

---

## 11. Reporting & analytics

- Built from order/bill data, stock movements, and the audit/event log.
- Heavy aggregates (daily sales, item-wise sales, consumption, variance, margins, vendor dues, pending/cancelled lists) are computed with SQL aggregation; can be backed by **database views or materialized views** if needed for speed.
- All monetary figures in reports come from **stored snapshots**, never recomputed from current prices, so history stays accurate.

---

## 12. Localization & RTL

- **react-i18next** with `en` and `ur` translation bundles; language is a user/owner setting with `DEFAULT_LANGUAGE` fallback.
- **RTL:** `dir="rtl"` toggled at the document root for Urdu; Tailwind logical properties + RTL plugin handle mirroring.
- **Formatting:** numbers, dates, and **PKR currency** formatted via the `Intl` API per active locale.
- Printed receipts respect the active language/direction.

---

## 13. Backup & restore

- **Mechanism:** scheduled `pg_dump` to `BACKUP_DIR` (a mounted volume, ideally an external drive).
- **Schedule:** default **nightly**, **admin-configurable** via settings; plus an **on-demand "Backup now"** endpoint (`POST /settings/backup-now`).
- **Retention:** keep the last N backups (configurable), prune older.
- **Restore:** documented `pg_restore`/`psql` procedure; restore is an operator action, not an in-app button in v1.

---

## 14. Security

- Argon2 password hashing; hashed, rate-limited PINs.
- Server-side RBAC on every route; deny-by-default.
- Input validation + parameterized queries (ORM) → no injection.
- httpOnly + same-site cookies; CSRF protection on mutating routes.
- Rate limiting on auth endpoints; lockout/backoff on repeated failures.
- Secrets via env, never committed; distinct secrets per deployment.
- Audit log for sensitive actions and auth events.

---

## 15. Non-functional targets

| Area | Target |
|---|---|
| Order entry responsiveness | UI interactions < ~150 ms; print transaction commit typically < ~500 ms |
| Concurrent users | 3–4 simultaneous (admin + inventory + 2 sales) with no contention issues |
| Availability | Runs fully offline; survives PC reboot via Docker restart policy |
| Data safety | No hard deletes; nightly + on-demand backups; atomic critical transactions |
| Localization | Full EN/UR incl. RTL and locale formatting |
| Portability | Single `docker compose up` on any Docker-capable PC |

---

## 16. Observability

- Structured backend logs (request, actor, outcome) to stdout/file volume.
- Health endpoints for `db` and `backend` so Compose can report readiness.
- The audit/event log doubles as a business-level activity record.

---

## 17. Future sync architecture (v2 outline — not built in v1)

- A sync service replays the **append-only event log** between machines and a central node, using UUID keys, `updated_at`/version, and soft deletes already present from v1.
- Baseline conflict strategy: **last-write-wins** by `updated_at`, with the event log preserving full history for manual reconciliation.
- The owner's **mobile view** is a read-only client against the central node.
- No v1 schema changes are required to enable this.

---

## 18. Resolved technical decisions

All previously open items are confirmed:

1. **Stack approved** — React/TS + NestJS + PostgreSQL + Prisma, Dockerized behind nginx.
2. **Printer connectivity** — the system **supports both network and USB thermal printers plus A4**, and the **user selects their printer type during setup**; the system follows that choice. USB and A4-to-local-printer are delivered through a **host print agent** (portable across Windows/Linux); network thermal is reached directly by the backend; a Linux host may alternatively use Docker device passthrough for USB.
3. **A4 bills** are rendered as **server-generated PDFs**.
4. **Frontend hosting** — served by **nginx** as a static build, with `/api` reverse-proxied to the backend (single origin).

No outstanding technical questions remain for v1.
