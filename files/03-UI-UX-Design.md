# UI/UX Design Document
### Restaurant Inventory & Sales Management System

| | |
|---|---|
| **Document** | UI/UX Design |
| **Version** | 1.0 (Draft for review) |
| **Status** | Pending sign-off |
| **Builds on** | 01-PRD.md, 02-TRD.md |
| **Scope** | v1 — responsive web (desktop + phone), English/Urdu (RTL) |
| **Last updated** | 30 May 2026 |

---

## 1. Design principles

1. **Speed at the counter.** Order-taking is time-sensitive. The path from "open table" to "printed bill" must be minimal taps with no page reloads and large touch targets.
2. **Role-appropriate minimalism.** Each role sees only the tools it can use. A Sales Manager never sees inventory screens; an Inventory Manager never sees order entry. The UI mirrors the RBAC matrix exactly.
3. **Make state obvious.** A *Draft* order looks clearly editable; a *Printed* order looks clearly locked (visibly read-only, greyed inputs, a lock badge). The user should never wonder whether they can still change something.
4. **Safe by default for irreversible-ish actions.** Printing a bill and cancelling an order both require explicit confirmation; cancellation (admin only) forces the restock decision.
5. **Forgiving warnings, not hard blocks.** Low stock warns but never prevents an order (stock is an estimate). Only a manual "sold out" toggle blocks a dish.
6. **Bilingual and bidirectional.** Every screen works identically in English (LTR) and Urdu (RTL), with locale-correct numbers, dates, and PKR formatting.

---

## 2. Information architecture & navigation

Navigation is a **left sidebar** on desktop (right sidebar in RTL) that collapses to a **bottom tab bar + hamburger** on mobile. Items are filtered by role.

### 2.1 Navigation per role
| Nav item | Super Admin | Inventory Mgr | Sales Mgr |
|---|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ |
| Orders (counter) | ✅ | — | ✅ |
| Menu (read-only view) | ✅ | ✅ | ✅ |
| Inventory items | ✅ | ✅ | — |
| Recipes / dishes | ✅ | ✅ | — |
| Vendors & purchases | ✅ | ✅ | — |
| Stock count | ✅ | ✅ | — |
| Reports & analytics | ✅ | consumption only | today's sales only |
| Audit log | ✅ | — | — |
| Users | ✅ | — | — |
| Settings | ✅ | — | — |

A persistent **top bar** holds: restaurant name/logo, the active user + role, a **language toggle (EN/اردو)**, and sign-out. An **offline-ready** indicator confirms the system is running locally.

---

## 3. Screen inventory

| # | Screen | Primary role(s) | Purpose |
|---|---|---|---|
| S1 | Login / PIN login | All | Authenticate |
| S2 | Dashboard | All (role-specific) | At-a-glance status + quick actions |
| S3 | Counter — hall/table picker | Sales, Admin | Choose category & table |
| S4 | Counter — order workspace | Sales, Admin | Build, edit, KOT, bill an order |
| S5 | Billing & payment | Sales, Admin | Totals, discount (admin), payment, print |
| S6 | Bill / KOT preview | Sales, Admin | Printable receipt preview |
| S7 | Orders list | Sales, Admin | Active + historical orders, statuses |
| S8 | Order detail (incl. cancel) | Admin (cancel), Sales (view) | Review, cancel+restock (admin) |
| S9 | Inventory items list | Inventory, Admin | Items, stock, costs, low-stock flags |
| S10 | Item editor | Inventory, Admin | Create/edit item, unit, reorder level |
| S11 | Categories | Inventory, Admin | Manage item + menu categories |
| S12 | Dishes / recipe editor | Inventory, Admin | Recipe vs resale dish, ingredients, price |
| S13 | Vendors | Inventory, Admin | Vendor records + dues |
| S14 | Stock receipt (GRN) | Inventory, Admin | Receive purchased stock |
| S15 | Stock return | Inventory, Admin | Return stock to vendor |
| S16 | Stock count / adjustment | Inventory, Admin | Physical count, variance |
| S17 | Reports & analytics | Admin (full) | Sales, consumption, variance, margins, dues |
| S18 | Audit log | Admin | Immutable activity history |
| S19 | Users | Admin | Manage accounts, PINs, roles |
| S20 | Settings | Admin | Tax/service, backup, identity, printer, language |

