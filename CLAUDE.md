# CLAUDE.md — Karachi B.B.Q POS

**Read this file first in every session.** It is the permanent memory for this project. Anything written here overrides defaults. The detailed phase-by-phase build guide lives in `./files/plan.md`; the six canonical specs live in `./files/01-PRD.md` → `./files/06-Implementation.md`.

---

## 1. Project

**Name:** Karachi B.B.Q POS
**Purpose:** Restaurant Inventory & Sales Management System for one restaurant on one PC, offline-first.

**Overview.** A web POS for a single-location Pakistani BBQ restaurant. It manages two connected domains: (1) inventory — raw stock, vendors, recipes, weighted-average costing, physical counts; (2) sales — orders across Gents Hall, Family Hall, and Parcel, with KOT print, bill print that locks the order and deducts stock, and payment settlement with per-method GST/charges. Three roles (Super Admin, Inventory Manager, Sales Manager) with strict RBAC. Bilingual EN/UR with RTL. PKR. Runs fully offline on one PC via Docker Compose, with a schema and event log already structured so v2 sync and an owner mobile view can be added without rework.

---

## 2. Monorepo structure

Implements the layout in `06-Implementation.md §2`.

```
KARACHI_BBQ/
├─ infra/                    # docker-compose.yml, nginx config, .env.example
├─ backend/                  # NestJS API
│  ├─ src/
│  │  ├─ modules/            # one folder per domain (auth, users, settings,
│  │  │                      # inventory, costing, menu, vendors, stock,
│  │  │                      # orders, billing, printing, reports, audit, backups)
│  │  ├─ common/             # RBAC guard, audit interceptor, tx helper,
│  │  │                      # validation pipe, error filter
│  │  └─ main.ts
│  └─ prisma/                # schema.prisma, migrations/, seed.ts
├─ frontend/                 # React + Vite + TypeScript SPA
│  ├─ src/
│  │  ├─ features/           # mirrors screens: counter, orders, menu,
│  │  │                      # inventory, vendors, stock, reports, audit,
│  │  │                      # users, settings
│  │  ├─ components/         # shared UI kit
│  │  ├─ lib/                # api client, hooks, formatters
│  │  ├─ i18n/               # en, ur translation bundles
│  │  └─ main.tsx
├─ print-agent/              # small host helper for USB / OS printing
├─ files/                    # planning docs + plan.md (the build guide)
└─ karachi-b-b-q/project/    # reference UI prototype (vanilla React via CDN)
```

> Prisma lives **inside** `backend/` per Implementation doc; the schema, migrations, and `seed.ts` are all there. There is no top-level `prisma/` folder.

---

## 3. Tech stack (target versions)

| Layer | Choice | Notes |
|---|---|---|
| Runtime | **Node 20 LTS** | Backend + print-agent |
| Backend framework | **NestJS** (latest stable) | Guards + Interceptors map cleanly to RBAC + audit |
| ORM | **Prisma** (latest stable) | Type-safe, migrations, seed |
| Database | **PostgreSQL 16** | UUID v7, JSONB, named volume `pgdata` |
| Auth | JWT (access + refresh) in httpOnly+SameSite cookies | Argon2 password + PIN hashing |
| Validation | `class-validator` + DTOs | Every endpoint |
| Frontend framework | **React 18 + Vite + TypeScript** | Vite build, NOT Next.js |
| Styling | **Tailwind CSS** with logical properties + RTL plugin | First-class Urdu RTL |
| Server state | **TanStack Query** | Counter snappiness, optimistic UI |
| Router | **React Router** | |
| i18n | **react-i18next** | `en` + `ur` bundles, `dir="rtl"` for Urdu |
| Component primitives | Headless kit (e.g. shadcn/ui or Mantine) | Accessible inputs/tables/dialogs |
| Reverse proxy | **nginx** | Serves static frontend; reverse-proxies `/api` to backend (single origin → no CORS) |
| Orchestration | **Docker Compose** | One command brings everything up |
| Printing | ESC/POS for thermal (58/80 mm), server-rendered PDF for A4 | Network thermal direct from backend; USB/A4 via print-agent |
| Backups | `pg_dump` to a mounted volume | Nightly default + on-demand "Backup now"; admin-configurable schedule |

