# plan.md — Build Plan, Phase 0 → 8

This is the granular execution guide for Claude Code. Each phase has: **goal**, **pre-conditions**, **ordered tasks**, **prototype references** (for UI work), **acceptance criteria**, and **suggested model + effort**. Don't start phase N+1 until phase N's acceptance criteria pass.

Cross-cutting rules from `CLAUDE.md` apply throughout: no hard deletes, lock-on-print, snapshots, RBAC, audit-on-mutation, atomic critical transactions, EN/UR + RTL from day one.

---

## Phase 0 — Foundation

**Suggested model + effort:** `claude-opus-4-7 | --high effort`

**Goal.** Stand up the monorepo, Docker stack, full database schema, auth + RBAC + audit skeleton, settings, and the first-run setup wizard so every later phase has a working spine.

**Pre-conditions.** Empty `backend/` and `frontend/`. Planning docs in `./files/`. CLAUDE.md committed at the project root.

### Tasks

#### 0.1 Repo + workspace
1. Initialise git in repo root if not already.
2. Create top-level monorepo dirs: `infra/`, `backend/`, `frontend/`, `print-agent/` (empty placeholder), `files/` (already exists).
3. Add root `.gitignore` (node_modules, dist, .env, *.local, pgdata, backups, uploads, .DS_Store).
4. Add root `README.md` (one paragraph + link to `CLAUDE.md`).