---

## 4. Key screen layouts

### S1 — Login / PIN login
Two tabs: **Password** (username + password, all roles) and **PIN** (numeric keypad, for Sales Managers with a PIN enabled). Large keypad for fast counter sign-in. Language toggle present pre-login.

### S2 — Dashboard (role-specific)
- **Super Admin:** cards for today's sales total, sales by category (Gents / Family / Parcel), pending orders count, cancelled orders count, low-stock count, vendor dues; a small sales trend chart; quick links to reports and audit.
- **Inventory Manager:** low-stock alerts list, items below reorder level, recent receipts, a consumption snapshot, quick actions (Receive stock, New item, Stock count).
- **Sales Manager:** today's sales total, active tables/orders count, quick **"New order"** button.

### S3/S4 — Counter (the core screen)

The counter is a **two-pane** layout on desktop. Category is a segmented control; halls show a 1–20 table grid; tapping a table opens its workspace listing **today's active orders for that table** (older orders are excluded to avoid confusion) plus a New order button. Parcel skips the grid.

```
DESKTOP — Counter / Order workspace
┌───────────────────────────────────────────────────────────────────────┐
│  [ Gents Hall ] [ Family Hall ] [ Parcel ]              Order: F12-…1930 │
├───────────────────────────────────┬───────────────────────────────────┤
│  TABLES (Gents Hall)              │  ORDER  ·  Table 12   ● DRAFT       │
│  ┌──┐┌──┐┌──┐┌──┐┌──┐             │  ┌─────────────────────────────────┐ │
│  │ 1││ 2││ 3││ 4││ 5│  ○ free     │  │ Chicken Karahi   x1   1,200  ✎ ✕│ │
│  └──┘└──┘└──┘└──┘└──┘  ● occupied │  │  "less spicy"                   │ │
│  ┌──┐┌──┐┌──┐┌──┐┌──┐             │  │ Naan             x4     200  ✎ ✕│ │
│  │ 6││ 7││ 8││ 9││10│             │  │ Soft Drink       x2     180  ✎ ✕│ │
│  └──┘└──┘└──┘└──┘└──┘             │  └─────────────────────────────────┘ │
│  … up to 20 …                     │  Subtotal                    1,580   │
│                                   │  ⚠ Chicken stock low (≈1.2 kg left)  │
│  MENU                             │                                       │
│  [search dishes…]  [category ▾]   │  ┌──────────────┐ ┌────────────────┐ │
│  • Chicken Karahi      1,200      │  │  Print KOT   │ │  Print Bill →  │ │
│  • Mutton Karahi       1,600      │  └──────────────┘ └────────────────┘ │
│  • Naan                   50      │   (KOT optional · Bill locks order)  │
│  • Soft Drink             90 ⓘ    │                                       │
└───────────────────────────────────┴───────────────────────────────────┘
```

Interaction rules:
- Tap a menu dish → adds to the order; tap again or use the line `✎` to set **quantity** and **optional special instructions**.
- **Low-stock dishes** show a ⚠ in the cart but remain orderable. **Sold-out** dishes are dimmed and not addable.
- **Print KOT** is available throughout Draft and does **not** lock the order.
- **Print Bill** opens S5; on confirm the order becomes **locked/read-only**.

```
MOBILE — Counter
┌─────────────────────────┐     Cart opens as a slide-up sheet:
│ Gents | Family | Parcel │     ┌─────────────────────────┐
│ ┌──┐┌──┐┌──┐┌──┐        │     │ Table 12 · DRAFT        │
│ │1 ││2 ││3 ││4 │  …     │     │ Chicken Karahi x1 1,200 │
│ └──┘└──┘└──┘└──┘        │     │ Naan          x4   200  │
│ ─────────────────────── │     │ Subtotal        1,580   │
│ [search dishes…]        │     │ [ KOT ] [ Print Bill → ]│
│ • Chicken Karahi  1,200 │     └─────────────────────────┘
│ • Naan               50 │
│ ───────────────────────│      Bottom bar: 🛒 Cart (3) · ₨1,580
│ 🏠  🧾  📋             │
└─────────────────────────┘
```

