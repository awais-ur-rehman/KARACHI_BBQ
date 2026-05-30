# Implementation Document
### Restaurant Inventory & Sales Management System

| | |
|---|---|
| **Document** | Implementation |
| **Version** | 1.0 (Draft for review) |
| **Status** | Pending sign-off |
| **Builds on** | 01-PRD, 02-TRD, 03-UI-UX, 04-App-Flow, 05-Backend-Schema |
| **Scope** | v1 — offline-first, single PC, Docker Compose, sync-ready |
| **Last updated** | 30 May 2026 |

---

## 1. Purpose

This is the build plan: how the system is structured, in what order it is delivered, and the mechanics of the parts that need care (atomic transactions, the print agent, backups, seeding, and the first-run setup). It assumes the stack from the TRD: React/TS + NestJS + PostgreSQL + Prisma, behind nginx, in Docker Compose.

---

## 2. Repository structure

A single monorepo:

```
restaurant-system/
├─ infra/
│  ├─ docker-compose.yml          # nginx, frontend, backend, db, backup
│  ├─ nginx/                      # reverse-proxy + static config
│  └─ .env.example                # deployment variables
├─ backend/                       # NestJS API
│  ├─ src/
│  │  ├─ modules/                 # one folder per domain (see §4)
│  │  ├─ common/                  # guards, interceptors, filters, pipes
│  │  └─ main.ts
│  └─ prisma/
│     ├─ schema.prisma            # implements 05-Backend-Schema
│     ├─ migrations/
│     └─ seed.ts                  # reference + first-run data
├─ frontend/                      # React + Vite SPA
│  ├─ src/
│  │  ├─ features/                # mirrors the screens (counter, inventory…)
│  │  ├─ components/  lib/  i18n/  # en + ur bundles
│  │  └─ main.tsx
├─ print-agent/                   # host helper for USB/OS printing (§6)
└─ docs/                          # these six documents
```

---

## 3. Environment & deployment