#### 0.2 Backend scaffold (NestJS + Prisma)
1. `cd backend && nest new .` (TypeScript, npm or pnpm — pick one and stick with it across the repo).
2. Install: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `argon2`, `cookie-parser`, `helmet`, `class-validator`, `class-transformer`, `@prisma/client`.
3. Dev install: `prisma`, `@types/cookie-parser`.
4. `npx prisma init` — generates `backend/prisma/schema.prisma`.
5. Configure `main.ts`: global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`, `cookieParser`, `helmet`, global API prefix `/api/v1`.

#### 0.3 Prisma schema outline (full)

Mirror `05-Backend-Schema.md` one-to-one. Add **every** table listed below to `backend/prisma/schema.prisma`. Use UUID v7 defaults (`@default(dbgenerated("uuidv7()"))` via a Postgres extension, or Prisma's `@default(uuid())` with a custom Postgres function — document the choice).

**Enums (schema §2):**
- `UserRole` { SUPER_ADMIN, INVENTORY_MANAGER, SALES_MANAGER }
- `UnitFamily` { WEIGHT, VOLUME, COUNT }
- `DishType` { RECIPE, RESALE }
- `OrderCategory` { GENTS_HALL, FAMILY_HALL, PARCEL }
- `OrderStatus` { DRAFT, PRINTED, DELIVERED, COMPLETED, CANCELLED }
- `MovementType` { RECEIPT, SALE_DEDUCTION, ADJUSTMENT, RETURN, CANCEL_RESTOCK }
- `MovementRefType` { PURCHASE, ORDER, COUNT, RETURN, CANCEL }
- `ChargeKind` { PERCENTAGE }
- `ChargeBase` { SUBTOTAL_AFTER_DISCOUNT }
- `BackupType` { SCHEDULED, MANUAL }
- `BackupStatus` { RUNNING, SUCCESS, FAILED }
- `AuditAction` { CREATE, UPDATE, KOT, PRINT, REPRINT, CANCEL, PAYMENT, DELIVER, COMPLETE, RECEIPT, ADJUSTMENT, RETURN, VENDOR_PAYMENT, SETTINGS_CHANGE, LOGIN, LOGIN_FAILED, LOGOUT }

**Common columns** (on every non-append-only table): `id`, `created_at`, `updated_at`, `created_by?`, `updated_by?`, `deleted_at?`, `version`.

**Append-only tables** (no `updated_at`/`deleted_at`/`version`): `stock_movements`, `audit_events`, `bill_payment_options`, `bill_option_charge_lines`, `backups`.

**Tables to add** (one Prisma `model` block each — full column list per `05-Backend-Schema.md`):

| Block | Source section | Notes |
|---|---|---|
| `User` | §4.1 | `username` unique, `password_hash`, `pin_hash?`, `role`, `full_name`, `active`, `last_login_at?` |
| `RefreshToken` | §4.2 | `user_id`, `token_hash`, `expires_at`, `revoked_at?` |
| `Settings` | §5.1 | Singleton row enforced by a CHECK constraint or unique sentinel; includes `printer_config Json` |
| `Unit` | §6.1 | `name`, `family UnitFamily`, `factor_to_base Decimal(18,9)` |
| `ItemCategory` | §6.2 | |
| `Item` | §6.3 | `qty_on_hand Decimal(12,3)`, `avg_cost Decimal(12,2)`, `reorder_level?`, index `(category_id)`, partial index for low-stock |
| `MenuCategory` | §7.1 | |
| `Dish` | §7.2 | `type DishType`, `resale_item_id?` (required when RESALE, null when RECIPE — enforce in app + DB check) |
| `DishIngredient` | §7.3 | `(dish_id, item_id, quantity, unit_id)`; unit must share family with item's stock unit |
| `Vendor` | §8.1 | |
| `Purchase` | §8.2 | `total_value`, `received_date`, `invoice_ref?` |
| `PurchaseLine` | §8.3 | `quantity`, `unit_id`, `unit_cost`, `line_total` |
| `VendorPayment` | §8.4 | |
| `StockReturn` | §8.5 | One item per row |
| `StockMovement` | §9.1 | append-only; `quantity_delta Decimal(12,3)` signed, `movement_type`, `ref_type`, `ref_id`, indexes `(item_id, created_at)`, `(ref_type, ref_id)` |
| `StockCount` | §9.2 | |
| `StockCountLine` | §9.3 | `system_qty`, `counted_qty`, `variance`, `reason?` |
| `Order` | §10.1 | `order_number` unique, `category`, `table_number?`, `parcel_serial?`, `status`, `linked_parent_order_id?`, lifecycle timestamps, `cancel_restocked?`; indexes per schema doc |
| `OrderItem` | §10.2 | `dish_name_snapshot`, `unit_price_snapshot`, `line_total_snapshot`, `special_instructions?` |
| `PaymentMethod` | §11.1 | |
| `Charge` | §11.2 | `applies_to_categories OrderCategory[]`, `sort_order` |
| `ChargeRate` | §11.3 | `(charge_id, payment_method_id)` unique; `payment_method_id` nullable (NULL = default for all methods) |
| `Bill` | §11.4 | 1:1 with `Order` (`order_id` unique), `subtotal/discount/printed_at/reprint_count/settled_*` |
| `BillPaymentOption` | §11.5 | append-only; `member_method_ids uuid[]`, `charges_total`, `grand_total` |
| `BillOptionChargeLine` | §11.6 | append-only |
| `AuditEvent` | §12.1 | append-only; `seq BigInt @default(autoincrement())`, `before Json?`, `after Json?`, indexes `(entity_type, entity_id)`, `(created_at)`, `(seq)` |
| `Backup` | §13.1 | append-only |

**Raw-SQL migration extras** (add a custom migration after the initial Prisma migration generates):
- `CREATE SEQUENCE parcel_serial_seq;` — continuous parcel numbers, never reset.
- `CREATE EXTENSION IF NOT EXISTS pg_uuidv7;` (or equivalent) for UUID v7 generation.
- Singleton constraint on `Settings` (e.g. `id = 'singleton'` literal + unique index).
- CHECK constraints: `Dish.type='RESALE' => resale_item_id IS NOT NULL`, `type='RECIPE' => resale_item_id IS NULL`.

#### 0.4 Seed (`backend/prisma/seed.ts`)
Loads — in order, idempotent:
1. **Units** (with `factor_to_base`):
   - WEIGHT: kg (1), g (0.001)
   - VOLUME: l (1), ml (0.001)
   - COUNT: piece (1), dozen (12)
2. **Charges:**
   - `GST` — PERCENTAGE, base SUBTOTAL_AFTER_DISCOUNT, applies to `[GENTS_HALL, FAMILY_HALL, PARCEL]`, sort 1.
   - `Service Charge` — PERCENTAGE, base SUBTOTAL_AFTER_DISCOUNT, applies to `[GENTS_HALL, FAMILY_HALL]`, sort 2.
3. **Payment methods:** Cash, Card, Bank, Easypaisa (active, sort 1..4).
4. **Charge rate placeholders** (admin edits in first-run):
   - GST default (`payment_method_id NULL`) rate `0` (admin sets).
   - GST Cash-specific row (admin sets).
   - Service Charge default `0`.
5. **Settings singleton:** `default_language=en`, `currency=PKR`, `backup_cron='0 2 * * *'`, `backup_retention=14`, empty identity fields, empty printer config — all to be filled by the first-run wizard. Restaurant name placeholder.
6. **First Super Admin:** **only when DB empty**, create a temporary admin marker so the first-run wizard can finalise credentials (do NOT commit a real password; the wizard sets it).

#### 0.5 Cross-cutting modules (`backend/src/common/`)
1. **`PrismaModule` + `PrismaService`** — global, exposes `$transaction`.
2. **`TransactionHelper`** — wraps a callback in `prisma.$transaction(async (tx) => …)` with serializable isolation by default for critical flows.
3. **`JwtAuthGuard`** — verifies access cookie; attaches `req.user = { id, role }`.
4. **`RolesGuard`** + **`@Roles(...UserRole[])`** decorator — enforces the RBAC matrix from CLAUDE.md §5. Deny-by-default: an endpoint with no `@Roles` and not marked `@Public()` requires authentication.
5. **`AuditInterceptor`** — for mutating routes (POST/PATCH/DELETE) automatically writes an `AuditEvent` row with actor, entity-type, entity-id (extracted from response), action, before/after (from a context attached by the service when meaningful). Services can also call `AuditService.write(...)` explicitly.
6. **`AllExceptionsFilter`** — consistent error envelope `{ code, message, details }`.
7. **`ValidationPipe`** — already registered globally in `main.ts`.

#### 0.6 Auth module (`backend/src/modules/auth/`)
1. `POST /auth/login` — username + Argon2 password verify; issue access + refresh cookies (`httpOnly`, `SameSite=Strict`, `Secure` off for localhost dev).
2. `POST /auth/pin-login` — PIN verify (Argon2); rate-limited (e.g. 5 attempts / 5 min per user); only for Sales Managers.
3. `POST /auth/refresh` — refresh token rotation.
4. `POST /auth/logout` — clear cookies; revoke refresh token.
5. Every login attempt (success + failure) and logout writes an `AuditEvent` (`LOGIN`, `LOGIN_FAILED`, `LOGOUT`).

#### 0.7 Users + Settings modules
1. `users` — `GET /users`, `POST /users` (Super Admin), `PATCH /users/:id`, `PATCH /users/:id/deactivate`. Never hard-deletes; uses `active` flag.
2. `settings` — `GET /settings`, `PATCH /settings`. Singleton row.

#### 0.8 First-run setup wizard
A guarded flow that runs when:
- No Super Admin with a real password exists, OR
- `Settings.restaurant_name` is empty, OR
- `Settings.printer_config` is empty.

Until complete, only `/setup/*` routes (and `/auth/login` for the wizard's own login step) are accessible; the global guard returns `423 Locked` with a `code: 'SETUP_INCOMPLETE'` from other API routes.

Wizard steps (each a `POST /setup/<step>` that advances a `setup_state` flag):
1. Create the first Super Admin (username + password + full_name).
2. Restaurant identity (name, logo upload → uploads volume, address, phone, tax number).
3. Printer setup ("What printer do you have?" — A4 / thermal-network / thermal-USB, with IP+port or device path).
4. Charges (GST rates per method, Service Charge rate).
5. Payment methods review (toggle defaults).
6. (Optional) create initial staff users.
7. Mark setup complete.

Frontend mirrors these as a multi-step form; UI prototype reference: `screens/login.jsx` for the form patterns.

#### 0.9 Infra
1. `infra/docker-compose.yml` services:
   - **`db`** — `postgres:16`, env `POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB`, volume `pgdata:/var/lib/postgresql/data`, `restart: unless-stopped`, healthcheck.
   - **`backend`** — built from `backend/Dockerfile`, depends on `db` healthy, env from `.env`, exposes 3000 (internal), `restart: unless-stopped`.
   - **`nginx`** — `nginx:alpine`, mounts `nginx.conf` + built `frontend/dist/`, port `80:80`, reverse-proxies `/api/` → `backend:3000`, depends on `backend`.
   - **`backup`** — alpine + `postgresql-client`, runs cron from env, writes `pg_dump` to `/backups` volume mapped to host external drive.
2. `infra/nginx/nginx.conf` — serves `/` from `/usr/share/nginx/html`, proxies `/api/` to `backend:3000`, passes cookies.
3. `infra/.env.example`:
   ```
   # Database
   POSTGRES_USER=kbbq
   POSTGRES_PASSWORD=change-me
   POSTGRES_DB=kbbq
   DATABASE_URL=postgresql://kbbq:change-me@db:5432/kbbq?schema=public

   # Auth
   JWT_SECRET=change-me-32-chars-min
   JWT_REFRESH_SECRET=change-me-too-32-chars-min

   # Print (bootstrap defaults; runtime config in DB)
   PRINT_MODE=thermal
   PRINTER_IP=192.168.1.50
   PRINTER_PORT=9100
   PRINT_AGENT_URL=http://host.docker.internal:7878

   # Localization
   DEFAULT_LANGUAGE=en
   DEFAULT_CURRENCY=PKR
   TZ=Asia/Karachi

   # Backups
   BACKUP_DIR=/backups
   ```

#### 0.10 Frontend scaffold
1. `cd frontend && npm create vite@latest . -- --template react-ts`.
2. Install Tailwind (with `@tailwindcss/forms`, RTL plugin or equivalent logical-properties setup), TanStack Query, React Router, react-i18next + i18next-http-backend, axios or fetch wrapper.
3. Set up `i18n/` with `en.json` + `ur.json` stubs (login + setup keys to start).
4. Root component: language toggle, `<html dir>` switching, single auth context, route shell that gates on `/setup/*` vs `/app/*`.
5. Build the Login + first-run wizard screens (no other screens in phase 0).
6. API client with `withCredentials: true` and a response interceptor that handles `423 SETUP_INCOMPLETE` by routing to the wizard.

### Acceptance criteria — Phase 0

1. `docker compose up -d` brings up `db`, `backend`, `nginx` (frontend served as static). `GET http://localhost/api/v1/health` returns 200.
2. `prisma migrate dev` applied cleanly; `prisma db seed` populates units, charges, payment methods, charge-rate placeholders, and the settings singleton; re-running seed is idempotent.
3. With an empty system, the frontend loads the first-run wizard; the API rejects non-setup routes with `423 SETUP_INCOMPLETE`.
4. After completing the wizard, the Super Admin can log in with password, sees the role-filtered shell, and every login / logout / settings change is in `audit_events`.
5. A non-admin user calling a Super-Admin-only route (e.g. `PATCH /users/:id`) gets `403`, and the denial writes an audit event.

---

## Phase 1 — Inventory core

**Suggested model + effort:** `claude-sonnet-4-6 | default effort`

**Goal.** Implement the inventory domain: units, categories, items (with `qty_on_hand` cache), vendors, purchases (GRN) with weighted-average cost, the `stock_movements` ledger, and low-stock alerts.

**Pre-conditions.** Phase 0 acceptance passing. Schema migrated. Seed units present. Auth + RBAC working.

### Tasks

1. **`inventory` module:**
   - `GET/POST/PATCH /categories` — Inventory Mgr + Super Admin.
   - `GET/POST/PATCH /items` — fields per schema §6.3; auto-snapshot `created_by`/`updated_by` via interceptor.
   - `GET /items/low-stock` — uses partial index `WHERE qty_on_hand <= reorder_level`.
   - `GET /units` — read-only reference data.
2. **`costing` module:**
   - `CostingService.recomputeAverage(itemId, recvQty, recvUnitCost, tx)` implementing the formula in TRD §7.3 / Schema §14.2:
     ```
     new_avg = (qty_on_hand * old_avg + recv_qty * recv_cost) / (qty_on_hand + recv_qty)
     ```
3. **`vendors` module:**
   - `GET/POST/PATCH /vendors`.
   - `GET /vendors/:id/dues` — computed as Σ purchases.total_value − Σ vendor_payments.amount (returns credit deferred to Phase 5).
4. **`stock` module (subset for this phase):**
   - `POST /purchases` — atomic transaction:
     1. Insert `Purchase` header + `PurchaseLine` rows.
     2. For each line: convert qty to item's stock unit (`UnitConversionService`, see below); write a `StockMovement(RECEIPT)` row with `quantity_delta = +converted_qty`, `unit_cost`, `ref_type='PURCHASE'`, `ref_id=purchase.id`; update `Item.qty_on_hand += converted_qty`; recompute `Item.avg_cost`.
     3. Audit event `RECEIPT` with the receipt summary.
   - `GET /purchases` paginated.
5. **`UnitConversionService` (in `common/` or its own module):**
   - `toBaseUnit(qty, unitId)` → multiplies by `unit.factor_to_base`.
   - `convert(qty, fromUnitId, toUnitId)` — rejects cross-family with a typed exception.
   - Used by purchases, dish ingredients, future bill-print deductions.
6. **Low-stock flag** — exposed in list responses (`item.is_low_stock` boolean computed) and surfaced on the dashboard.

### Prototype references
- `screens/inventory.jsx` — items list + editor layout, low-stock badge.
- `screens/vendors.jsx` — vendors list, dues summary.
- The GRN screen pattern (referenced from `app.jsx` route `grn`): line grid with item + qty + unit + unit cost + line total, running total.

### Acceptance criteria — Phase 1
1. Receiving stock against a fresh item correctly sets `qty_on_hand` and `avg_cost`; a second receipt at a different unit cost updates `avg_cost` to the correct weighted-average.
2. The receipt is fully rolled back on any failure (e.g. unknown unit) — no `StockMovement` rows, no `qty_on_hand` change.
3. An item at or below `reorder_level` appears in `GET /items/low-stock`.
4. A `SALES_MANAGER` calling `POST /purchases` gets 403.

---

## Phase 2 — Menu

**Suggested model + effort:** `claude-sonnet-4-6 | default effort`

**Goal.** Dishes (recipe-based + direct resale), recipe ingredients with unit-family validation, availability toggle, food-cost / margin computation.

**Pre-conditions.** Phase 1 passing. Items + units populated.

### Tasks
1. **`menu` module:**
   - `GET/POST/PATCH /menu-categories`.
   - `GET/POST/PATCH /dishes` — accepts `type: RECIPE | RESALE`; validates:
     - `RECIPE` → ingredients array (each `{ item_id, quantity, unit_id }`); reject if `unit.family !== item.stock_unit.family`.
     - `RESALE` → `resale_item_id` required, no ingredients accepted.
   - `PATCH /dishes/:id/availability` — toggle the sold-out flag.
   - `GET /dishes/:id/cost-summary` — returns food cost (sum of `ingredient.qty_in_stock_unit * item.avg_cost`) and margin (`(price - cost) / price`).
2. **Dish-ingredient editor (frontend):**
   - Recipe form with unit-family-filtered unit picker per ingredient.
   - Live cost + margin readout.
3. Audit: `CREATE`/`UPDATE` on dishes (with before/after on price + availability changes especially).

### Prototype references
- `screens/menu.jsx` — dish editor with type switch (`RECIPE` / `RESALE`), ingredient list with unit picker, est. food cost + margin readout. Matches UI doc §S12.

### Acceptance criteria — Phase 2
1. Creating a RECIPE dish with a cross-family unit (e.g. recipe says `200 ml` but the item's stock unit is `kg`) returns 400.
2. Creating a RESALE dish with ingredients is rejected; a RESALE dish without `resale_item_id` is rejected.
3. Food-cost summary matches a hand-calculation for at least two seeded dishes.
4. A Sales Manager cannot `POST /dishes` (403) but can `GET /dishes` (200, read-only).

---

## Phase 3 — Orders / Counter

**Suggested model + effort:** `claude-sonnet-4-6 | default effort`

**Goal.** Draft order lifecycle (no billing yet), `order_items` with qty + instructions, hall vs parcel logic, KOT print (does NOT lock), optimistic locking, the counter UI.

**Pre-conditions.** Phase 2 passing. Dishes + items present. Auth + RBAC enforced.

### Tasks
1. **`orders` module:**
   - `POST /orders` — body: `{ category, table_number? }`; halls require table 1–20, parcel forbids it; generates `order_number`:
     - Halls: `${prefix}${table}-${YYYYMMDD}-${HHMM}` where prefix = `G`|`F`.
     - Parcel: `P-` + zero-padded `nextval('parcel_serial_seq')`.
   - `GET /orders` — filter by status, category, table, date range, created_by.
   - `GET /orders/:id` — includes items + audit trail.
   - `PATCH /orders/:id` — only when `status='DRAFT'`; carries `version` for optimistic locking; updates `order_items` (add/remove/update qty/instructions).
   - `POST /orders/:id/kot` — does **not** change status; records an audit event `KOT`; renders + dispatches a KOT receipt (kitchen-only fields: dish, qty, special instructions — no prices).
2. **Optimistic locking middleware:**
   - Service layer reads order, asserts `request.version === db.version`, increments on update. On mismatch return `409 { code: 'ORDER_VERSION_CONFLICT' }`.
3. **Counter UI (`frontend/src/features/counter/`):**
   - Category segmented control (Gents / Family / Parcel).
   - Table grid 1–20 for halls (with table-status hint: any active draft today → ●); parcel skips grid.
   - Order workspace: today's active orders for the table + "New order" button.
   - Two-pane on desktop: tables + menu on the left, cart on the right.
   - Phone: single column with slide-up cart sheet.
   - Menu list with category filter + search; dish add → opens qty + special-instructions sheet; low-stock dishes show ⚠ but remain addable; sold-out dishes are dimmed and not addable.
   - "Print KOT" button (always available in DRAFT); "Proceed to Bill" button (Phase 4 stub).
   - TanStack Query mutations with optimistic UI; on `ORDER_VERSION_CONFLICT` show "Order changed — reload".
4. **`orders` UI screen** (`features/orders/`) — filterable list, status badges (Draft / Printed / Delivered / Completed / Cancelled). Pending is derived (Printed/Delivered & not Completed & not Cancelled).

### Prototype references
- `screens/counter.jsx` — full two-pane counter layout, table grid, cart + menu interactions.
- `screens/orderdetail.jsx` — read-only order detail (used here for the DRAFT detail view).
- `screens/orders.jsx` — orders list with status badges.
- `app.jsx` lines 36–40 — role-access matrix mirrors RBAC.
- `shell.jsx` `NAV` config — left sidebar groups + role filters.
- `ui.jsx` — `Btn`, `Badge`, `StatusBadge`, `Stepper`, `Panel`, `Modal` patterns to mirror in Tailwind/TypeScript.

### Acceptance criteria — Phase 3
1. Creating a hall order populates `order_number` as `F12-20260530-1930`-style; creating a parcel order pulls the next serial from `parcel_serial_seq` (and it is contiguous across orders).
2. Editing a DRAFT with a stale `version` returns 409 with `ORDER_VERSION_CONFLICT`; a correct version succeeds and increments `version`.
3. `POST /orders/:id/kot` does NOT change `status` (still DRAFT) and writes a `KOT` audit event.
4. An Inventory Manager calling `POST /orders` returns 403.

---

## Phase 4 — Billing (the critical phase)

**Suggested model + effort:** `claude-opus-4-7 | --high effort`

**Goal.** Implement the atomic bill-print transaction, payment settlement, order completion, Super-Admin cancellation with restock prompt, and the print dispatch pipeline (network thermal direct + USB/A4 via print-agent).

**Pre-conditions.** Phase 3 passing. Charges + payment methods + charge_rates seeded. Settings.printer_config set during first-run.

### Tasks

#### 4.1 Charges + rates surface
- `GET/POST/PATCH /charges` — Super Admin only.
- `GET/POST/PATCH /charge-rates` — Super Admin only; enforce `(charge_id, payment_method_id)` unique with `payment_method_id NULL` allowed as the default rate.
- `GET/POST/PATCH /payment-methods` — Super Admin only.

#### 4.2 `ChargeResolutionService`
For inputs `(orderCategory, paymentMethodId)`:
1. Collect active `Charge` rows where `applies_to_categories` contains `orderCategory`.
2. For each, pick the rate: first try a `ChargeRate` with `payment_method_id = paymentMethodId`; else the row with `payment_method_id = NULL`; else `0`.
3. Return ordered `{ chargeId, name, rate_percent }[]` sorted by `Charge.sort_order`.

#### 4.3 The bill-print atomic transaction — `POST /orders/:id/print`

Exactly mirrors `04-App-Flow.md §5`. Inside ONE `prisma.$transaction` (serializable):

1. **Re-check** — load the order; assert `status === 'DRAFT'` AND `version === request.version`. Otherwise throw `ORDER_NOT_DRAFT` or `ORDER_VERSION_CONFLICT` (`409`).
2. **Lock** — set `status = 'PRINTED'`, `printed_at = now`, `version += 1`. From here the order is read-only everywhere.
3. **Freeze line snapshots** — for each `OrderItem`: write `dish_name_snapshot = dish.name`, `unit_price_snapshot = dish.selling_price`, `line_total_snapshot = qty * snapshot_price`.
4. **Compute subtotal** — `Σ line_total_snapshot`.
5. **Apply discount** — if the request includes a discount and the caller is `SUPER_ADMIN`, set `bills.discount` + `discount_by`; else discount = 0. Compute `subtotal_after_discount`.
6. **Build per-method options + grouping:**
   1. List all active `PaymentMethod` rows.
   2. For each method, resolve the full charge set via `ChargeResolutionService(order.category, method.id)`.
   3. Hash each method's resolved profile (sorted `[chargeId, rate_percent]` pairs). Methods sharing the same hash are grouped into one `BillPaymentOption` (label e.g. "Card / Digital" if all three card-like methods match).
   4. For each group, create one `BillPaymentOption` row with `member_method_ids = [...]`, then one `BillOptionChargeLine` per charge with `rate_percent`, `amount = round(subtotal_after_discount * rate / 100, 2)`, `charge_name_snapshot`. Compute `charges_total = Σ amounts` and `grand_total = subtotal − discount + charges_total`.
7. **Create the `Bill` row** with `order_id`, `bill_number = order.order_number`, `subtotal`, `discount`, `discount_by`, `printed_at`, `printed_by = caller`, `reprint_count = 0`, `settled = false`. Method-independent charges (e.g. service charge) appear identically in every option; method-dependent ones (e.g. GST) differ across options.
8. **Stock deduction** — for each `OrderItem`:
   - If `dish.type === RESALE`: write one `StockMovement(SALE_DEDUCTION)` with `item_id = dish.resale_item_id`, `quantity_delta = -qty`, `ref_type='ORDER'`, `ref_id = order.id`; decrement `Item.qty_on_hand`.
   - If `dish.type === RECIPE`: for each `DishIngredient`, convert `ingredient.quantity * order_qty` from `ingredient.unit_id` to the item's `stock_unit_id` via `UnitConversionService`; write one `StockMovement(SALE_DEDUCTION)` and decrement `Item.qty_on_hand` accordingly.
9. **Audit / outbox** — write `AuditEvent(PRINT, before={status:DRAFT}, after={status:PRINTED, bill_id, totals_by_option})`.
10. **COMMIT.**

**Only after commit:** call `PrintingService.dispatchBill(billId)` to render (ESC/POS or PDF, EN/UR direction-aware) and send. If printing fails: return success on the bill (it exists, reprintable) with a `print_status: 'FAILED'` field so the UI can show "print failed — retry".

`POST /orders/:id/reprint` — increments `bills.reprint_count`, writes `REPRINT` audit, dispatches; never re-deducts stock.

#### 4.4 Payment settlement — `POST /orders/:id/payment`
- Body: `{ payment_method_id, amount_paid }`. Bill must exist and not yet be settled.
- Look up the `BillPaymentOption` whose `member_method_ids` array contains `payment_method_id`. That row's `charges_total` and `grand_total` ARE the settled amounts.
- Update `Bill`: `settled = true`, `settled_payment_method_id`, `settled_total = grand_total`, `amount_paid`, `change_given = max(0, amount_paid - grand_total)`, `settled_at = now`, `settled_by = caller`.
- If `Order.status === 'DELIVERED'` (or per business choice — see App Flow §10), also set `status = 'COMPLETED'`, `completed_at = now`.
- Audit `PAYMENT`.

#### 4.5 Delivery + completion endpoints
- `POST /orders/:id/deliver` — sets `status = 'DELIVERED'`, `delivered_at`, audits `DELIVER`.
- `POST /orders/:id/complete` — alternative explicit completion (after payment if not auto-completed).

#### 4.6 Cancellation + restock — `POST /orders/:id/cancel`
Super Admin only. Body: `{ restock: boolean }`. Inside one transaction:
1. Verify caller is `SUPER_ADMIN` (Guard) — else 403.
2. Load order; if already `CANCELLED` → 409.
3. Set `status='CANCELLED'`, `cancelled_at`, `cancelled_by`, `cancel_restocked = restock`.
4. If the order had previously been `PRINTED` (i.e. `Bill` exists) AND `restock === true`:
   - For every `StockMovement(SALE_DEDUCTION)` with `ref_type='ORDER'` and `ref_id = order.id`, write a balancing `StockMovement(CANCEL_RESTOCK)` with `quantity_delta = -original_delta` (so on-hand goes back up); update `Item.qty_on_hand` accordingly.
5. Audit `CANCEL` with `before/after = { status, cancel_restocked }`.
6. COMMIT.

#### 4.7 Linked orders after lock
After a `Bill` exists, any "add items" action from the UI creates a **new DRAFT order** with `linked_parent_order_id = original.id` (and a new order_number / timestamp). The locked order is never reopened.

#### 4.8 Printing pipeline (`printing` module)
1. **Renderer:**
   - **Thermal (ESC/POS)** — use `node-thermal-printer` or equivalent. Render KOT (kitchen) and Bill (customer) templates from a shared layout. Bill must show the full per-option charge breakdown + grand total. Honor active language / RTL (for Urdu, line text mirrored where appropriate).
   - **A4 (PDF)** — server-rendered with a headless library (e.g. `pdfkit` or HTML→PDF). Same content vocabulary.
2. **Dispatch:**
   - **Network thermal** — backend opens a TCP socket to `printer_config.ip:port` and writes ESC/POS bytes.
   - **USB thermal or A4-to-local** — backend POSTs `{ jobType, payload }` to `PRINT_AGENT_URL`. The agent (in `print-agent/`, scaffold only in this phase — minimal Node/Electron HTTP listener that forwards to the OS printer / USB device) returns success/failure.
3. **Reliability:** dispatch happens **after** the transaction commits. On failure, `bills.reprint_count` stays 0; reprint is available; UI shows "print failed — retry".

#### 4.9 Billing UI
- Bill modal (UI prototype `screens/orderlogic.jsx` for the calc + layout, design doc §S5 for fields):
  - Itemized order + subtotal.
  - Discount field — visible/enabled only when caller role is `SUPER_ADMIN` (frontend hides; backend re-checks).
  - Service charge row — hidden / 0 for Parcel.
  - **Per-payment-option breakdown table** with each option (e.g. Cash vs Card/Digital), its charge lines, and its grand total — this is the transparent printed bill the customer reads.
  - Payment method selector + amount paid (settle now or after delivery).
  - "Confirm & Print" → calls `POST /orders/:id/print`; "Cancel" closes.
- Bill / KOT preview screen (read-only post-print) with reprint button.
- Order detail screen exposes "Cancel order" only for Super Admin → opens the restock-prompt confirmation dialog (UI doc §S8).

### Prototype references
- `screens/orderlogic.jsx` — bill computation + per-method options breakdown (matches the printed bill).
- `screens/orderdetail.jsx` — printed/locked order view + reprint + cancel button.
- UI doc §S5 (Billing & payment), §S6 (Bill / KOT preview), §S8 (Order detail + cancellation).
- `store.jsx` `calcBill()` — reference for charge resolution + total math (note: target Postgres-based resolution is authoritative).

### Acceptance criteria — Phase 4

1. **Atomicity:** force a failure midway through the bill-print transaction (e.g. throw inside the stock-deduction loop) — no order status change, no `Bill`, no `BillPaymentOption`, no `BillOptionChargeLine`, no `StockMovement` rows, no audit event. Re-attempt succeeds.
2. **Grouping:** with GST rates Cash=16%, Card=Bank=Easypaisa=5% (default), the bill produces exactly two `BillPaymentOption` rows — one for `[Cash]`, one for `[Card, Bank, Easypaisa]` — each with consistent charge lines and grand totals.
3. **Snapshots are immutable:** after print, changing `dish.selling_price` does not alter `order_items.unit_price_snapshot`; viewing the bill later still shows the price at print.
4. **Stock deduction matches recipe:** for a RECIPE dish with `chicken 0.9 kg`, `oil 120 ml`, ordering qty 2 deducts exactly `1.8 kg` chicken and `0.24 l` oil (correct unit conversions) and writes one `StockMovement(SALE_DEDUCTION)` per ingredient with `ref_id = order.id`.
5. **Cancel + restock** reverses every `SALE_DEDUCTION` exactly when `restock=true`; with `restock=false`, on-hand is unchanged. Both write `CANCEL` audit; the cancelled record is still visible.
6. **Payment settlement** correctly picks the `BillPaymentOption` matching the chosen method, sets `settled_total = grand_total`, and computes `change_given` for cash.
7. **RBAC:** a Sales Manager calling `POST /orders/:id/cancel` returns 403; the denial is audited. Discount field is rejected when supplied by a non-admin.
8. **Print failure recoverable:** mocking a printer-unreachable error after commit still returns success on the bill; reprint succeeds when the printer is restored, incrementing `reprint_count` and writing `REPRINT` audit.

---

## Phase 5 — Stock ops

**Suggested model + effort:** `claude-sonnet-4-6 | default effort`

**Goal.** Physical count + adjustments, stock returns to vendor, vendor payments + dues, variance/waste reporting data.

**Pre-conditions.** Phase 4 passing.

### Tasks
1. `POST /stock/counts` — body: `{ note?, lines: [{ item_id, counted_qty, reason? }] }`. In one transaction:
   - For each line: compute `system_qty = Item.qty_on_hand` at the moment, `variance = counted_qty - system_qty`.
   - If `variance !== 0`: write `StockCountLine` + `StockMovement(ADJUSTMENT, quantity_delta=variance, reason)`; update `Item.qty_on_hand = counted_qty`.
   - Audit `ADJUSTMENT` per line.
2. `GET /stock/variance` — aggregate report data: per item, sum of |variance| over period.
3. `POST /stock/returns` — body: `{ vendor_id?, item_id, quantity, unit_id, reason, return_date }`. Atomic: write `StockReturn`, convert qty to stock unit, write `StockMovement(RETURN, quantity_delta=-converted_qty)`, decrement `Item.qty_on_hand`. Audit `RETURN`.
4. `POST /vendor-payments` — record payment against a vendor; update dues view. Audit `VENDOR_PAYMENT`.
5. Frontend screens:
   - Stock count (per-item theoretical vs counted vs variance with reason).
   - Stock return form.
   - Vendor payments + dues panel.

### Prototype references
- `screens/stockcount.jsx` — per-item count form with variance + reason.
- `screens/vendors.jsx` — vendor list with dues and payment action.

### Acceptance criteria — Phase 5
1. A stock count with two lines (one zero variance, one negative variance) writes exactly one `StockMovement(ADJUSTMENT)` and updates only the affected item; on-hand equals counted_qty for the adjusted item.
2. A stock return reduces on-hand by the converted quantity and writes one `RETURN` movement.
3. Vendor dues = Σ purchases.total_value − Σ vendor_payments.amount (returns credit if you choose to subtract it).

---

## Phase 6 — Insight

**Suggested model + effort:** `claude-sonnet-4-6 | default effort`

**Goal.** Reports, audit viewer, role dashboards. All figures from stored snapshots — never recompute from current prices.

**Pre-conditions.** Phase 5 passing. Order, bill, and movement history sufficient to test.

### Tasks
1. **`reports` module** (Super Admin full; Inventory Mgr consumption only; Sales Mgr today's sales only):
   - `GET /reports/sales` — by day, by category, by table, by created_by; uses `bills.settled_total`.
   - `GET /reports/consumption` — sums `StockMovement(SALE_DEDUCTION)` per item over a range.
   - `GET /reports/variance` — sums `StockMovement(ADJUSTMENT)` per item.
   - `GET /reports/low-stock` — current items at/below reorder.
   - `GET /reports/vendor-purchases-dues`.
   - `GET /reports/pending` — orders in PRINTED/DELIVERED not yet COMPLETED.
   - `GET /reports/cancelled` — orders in CANCELLED.
   - `GET /reports/margins` — per dish, using `dish.selling_price` vs current weighted-average cost (or snapshot avg at print if richer history is desired).
2. **`audit` module** — `GET /audit` paginated, filterable by `entity_type`, `entity_id`, `actor_id`, action, date; Super Admin only. Read-only.
3. **Dashboards** (frontend) per role per UI doc §S2:
   - Super Admin: today's sales total, category breakdown, pending/cancelled counts, low-stock count, vendor dues, mini trend chart.
   - Inventory Mgr: low-stock alerts, items below reorder, recent receipts, consumption snapshot.
   - Sales Mgr: today's sales, active tables/orders, big "New order" button.
4. Optional: materialized views for the heaviest aggregates (daily sales).

### Prototype references
- `screens/dashboard.jsx` — role-specific dashboard layouts.
- `screens/reports.jsx` — report hub with date range + export buttons.
- `screens/admin.jsx` — audit log filterable stream.

### Acceptance criteria — Phase 6
1. Sales report numbers match the sum of `bills.settled_total` for the selected range, broken down by category.
2. Consumption report for a known order matches the deductions written in Phase 4 acceptance #4.
3. Inventory Mgr `GET /reports/sales` returns 403; `GET /reports/consumption` returns 200.
4. Audit viewer renders a `before`/`after` JSONB expansion for an order cancel event.

---

## Phase 7 — Polish

**Suggested model + effort:** `claude-sonnet-4-6 | default effort`

**Goal.** Backups (schedule + manual + retention + restore runbook), full EN/UR with RTL, responsive desktop/mobile pass, settings panels.

**Pre-conditions.** Phase 6 passing.

### Tasks
1. **`backups` module:**
   - Scheduled job (in backend cron or the `backup` Compose service) reads `Settings.backup_cron`, runs `pg_dump > ${BACKUP_DIR}/kbbq-${stamp}.dump`, writes a `Backup(SCHEDULED, ...)` row.
   - `POST /settings/backup-now` — Super Admin only; runs `pg_dump` immediately, writes `Backup(MANUAL, ..., triggered_by=user)`. Audit `SETTINGS_CHANGE` or a dedicated entry.
   - `PATCH /settings/backup-schedule` — updates `backup_cron` + `backup_retention`; cron job re-reads on next tick.
   - Retention: after each successful backup, list dump files, sort by mtime desc, delete beyond `backup_retention`.
2. **Restore runbook** in `docs/runbook.md` (create the dir): step-by-step `pg_restore` / `psql` against the volume; verify post-restore that `Settings` singleton and at least one Super Admin exist.
3. **EN/UR + RTL pass:**
   - Move every visible string in the frontend to translation bundles (`en.json`, `ur.json`).
   - Add Urdu translations (proper Urdu, not transliteration).
   - At root: `<html dir={lang === 'ur' ? 'rtl' : 'ltr'} lang={lang}>`; use Tailwind logical properties (`ms-`/`me-` rather than `ml-`/`mr-`); icons that imply direction (arrows) flipped via the RTL plugin or per-icon.
   - Format numbers, dates, and PKR via `Intl.NumberFormat` / `Intl.DateTimeFormat` keyed off the active locale.
   - Printed bill/KOT respects active language + direction.
4. **Responsive pass:**
   - Sidebar → bottom tab bar + hamburger under `< md`.
   - Counter two-pane → single column + slide-up cart (UI doc §4 Counter / Mobile diagram).
   - Tables: full columns on desktop; priority columns + expandable rows on phone.
   - 44px minimum tap targets on counter actions.
5. **Settings panels** (UI doc §S20): Charges, Payment methods, Backup, Restaurant identity, Printer setup, Localization, Users link.

### Prototype references
- `screens/admin.jsx` — settings layout (charges + payment methods + identity + printer + backup).
- `screens/dashboard.jsx` mobile breakpoints for responsive cues.
- `app.jsx` topbar `lang-toggle` pattern.

### Acceptance criteria — Phase 7
1. Setting `backup_cron` to a short interval (e.g. `*/5 * * * *`) produces backup files in `${BACKUP_DIR}` with `Backup` rows; old files beyond retention are pruned.
2. `POST /settings/backup-now` produces an immediate `MANUAL` dump and an audit entry.
3. Switching language to `ur` flips the layout to RTL across every screen, and a printed bill comes out with Urdu strings in correct direction.
4. The counter is usable end-to-end on a 375px-wide viewport (create draft → add items → KOT → bill modal opens) with no overflow / horizontal scroll.

---

## Phase 8 — Hardening

**Suggested model + effort:** `claude-opus-4-7 | --high effort`

**Goal.** Test suites, security pass, performance, runbook, deployment docs.

**Pre-conditions.** Phase 7 passing.

### Tasks
1. **Unit tests:**
   - `UnitConversionService` — within-family conversions, cross-family rejection.
   - `CostingService` — weighted-average formula edge cases (zero on-hand, equal cost, integer rounding).
   - `ChargeResolutionService` — method-specific vs default fallback; category filter.
   - Grouping logic — distinct profiles produce distinct `BillPaymentOption` rows; identical profiles collapse.
2. **Integration tests (the critical phase):**
   - Bill print transaction — atomicity (success + induced failure), correct snapshots, correct stock deduction (RECIPE + RESALE), audit row written.
   - Cancellation + restock — both branches; idempotency (second cancel attempt 409).
   - Stock receipt — `qty_on_hand` and `avg_cost` updated together; rollback on failure.
   - Physical count adjustment — variance + movement + cache.
   - Payment settlement picks the correct option.
3. **RBAC tests** — for every Super-Admin-only route, assert 403 for Inventory Mgr + Sales Mgr; for every Sales Mgr route, assert 403 for Inventory Mgr; cross-check the matrix end-to-end.
4. **E2E (Playwright):**
   - Counter happy path: login (PIN) → new order → add items → KOT → confirm bill → record cash payment → mark delivered → completed.
   - New linked order after lock → bills separately.
   - Same flow in Urdu (RTL).
5. **Security pass:**
   - Argon2 params reviewed (memory + iterations).
   - Refresh token rotation + revoke on logout.
   - Rate limiting on `/auth/login` and `/auth/pin-login` (e.g. nestjs-throttler).
   - CSRF token on cookie-auth mutating routes.
   - Helmet headers verified.
   - Input validation on every DTO; no `any`.
   - Secrets only via env; `.env*` in `.gitignore`.
6. **Performance:**
   - Counter actions ≤ 150ms p95 (local).
   - Bill-print transaction ≤ 500ms p95.
   - Add indexes where slow queries surface (orders by `(created_at)`, audit by `(entity_type, entity_id)`, items low-stock partial index already in place).
7. **Deployment runbook (`docs/runbook.md`):**
   - First install (Docker requirements, external drive mount for `BACKUP_DIR`).
   - Update / redeploy (`docker compose pull && up -d`).
   - Restore from backup.
   - Print-agent install on the host PC.
   - Owner-facing FAQ: how to reprint, how to cancel, how to back up now, language switch.

### Acceptance criteria — Phase 8
1. Test suite green: unit + integration + RBAC + E2E happy paths.
2. Every PRD §6 invariant has at least one test enforcing it (no hard delete, lock on print, snapshot stability, GST per method, service-charge skip for parcel, admin-only cancel + discount, stock deducts at print, attribution / audit, sold-out blocks).
3. Security review checklist (CLAUDE.md §3 + TRD §14) all checked.
4. Runbook walks a fresh PC from `docker compose up -d` through first-run wizard to a recorded bill in under 30 minutes.

---

## Cross-phase reminders

- **Migrations:** every schema change is a new Prisma migration. Never edit a committed migration.
- **Audit on every mutation.** If a service writes data and forgets to audit, that's a phase regression.
- **Optimistic locking:** clients always send `version` on order/item/dish/bill PATCH/print/cancel; server returns 409 on mismatch.
- **No hard delete.** If a delete feels right, it isn't — soft-delete or status change.
- **EN/UR from day one** of any UI work — strings go through bundles immediately, not "added later".
- **Confirm with the user** before irreversible / shared-state actions (db wipes, force pushes, backup deletions). Local edits, migrations against the dev DB, and tests are fine to run autonomously.