### S5 — Billing & payment
Shows the itemized order with computed totals as **frozen snapshots**:

```
┌──────────────────────────────────────────────┐
│  BILL  ·  Family Hall · Table 12              │
│  ──────────────────────────────────────────  │
│  Subtotal                            1,580.00 │
│  Discount (admin only)      [  0.00   ]       │ ← editable only for Super Admin
│  Service charge (5%)                    79.00 │ ← hidden/0 for Parcel
│  ──────────────────────────────────────────  │
│  Pay by CASH    → GST 16%   265.44  =  1,924  │ ← itemized per payment option
│  Pay by CARD    → GST 5%     82.95  =  1,742  │   (transparency)
│  ──────────────────────────────────────────  │
│  Payment method  ( — choose to settle — ▾ )   │
│  Amount paid     [          ]                 │
│                                                │
│  [ Cancel ]                 [ Confirm & Print ]│
└──────────────────────────────────────────────┘
```
- **Discount** field is visible/enabled **only for Super Admin**; hidden for Sales Managers.
- **Charges vary by payment method:** the screen shows a **full itemized breakdown for each payment option** (each charge line + grand total). The line items, subtotal, discount, and service charge are frozen at print; **GST/charges and the grand total are settled when the payment method is chosen at payment time**.
- The **Payment method** dropdown is sourced from the **admin-managed list** (Cash, Card, Bank, Easypaisa + custom), each carrying its own charge rates.
- **Service charge** row is absent (or zero) for Parcel; GST always applies.
- For halls, the bill is printed first and payment is recorded later (waiter collects from the guest); **Confirm & Print** locks the order, while payment + completion happen after.

### S6 — Bill / KOT preview
A faithful preview of the printed output (thermal-width or A4) with restaurant identity header, order id, line items, and a **full itemized charge breakdown for each payment option** (each charge line + grand total per method, e.g., Cash vs Card/digital) for transparency, plus the settled total and payment once recorded. **Reprint** button (logged). KOT preview shows kitchen-relevant fields only (dishes, qty, instructions — no prices).

### S7 — Orders list
Filterable table: order id, category/table, status badge (Draft / Printed / Delivered / Paid / **Pending** / **Cancelled**), total, created-by, time. Sales Managers see orders and today's totals; Admin sees everything and the end-of-day **Pending** and **Cancelled** views.

### S8 — Order detail + cancellation
Read-only breakdown plus the audit trail for that order (who created/edited/printed). The **Cancel order** action appears **only for Super Admin** and opens:

```
┌──────────────────────────────────────────┐
│  Cancel order F12-20260530-1930?          │
│  This cannot be undone. The record is     │
│  kept and marked Cancelled.               │
│                                            │
│  Return ingredients to inventory?          │
│   ( ) Yes — restock deducted ingredients   │
│   ( ) No  — leave consumed (already used)  │
│                                            │
│  [ Keep order ]        [ Confirm cancel ]  │
└──────────────────────────────────────────┘
```

### S9/S10 — Inventory items
List with name, category, on-hand qty + unit, weighted-avg cost, reorder level, and a **low-stock badge** when at/below reorder. Editor captures name, category, stock unit (from a unit family), reorder level, and active flag. Cost is not entered here — it is derived from receipts.

### S12 — Dishes / recipe editor
A **dish type** switch drives the form:

```
┌──────────────────────────────────────────────────────┐
│  Dish: Chicken Karahi      Menu category ( Karahi ▾ )  │
│  Selling price  [ 1,200 ]         Available [ ✓ ]      │
│  Type:  (•) Recipe-based   ( ) Direct resale           │
│  ────────────────────────────────────────────────────│
│  INGREDIENTS                                           │
│   Chicken      [ 0.5 ] [ kg ▾ ]                      ✕ │
│   Cooking oil  [ 50  ] [ ml ▾ ]                      ✕ │
│   Tomato       [ 200 ] [ g  ▾ ]                      ✕ │
│   [ + add ingredient ]                                 │
│  ────────────────────────────────────────────────────│
│  Est. food cost ₨ 430   ·   Margin 64%                 │  ← from avg costs
└──────────────────────────────────────────────────────┘
```
- **Recipe-based** shows the ingredient list (each with a unit from a compatible family) and a live **food cost / margin** readout.
- **Direct resale** replaces ingredients with a single linked inventory item; selling one deducts one unit.