`PRINT_MODE`, `PRINTER_IP/PORT`, `PRINT_AGENT_URL`, `DEFAULT_LANGUAGE`, `DEFAULT_CURRENCY=PKR`, `BACKUP_DIR`, `TZ`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` are env-time only. Runtime-configurable values (charges, payment methods, identity, printer choice, backup schedule) live in the DB.

---

## 4. The 9 business-rule invariants — **never break these**

From `01-PRD.md §6`. Any code that violates one of these is wrong, regardless of how convenient it would be.

1. **No hard deletes — ever.** Every entity uses soft-delete (`deleted_at`) or status change. The app never issues hard `DELETE`. Records are retained for audit.
2. **Lock on bill print.** Once a bill is printed, the order is immutable. Further items become a **new linked order** (`linked_parent_order_id`), never a reopen.
3. **Snapshot pricing at print.** Order lines freeze `dish_name_snapshot`, `unit_price_snapshot`, `line_total_snapshot`, subtotal, discount, and method-independent charges at bill print. Later menu/price changes never alter historical records.
4. **GST + charges per payment method.** Charges are admin-defined; rates can be method-specific (e.g. GST 16% on Cash, 5% on Card). The bill freezes a **per-distinct-profile** `bill_payment_options` row + itemized `bill_option_charge_lines` at print so the printed bill shows transparent per-method totals.
5. **Service charge dropped for Parcel.** GST applies to all categories (Gents, Family, Parcel); service charge applies only to Gents + Family. Enforced via `charges.applies_to_categories`.
6. **Admin-only cancel, with restock prompt.** Only `SUPER_ADMIN` may cancel an order. Cancelling a printed order forces a yes/no restock decision (`cancel_restocked`). Cancelled records remain visible.
7. **Admin-only discounts.** Only `SUPER_ADMIN` may apply a discount. Sales Managers never see the field.
8. **Stock deducts on bill print** (not earlier). One transaction writes `SALE_DEDUCTION` movements for every line; recipe ingredients are unit-converted to the item's stock unit; resale dishes deduct one unit of the linked item.
9. **Everything is attributed.** Every create/edit/print/KOT/reprint/cancel/payment/receipt/adjustment/return/settings/auth event is written to the immutable `audit_events` log with actor, timestamp, before, after.

Bonus: **availability never hard-blocks ordering.** Low stock warns; only a manual "sold out" toggle (`dishes.available=false`) prevents selling a dish. Optimistic locking via `version` on orders/items/dishes/bills returns "order changed, reload" on conflict.

---

## 5. RBAC matrix (summary)

Three roles. Multiple users per role. Enforced server-side on every route via NestJS Guards; UI mirrors the same rules.

| Capability | Super Admin | Inventory Mgr | Sales Mgr |
|---|:---:|:---:|:---:|
| Manage users & roles | ✅ | — | — |
| System settings (identity, language, tax/service %, printer, backup) | ✅ | — | — |
| Inventory items + categories | ✅ | ✅ | — |
| Set reorder/alert levels | ✅ | ✅ | — |
| Recipes / dishes (incl. selling price) | ✅ | ✅ | — |
| Toggle dish availability | ✅ | ✅ | — |
| Vendors, stock receipts, payments, returns | ✅ | ✅ | — |
| Physical stock count & adjustments | ✅ | ✅ | — |
| View menu | ✅ | ✅ | ✅ (read-only) |
| Create / edit orders (Draft only) | ✅ | — | ✅ |
| Print KOT | ✅ | — | ✅ |
| Print / reprint bill | ✅ | — | ✅ (logged) |
| Record payment | ✅ | — | ✅ |
| **Apply discount** | ✅ | — | — |
| **Cancel an order** | ✅ | — | — |
| Reports (full) | ✅ | consumption only | today's sales only |
| Audit log | ✅ | — | — |

Deny-by-default at the API. Sensitive routes (cancel, discount, users, settings) are Super-Admin-only and log the denial.

---

## 6. Billing model (one paragraph)

Charges are admin-defined and may vary by payment method. A `charges` row defines the rule (GST, Service Charge…), its base (`SUBTOTAL_AFTER_DISCOUNT`), and the order categories it applies to. `charge_rates` rows set the percentage **per payment method**, with a special `payment_method_id = NULL` row acting as the default for all methods; resolution prefers method-specific over default. When the bill is printed, the **method-independent parts freeze** on `bills` (line snapshots, subtotal, discount, method-independent charges like service charge); the system also computes one `bill_payment_options` row **per distinct charge profile** (payment methods that resolve to identical rates are grouped, e.g. "Card / Digital") with full `bill_option_charge_lines` breakdown — that is what the printed bill shows so the customer sees the exact grand total for each way they could pay. **GST and the grand total settle later** when payment is recorded: the chosen method's option becomes the bill's settled figures (`settled_payment_method_id`, `settled_total`, `amount_paid`, `change_given`), and only then can the order be marked COMPLETED.

---

## 7. Key schema primitives

From `05-Backend-Schema.md`. These are the foundations that make the invariants work.

- **`id uuid` PKs everywhere, generated as UUID v7** (time-ordered, sync-safe; never auto-increment).
- **Common audit columns** on every non-append-only table: `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at` (soft delete), `version` (optimistic lock counter).
- **Append-only tables** (immutable once written, no `updated_at`/`deleted_at`/`version`): `stock_movements`, `audit_events`, `bill_payment_options`, `bill_option_charge_lines`, `backups`.
- **`audit_events`** doubles as the audit log **and** the v2 sync outbox. It carries `seq bigserial` for monotonic replay and `synced_at` (unused in v1; the hook for v2). Every meaningful action writes a row; the app never updates or deletes one.
- **`stock_movements`** is the canonical ledger; `items.qty_on_hand` is a denormalized cache maintained in the same transaction as the movement.
- **Parcel serial** is a dedicated PostgreSQL sequence (`parcel_serial_seq`) so numbering is continuous (never resets) per PRD §10.2.
- **Bill 1:1 with locked order** via `bills.order_id` unique.

---

## 8. Phase summary

Full per-phase task list lives in `./files/plan.md`. Acceptance criteria gate each phase — don't start phase N+1 until phase N's tests pass.

| Phase | Deliverable (one line) |
|---|---|
| **0 — Foundation** | Monorepo, Docker Compose (nginx + backend + db + backup), full Prisma schema + migrations + seed, auth + RBAC + audit interceptor + tx helper, settings singleton, first-run setup wizard. |
| **1 — Inventory core** | Units (with `factor_to_base`), item categories, items (`qty_on_hand` cache), vendors, purchases/GRN with weighted-average cost recompute, `stock_movements` ledger, low-stock alerts. |
| **2 — Menu** | Menu categories, dishes (`RECIPE` + `RESALE`), `dish_ingredients` with unit-family validation, availability toggle, live food-cost / margin readout. |
| **3 — Orders / Counter** | Draft order CRUD, `order_items` with quantity + special instructions, hall/parcel logic + table grids, KOT print (does NOT lock), optimistic locking, the two-pane Counter UI. |
| **4 — Billing** | `charges` + `charge_rates` + `payment_methods`, the atomic bill-print transaction (lock + snapshot + grouped per-profile options + stock deduction + audit), payment settlement, COMPLETED, cancellation with restock prompt, printing dispatch (network thermal direct, USB/A4 via print-agent). |
| **5 — Stock ops** | Physical count + adjustment with reason → variance, stock returns to vendor, vendor payments + dues, variance/waste report data. |
| **6 — Insight** | Sales / consumption / variance / margins / dues / pending / cancelled reports, audit viewer (Super Admin), role-specific dashboards. |
| **7 — Polish** | Backup schedule + manual + retention + restore runbook, full EN/UR with RTL pass, responsive desktop/mobile pass, settings panels. |
| **8 — Hardening** | Test suites (unit + integration + RBAC + E2E counter happy path), security pass, performance, deployment runbook. |

---

## 9. Prototype notes

`./karachi-b-b-q/project/` contains a working **UI prototype** built with vanilla React (loaded via `<script>` tags) and a localStorage in-memory store. It is **reference material only** — use it for:

- Screen layouts (sidebar nav, two-pane counter, billing modal, status badges, table grids 1–20).
- Component patterns (`Btn`, `Badge`, `StatusBadge`, `Stat`, `Panel`, `Modal`, `Confirm`, `Stepper`, `Seg`, `Tabs` in `ui.jsx`).
- Data shapes (the seed in `data.js` mirrors the target schema closely — users, units, items, dishes with `RECIPE`/`RESALE`, charges, charge rates, orders with snapshots, audit events).
- Business logic sketches (`store.jsx`: `calcBill`, `dishConsumption`, `toStockUnits`, `lowStockItems`).
- Role-filtered nav (`shell.jsx` `NAV` config) and the role-switching topbar.
- Mock screens in `screens/` (counter, orderdetail, billing flow inside `orderlogic.jsx`, dashboard, inventory, menu, vendors, stockcount, reports, admin, users).

The target implementation is **NestJS + Prisma + PostgreSQL** backend with a **React + Vite + TypeScript + Tailwind** frontend — not the prototype's in-memory store, not vanilla CDN React, not `React.createElement` calls. Reuse the layout and component vocabulary; rebuild the logic on the real stack.

---

## 10. How to work in this repo

1. **Always read this file first.** Then read `./files/plan.md` for the current phase's task list. Then the relevant phase-specific planning doc section.
2. **Follow the active phase.** Don't jump ahead. A phase ships only when its acceptance criteria pass.
3. **Use the configured skills.** Check `.claude/settings.json` and `.claude/settings.local.json` for permissions and hooks. Don't bypass with `--no-verify`.
4. **Never hard-delete.** If you think you need to, the answer is soft-delete or status change.
5. **Migrations before seed.** `prisma migrate dev` (or `prisma migrate deploy` for non-dev) → then `prisma db seed`. Never edit a committed migration; create a new one.
6. **Atomic transactions for the critical flows.** Bill print, cancellation, stock receipt, stock count adjustment all run inside one transaction (use the `common/` tx helper). Printing happens only **after** commit; a printer failure must never corrupt data.
7. **Server-side enforcement is the rule.** UI hiding is UX, not security. Every protected route checks role via the Guard.
8. **Audit on every mutation.** The interceptor writes the row; explicit domain events fill in summaries / before-after JSONB for non-trivial actions.
9. **Match the prototype's UX vocabulary** unless the planning docs say otherwise (status badges, two-pane counter, modal-confirm for destructive actions).
10. **Bilingual from day one.** No hardcoded user-facing strings — everything goes through `react-i18next` bundles. RTL is via `dir="rtl"` + Tailwind logical properties.
11. **Ask the user before risky / irreversible actions** outside the editor (db wipes, force pushes, deleting branches, deleting backups).

---

## 11. Source-of-truth pointers

- Product behavior, rules, RBAC, scope → `./files/01-PRD.md`
- Stack, architecture, security, printing, sync-readiness → `./files/02-TRD.md`
- Screens, layouts, RTL, accessibility → `./files/03-UI-UX-Design.md`
- End-to-end flows + sequence diagrams (esp. §5 bill-print atomic tx) → `./files/04-App-Flow.md`
- Tables, columns, enums, indexes, invariants → `./files/05-Backend-Schema.md`
- Modules, services, phases, testing, deployment → `./files/06-Implementation.md`
- Per-phase task list + acceptance criteria → `./files/plan.md`
- Prototype UI patterns + seed data shapes → `./karachi-b-b-q/project/`

When the user's instruction conflicts with a planning doc, ask. When two planning docs conflict, the lower-numbered one wins (PRD > TRD > UI > Flow > Schema > Implementation), unless the user says otherwise.