### 3.1 Docker Compose services
`nginx` (port 80, static frontend + `/api` proxy) · `backend` (NestJS) · `db` (PostgreSQL + `pgdata` volume) · `backup` (scheduled `pg_dump`, or run by the backend's cron). Volumes: `pgdata`, `backups` (mapped to an external drive), `uploads` (logo). The whole system starts with `docker compose up -d`; a restart policy brings it back after a PC reboot.

### 3.2 Key env (`infra/.env`)
`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PRINT_MODE` (bootstrap default), `PRINTER_IP/PORT`, `PRINT_AGENT_URL`, `DEFAULT_LANGUAGE`, `DEFAULT_CURRENCY=PKR`, `BACKUP_DIR`, `TZ`. Runtime-editable operational values (charges, payment methods, identity, printer config, backup schedule) live in the DB, not env.

---

## 4. Backend modules (NestJS)

Each maps to a domain in the schema; cross-cutting concerns live in `common/`.

| Module | Responsibility |
|---|---|
| `auth` | Password + PIN login, JWT cookies, refresh/rotation. |
| `users` | Account CRUD, deactivation (Super Admin). |
| `settings` | Identity, language, printer config, backup schedule. |
| `inventory` | Units, categories, items; `qty_on_hand` cache. |
| `costing` | Weighted-average recompute on receipt. |
| `menu` | Dishes (recipe + resale), ingredients, availability, margin. |
| `vendors` | Vendors, purchases (GRN), payments, dues, returns. |
| `stock` | `stock_movements` ledger, counts/adjustments, variance. |
| `orders` | Draft CRUD, KOT, optimistic locking, linked orders. |
| `billing` | Charges, charge_rates, payment_methods, the bill-print transaction, payment settlement, completion, cancellation. |
| `printing` | Render + dispatch (network thermal direct, agent for USB/A4). |
| `reports` | Sales, consumption, variance, margins, dues, pending/cancelled. |
| `audit` | Append-only event writes + read API (Super Admin). |
| `backups` | Schedule, "Backup now", retention, history. |

### 4.1 Cross-cutting (`common/`)
- **RBAC guard** — enforces the PRD matrix per route; deny-by-default. Cancellation, discount, users, settings are Super-Admin-only.
- **Audit interceptor** — writes `audit_events` for every mutating action (entity, actor, before/after); the same feed is the v2 sync outbox.
- **Transaction helper** — wraps the critical flows (bill print, cancellation, receipt, count) so each is atomic.
- **Validation pipe** — DTO validation on every endpoint; **error filter** — consistent error envelope.

### 4.2 Services that carry the rules
- **UnitConversionService** — converts recipe quantities to an item's stock unit using `units.factor_to_base`; rejects cross-family.
- **CostingService** — the weighted-average formula on receipt (Schema §14.2).
- **ChargeResolutionService** — for a (category, method): selects applicable charges and the right `charge_rates` row (method-specific, else null default).
- **BillingService** — orchestrates the bill-print transaction: freeze snapshots, build the grouped per-profile options + charge lines, deduct stock, audit; later settles the chosen option at payment.

---

## 5. Database: migrations & seeding

- **Migrations** via Prisma Migrate, implementing 05-Backend-Schema; `uuid` v7 PKs, soft-delete columns, append-only tables.
- **Seed (`seed.ts`)** loads:
  - **Units** with `factor_to_base` (kg/g, l/ml, piece, dozen…).
  - **Charges:** `GST` (applies to all categories) and `Service Charge` (Gents/Family only), with rates left for the admin to set during first-run.
  - **Payment methods:** Cash, Card, Bank, Easypaisa.
  - **Charge rates:** placeholders (e.g., GST default + per-method overrides) to be edited in setup.
  - **Settings** singleton with sensible defaults (language `en`, currency `PKR`, nightly backup).
  - **First Super Admin** user (credentials set during first-run, not committed).

### 5.1 First-run setup wizard
On an empty system, the app guides the Super Admin through: create the admin account → restaurant identity (name, logo, address, phone, tax number) → **printer setup** ("what printer do you have?") → **charges** (GST/service rates, per-method GST) → payment methods review → create staff users. Until complete, only setup routes are accessible.

---

## 6. Printing & the host print agent

- **Content:** `printing` module renders **ESC/POS** (thermal, 58/80mm) or a **PDF** (A4) from a shared bill/KOT template, honoring active language/RTL.
- **Dispatch:**
  - **Network thermal** → backend sends ESC/POS straight to `PRINTER_IP:PORT`.
  - **USB thermal / A4-to-local-printer** → backend POSTs the job to the **print agent** at `PRINT_AGENT_URL`; the agent (a small native tray app on the PC) sends it to the selected USB/OS printer. This is what makes USB work on Windows and Linux alike.
  - *Linux-only shortcut:* a USB printer may be passed into the container via `devices:` instead of using the agent.
- **Reliability:** printing happens **after** the bill transaction commits; on failure the bill is saved and reprintable (`bills.reprint_count`, logged), and the UI offers retry.

---

## 7. Frontend implementation

- **React + Vite + TypeScript**, Tailwind (logical properties + RTL plugin), TanStack Query for server state, React Router, react-i18next (`en`/`ur`).
- **Role-aware shell:** sidebar/bottom-nav filtered by role (UI mirrors RBAC; server still enforces).
- **Feature folders** map to screens: `counter`, `orders`, `menu`, `inventory`, `vendors`, `stock`, `reports`, `audit`, `users`, `settings`.
- **Counter screen** is the priority: two-pane on desktop (table grid + menu / live cart), single-column with slide-up cart on phone; large touch targets; optimistic UI with "order changed, reload" on version conflicts.
- **Billing screen** shows the grouped per-profile breakdown; discount visible only to Super Admin; settlement on payment.
- **Localization:** `dir="rtl"` at root for Urdu; `Intl` for PKR/number/date formatting; no hardcoded strings.

---

## 8. Backups & restore

- **Scheduled:** a cron (in the `backup` service or backend) runs `pg_dump` to `BACKUP_DIR` per `settings.backup_cron`; prune beyond `settings.backup_retention`; log to `backups`.
- **On-demand:** `POST /settings/backup-now` triggers an immediate dump (Super Admin).
- **Restore:** documented operator procedure (`pg_restore`/`psql` against the volume) in `docs/runbook`.

---

## 9. Testing strategy

- **Unit:** unit conversion, weighted-average costing, charge resolution, grand-total computation per profile.
- **Integration (critical):** the **bill-print transaction** (lock + snapshots + grouped options + stock deduction + audit, all-or-nothing), **payment settlement**, **cancellation + restock**, **receipt + avg-cost**, **stock count adjustment**. Assert atomicity and that nothing is hard-deleted.
- **RBAC:** every protected route rejects unauthorized roles (especially cancel/discount/users/settings).
- **E2E:** the counter happy path (create → KOT → bill → pay → complete) and the new-linked-order path after lock, in both EN and UR.

---

## 10. Security checklist

Argon2 password/PIN hashing · server-side RBAC deny-by-default · DTO validation + parameterized queries · httpOnly + same-site cookies + CSRF protection · auth rate limiting/backoff · secrets via env only · audit on sensitive + auth events · append-only audit integrity.

---

## 11. Phased delivery plan

| Phase | Deliverable |
|---|---|
| **0 — Foundation** | Monorepo, Docker Compose, nginx, Prisma schema + migrations + seed, auth + RBAC + audit skeleton, settings, first-run wizard. |
| **1 — Inventory core** | Units, categories, items, vendors, purchases (GRN) with weighted-average, `stock_movements` ledger, low-stock alerts. |
| **2 — Menu** | Dishes (recipe + resale), ingredients with unit conversion, availability, food-cost/margin. |
| **3 — Orders/counter** | Draft order CRUD, order items + instructions, table/parcel logic, KOT print, optimistic locking, counter UI. |
| **4 — Billing** | Charges/charge_rates/payment_methods, atomic bill-print (snapshots + grouped options + deduction), payment settlement, completion, cancellation+restock, printing (agent + thermal + A4 PDF). |
| **5 — Stock ops** | Physical count/adjustment + variance, returns, vendor payments/dues. |
| **6 — Insight** | Reports & analytics, audit viewer, role dashboards. |
| **7 — Polish** | Backups (schedule + manual + retention + restore), EN/UR RTL, responsive/mobile pass. |
| **8 — Hardening** | Test suites, security pass, performance, runbook & deployment docs. |

---

## 12. Definition of done (per PRD success criteria)

- A Sales Manager can create → KOT → bill → take payment → complete an order, and cannot touch anything outside their role.
- An Inventory Manager can manage items/recipes/vendors, receive stock (avg cost updates), and run a physical count.
- After a day, the Super Admin sees sales totals, consumption, variance, low-stock, vendor dues, pending/cancelled orders, and a full audit trail.
- Bills print correctly on the configured printer with the transparent per-method breakdown; totals settle at payment.
- Nothing is ever hard-deleted; nightly + on-demand backups run; the system works fully offline and survives a reboot.
- Full English/Urdu (RTL) and responsive desktop/phone behavior.

---

## 13. Sync (v2) — hooks already in place

No sync engine ships in v1, but it requires no schema change later: UUID keys, `updated_at`/`version`, soft deletes, and the append-only `audit_events` feed (with `seq` and `synced_at`) are the replication primitives. v2 adds a sync service that replays the feed to a central node and a read-only owner mobile view.

---

## 14. Risks & mitigations

| Risk | Mitigation |
|---|---|
| USB printer access from a container (esp. Windows) | Host print agent abstracts USB/OS printing; network thermal avoids it entirely. |
| Single-PC data loss | Nightly + on-demand backups to an external drive; documented restore. |
| Theoretical vs physical stock drift | Periodic physical counts + variance report; stock is explicitly an estimate. |
| Concurrent edits by two sales managers | Optimistic locking with a clear reload prompt. |
| Charges/printing misconfigured at go-live | First-run wizard forces identity, printer, and charge setup before use. |

---

## 15. Ready to build

All six documents are now consistent and self-contained. Recommended start: **Phase 0**, standing up the schema, auth/RBAC, audit, and the first-run wizard — everything else builds on that spine.