### S14 — Stock receipt (GRN)
Vendor + date + optional invoice ref, then a line grid (item, qty, unit, unit cost, line total) with a running total. Saving increases on-hand quantity and recomputes weighted-average cost.

### S16 — Stock count / adjustment
Per item: system (theoretical) qty vs **counted** qty, auto-computed variance, and a reason (waste / spillage / correction). Feeds the variance report.

### S17 — Reports & analytics
A report hub: sales (by day/category/table), item-wise sales, ingredient consumption, theoretical-vs-physical variance, low-stock, vendor purchases & dues, pending & cancelled orders, and food-cost/margin. Date-range filter; export to PDF/CSV. All figures come from stored snapshots.

### S18 — Audit log
Filterable, read-only stream: actor, time, action, target, and before/after detail on expand. Super Admin only.

### S20 — Settings
Grouped panels: **Charges** (define GST, service charge, and future charges — each with a **rate per payment method** and applicability per order category), **Payment methods** (manage the billing list — Cash, Card, Bank, Easypaisa seeded; admin can add more; each carries its charge rates), **Backup** (schedule + "Backup now"), **Restaurant identity** (name, logo, address, phone, tax number — feeds the bill header), **Printer setup** (the "what printer do you have?" selection: A4 / thermal-network / thermal-USB + connection details), **Localization** (default language), and **Users** link.

---

## 5. Responsive behavior

| | Desktop / tablet | Phone |
|---|---|---|
| Navigation | Persistent left (RTL: right) sidebar | Bottom tab bar + hamburger |
| Counter | Two-pane (tables/menu + live cart) | Single column; cart as slide-up sheet with a sticky cart bar |
| Tables grid | 5 columns | 4 columns, horizontally comfortable, large tap targets |
| Lists/tables | Full columns | Priority columns + expandable rows |
| Forms | Multi-column | Stacked single column |
| Bill preview | Side panel/modal | Full-screen |

Touch targets are ≥ 44px; primary counter actions stay reachable with one thumb on phone.

---

## 6. Localization & RTL

- **Language toggle** in the top bar and pre-login; choice persists per user with a system default.
- **Urdu = full RTL:** the entire layout mirrors (sidebar, alignment, icon direction, progress flows) via document `dir="rtl"` and logical CSS properties.
- **Formatting:** numbers, dates/times, and **PKR** currency rendered per active locale (`Intl`).
- **Printed output** (bill/KOT) follows the active language and direction.
- All copy lives in translation bundles — no hardcoded strings.

---

## 7. Cross-cutting UI states

- **Loading:** skeletons for lists; inline spinners for actions; the print/bill button shows a busy state during the transaction.
- **Empty:** friendly empty states with the primary action (e.g., "No active orders — start one").
- **Error:** clear inline messages; the **"order changed, reload"** message for optimistic-lock conflicts; **"print failed — retry"** with the bill safely saved.
- **Offline-by-design:** since the system runs locally, there is no "you are offline" failure for normal use; only genuine backend/db unavailability shows a system error.
- **Locked state:** printed orders render read-only with a lock badge and a single **"New linked order"** action.

---

## 8. Accessibility & visual notes

- Keyboard navigable; visible focus states; semantic roles for dialogs and tabs.
- Sufficient color contrast; status conveyed by **badge + label**, never color alone (Draft/Printed/Pending/Cancelled all carry text).
- Consistent component library (inputs, tables, dialogs, toasts) for predictability.
- Confirmation dialogs for **Print Bill**, **Cancel order**, and **destructive-looking** settings changes.

---

## 9. Resolved UX decisions

1. **Table-with-multiple-orders** — tapping a table opens a workspace listing **only today's active orders** for that table, plus a "New order" button. Older orders are excluded to avoid confusion.
2. **Payment methods** — seeded list of **Cash, Card, Bank, Easypaisa**, with the admin able to **add custom methods** in Settings.
3. **Dashboard priorities** — the per-role cards in §S2 are confirmed as-is.

No outstanding UX questions remain for v1.
