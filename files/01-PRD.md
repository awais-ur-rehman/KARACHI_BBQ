# Product Requirements Document (PRD)
### Restaurant Inventory & Sales Management System

| | |
|---|---|
| **Document** | Product Requirements Document |
| **Version** | 1.0 (Draft for review) |
| **Status** | Pending sign-off |
| **Scope** | v1 — single restaurant, single PC, offline-first |
| **Last updated** | 30 May 2026 |

---

## 1. Purpose

This document defines *what* the system must do and *why*, in enough detail that the TRD, UI/UX, App Flow, Backend Schema, and Implementation documents can be built on top of it without re-deciding product behaviour. It is the single source of truth for product scope and business rules.

The system manages two connected domains for one restaurant:

1. **Inventory management** — raw stock, vendors, recipes, and the consumption of stock as dishes are sold.
2. **Sales / order management** — taking orders across halls and parcel, billing, printing, and the full order lifecycle.

---

## 2. Goals & objectives

- Give the owner real-time(ish) visibility into stock levels derived from sales.
- Make order-taking fast and hard to tamper with (orders lock on bill print; no manager-initiated cancellations; nothing is ever hard-deleted).
- Track every meaningful action to a user, so the owner can audit who did what.
- Run reliably **offline on a single PC**, while being architected so a future version can sync across machines and expose a read-only mobile view for the owner.
- Support **English and Urdu** (with correct right-to-left rendering) and **PKR** currency.

### Success criteria (v1)
- A sales manager can take, edit, print, and bill an order without touching anything they shouldn't.
- The inventory manager can define items, recipes, and vendors, receive stock, and run a physical count.
- After a day of sales, the owner can see sales totals, consumption, low-stock items, pending/cancelled orders, and a full audit trail.
- No data is lost (automated local backups) and no record is ever destroyed.

---

## 3. Scope

### 3.1 In scope (v1)
- Role-based access for Super Admin, Inventory Manager, Sales Manager (multiple users per role).
- Inventory items with units, categories, weighted-average costing, and low-stock alerts.
- Recipes / menu with two dish types (recipe-based and direct-resale).
- Vendors, stock receipts, vendor payments/dues, and stock returns.
- Physical stock counts and adjustments.
- Orders for Gents Hall, Family Hall (tables 1–20 each) and Parcel.
- Order lifecycle with lock-on-print, KOT print, and bill print (thermal or A4, env-controlled).
- Billing with admin-configured GST and service charge, Super-Admin-only discounts, and payment recording.
- Super-Admin-only cancellation with optional ingredient restock.
- Reporting & analytics and a full immutable audit log.
- Settings (currency, language, tax/service rates, restaurant identity for the bill).
- Automated local backups.

### 3.2 Out of scope (v1) — planned for v2+
- Online multi-machine **sync** and a hosted/cloud deployment (the schema will be designed sync-ready, but no sync engine ships in v1).
- Owner's remote **mobile view** from home.
- Bill merging across multiple orders on one table.
- Sub-recipes / shared base preparations (recipes are flat in v1).
- Split payments and multiple payment methods per bill.
- Customer accounts, loyalty, online ordering, delivery integrations.

---

## 4. Users & roles

Three roles. Multiple individual user accounts can exist per role, and every action is attributed to the acting user.

### 4.1 Super Admin (owner)
Full access to everything. Exclusive holder of the most sensitive capabilities.

### 4.2 Inventory Manager
Owns the inventory and menu domain. Cannot take orders or change system settings/users.

### 4.3 Sales Manager
Owns order-taking and billing at the counter. Cannot modify inventory/menu, cannot cancel orders, cannot apply discounts, and cannot edit a printed order.

### 4.4 Permissions matrix

| Capability | Super Admin | Inventory Mgr | Sales Mgr |
|---|:---:|:---:|:---:|
| Manage users & roles | ✅ | — | — |
| System settings (currency, language, tax %, service %, identity) | ✅ | — | — |
| Create/edit inventory items & categories | ✅ | ✅ | — |
| Set item reorder/alert levels | ✅ | ✅ | — |
| Create/edit recipes & dishes (incl. selling price) | ✅ | ✅ | — |
| Toggle dish availability (sold out) | ✅ | ✅ | — |
| Manage vendors | ✅ | ✅ | — |
| Receive stock / record purchases | ✅ | ✅ | — |
| Record vendor payments / view dues | ✅ | ✅ | — |
| Record stock returns | ✅ | ✅ | — |
| Physical stock count & adjustment | ✅ | ✅ | — |
| View menu & prices | ✅ | ✅ | ✅ (read-only) |
| Create / edit orders (pre-print) | ✅ | — | ✅ |
| Print KOT | ✅ | — | ✅ |
| Print / reprint bill | ✅ | — | ✅ (logged) |
| Record payment | ✅ | — | ✅ |
| Apply discount | ✅ | — | — |
| **Cancel an order** | ✅ | — | — |
| View own/today's orders & sales totals | ✅ | — | ✅ |
| Full analytics & reports | ✅ | view consumption only | — |
| View audit log | ✅ | — | — |

---

## 5. Functional requirements

### 5.1 Authentication & user management
- Username + password login for all users.
- Optional **PIN login** for Sales Managers for fast counter access (configurable per user).
- Super Admin creates, edits, deactivates user accounts (users are deactivated, never hard-deleted).
- Sessions are role-aware; the UI hides actions the role cannot perform, and the API enforces the same rules.

### 5.2 Inventory items
- Fields: name, category, **stock unit** (e.g., kg, litre, piece), current quantity on hand, weighted-average cost per unit, reorder/alert level, active flag.
- **Units belong to families** (weight, volume, count). Recipes may consume an item in any compatible unit within the same family (buy in kg, consume in g) and the system converts automatically.
- **Costing:** each stock receipt records its own unit cost; the item's weighted moving-average cost is recomputed on every receipt and is used for valuation and food-cost/margin reporting.
- **Categories** are user-defined; the Inventory Manager/Admin can create and manage them.
- **Low-stock alert:** when quantity on hand falls at or below the reorder level, the item is flagged and surfaced in alerts and reports.

### 5.3 Recipes, menu & dishes
- A **dish** is a sellable menu entry with a name, optional menu category, selling price, availability toggle, and a dish type.
- **Dish type A — Recipe-based:** a flat list of ingredients (item + quantity + unit). Used to estimate consumption when the dish sells.
- **Dish type B — Direct-resale:** maps 1:1 to a single stocked inventory item (e.g., a bottled drink); selling one unit deducts one unit of that item.
- **Selling price** is editable by Inventory Manager/Admin. Price changes never affect past orders (see §6 price snapshots).
- **Availability:** a manual "sold out" toggle. Low ingredient stock raises a **warning** but never blocks ordering (stock is an estimate, not ground truth).
- Optional per-dish **food cost & margin** display, computed from current weighted-average ingredient costs vs selling price.

### 5.4 Vendors & purchasing
- Vendor record: name, contact, notes, active flag.
- **Stock receipt (Goods Received):** vendor, date, recorded-by, optional invoice/reference number, and one or more lines (item, quantity, unit, unit cost, line total). Receiving increases on-hand quantity and updates weighted-average cost.
- **Vendor payments / dues:** record amounts paid against a vendor; the system tracks outstanding balance (goods received value vs paid).
- **Stock returns:** record items returned to a vendor (item, quantity, reason, date); reduces on-hand quantity.

### 5.5 Stock reconciliation
- **Physical count:** a manager enters actual counted quantity per item; the system records the variance against the system (theoretical) quantity as an adjustment, with a reason (waste, spillage, correction, etc.).
- Adjustments are logged and feed a variance/waste report so the owner can see how far estimates drift from reality.

### 5.6 Order management
- **Order categories:** Gents Hall, Family Hall, Parcel.
- **Tables:** Gents Hall and Family Hall each have tables 1–20. Parcel has no table.
- **Table status is informational only** and never blocks action. A table may have multiple concurrent orders; **each order is billed separately** (no merging in v1).
- **Order contents:** one or more lines, each with dish, **quantity**, and **optional special instructions** (e.g., spice level, "no onions"). Each line stores a price snapshot.
- **Editing:** an order is freely editable while in Draft. A **KOT** can be printed during Draft (to start the kitchen) without locking the order.
- **Lock on bill print:** printing the **bill** locks the order — it becomes non-editable — and triggers stock deduction (see §5.8). After lock, additional items create a **new linked order** rather than reopening the old one.
- **Order identifier / numbering:**
  - Hall orders: `{table}-{date}-{time}` (e.g., `F12-20260530-1930`).
  - Parcel orders: a **serial number** (e.g., `P-00042`).
- **Statuses:** `Draft → Printed (locked) → Delivered → Paid/Completed`, plus `Pending` (printed but not delivered) and `Cancelled` (Super Admin only). Status always moves forward or to Cancelled; records are never removed.

### 5.7 Billing
- A bill is generated when the order is locked (bill print). The **method-independent parts are frozen at print**, while the **GST/charges and grand total are settled when payment is recorded**, because charge rates depend on the payment method.
- **Charges are admin-defined and may vary by payment method.** A charge (GST, service charge, or any future charge) has a rate that can be set **per payment method** or shared across all methods, plus an **applicability by order category**. Example: GST 16% on Cash, 5% on Card/digital.
- **GST** applies to all categories including Parcel, at the chosen payment method's rate.
- **Service charge** applies to Gents and Family hall orders; **dropped for Parcel** (method-independent unless the admin sets per-method rates).
- **Discount:** optional, **Super-Admin-only**, applied to the base before charges.
- **Frozen at print:** line items + snapshot prices, quantities, subtotal, discount, and any method-independent charges (e.g., service charge).
- **Transparency on the printed bill:** because hall bills print *before* the guest pays, the bill shows a **full itemized breakdown for each payment option** — every charge line and the grand total per method (e.g., Cash vs Card/digital) — so the customer sees exactly what is charged and why. Methods with identical charge profiles are grouped.
- **Settled at payment:** recording the payment locks in the chosen method, its charge amounts, and the final grand total as the bill's settled figures (used for all reporting); the order can then be completed.
- **Payment record:** method (from the admin-managed list) + amount paid; change shown for cash. No split payments in v1.

### 5.8 Stock deduction & cancellation
- On **bill print**, recipe ingredients (or the resale item) for every line are deducted from on-hand quantity to maintain the rough estimate.
- **Cancellation** is Super Admin only. When cancelling a printed order, the system **prompts the admin to choose whether to restock** the deducted ingredients (yes returns them to inventory; no leaves them consumed, e.g., food already cooked/wasted).
- Cancelled orders retain all data and are visible in reports; nothing is deleted.

### 5.9 Printing
- **KOT (Kitchen Order Ticket):** optional, printed on demand during Draft.
- **Bill:** the locking print; reprints are allowed but logged.
- **Output mode** (thermal 58/80mm vs A4) is selected via an **environment variable**, so the same install can target either hardware.
- **Bill header** includes restaurant name, logo, address, phone, and tax/NTN number (final values supplied by the owner; configurable in settings).

### 5.10 Reporting & analytics
Built on order data, inventory movements, and the audit log. Target reports include:
- Daily/period **sales totals**; sales by **category** (Gents/Family/Parcel) and by table.
- **Item-wise** dish sales (best/worst sellers).
- **Ingredient consumption** and theoretical vs physical **variance/waste**.
- **Low-stock** list and reorder suggestions.
- **Vendor purchases and outstanding dues**.
- **Pending** and **Cancelled** order lists (for end-of-day owner review).
- **Food cost / margin** per dish and overall.

### 5.11 Audit log
- An **immutable, append-only** log of every meaningful action: order created/edited/printed/reprinted/cancelled, payment recorded, stock received/adjusted/returned, price/availability changed, settings changed, and user/login events.
- Each entry records actor, timestamp, action, target record, and before/after values where applicable.
- Viewable by Super Admin only.

### 5.12 Settings
- Currency fixed to **PKR**; formatting follows locale.
- **Language toggle: English (default) / Urdu**, with correct RTL layout and number/date formatting in Urdu.
- Admin-defined **charges** (GST, service charge, and future charges), each with a **rate configurable per payment method** and an applicability per order category.
- Restaurant identity for the bill (name, logo, address, phone, tax number).
- Admin-managed **payment methods** list (seeded with Cash, Card, Bank, Easypaisa; admin can add more).
- Print mode and other deployment options via environment variables.

### 5.13 Backups
- **Automated local backups** of the database to a mounted volume / external drive. Default schedule is **nightly**, but the schedule is **configurable by the admin**, and there is an **on-demand "Backup now"** action. Includes a simple restore path. This is the primary safety net for the single-PC offline deployment.

---

## 6. Core business rules (invariants)

These rules must hold everywhere and are the backbone of the data model:

1. **No hard deletes — ever.** Every entity uses soft-delete / status change. Records are retained for audit.
2. **Lock on bill print.** Once a bill is printed, the order is immutable. Further items become a new linked order.
3. **Cancellation is Super-Admin-only**, and prompts a restock yes/no decision for a printed order.
4. **Snapshots.** Orders/bills freeze line prices, quantities, subtotal, discount, and method-independent charges **at bill print**; the **GST/charges and grand total are settled at payment** (per chosen method) and then frozen. Later config changes never alter historical records.
5. **Charges (GST and others) are admin-defined and may vary by payment method.** GST applies to all categories; service charge is dropped for Parcel.
6. **Discounts are Super-Admin-only.**
7. **Stock deducts on bill print.**
8. **Everything is attributed.** Each create/edit/print/cancel/payment/stock action is tied to a user and logged.
9. **Availability never hard-blocks ordering.** Low stock warns; only a manual "sold out" toggle prevents selling a dish.

---

## 7. Non-functional requirements

- **Offline-first:** the system runs fully on one PC with no internet, deployed via Docker Compose with local volumes for persistence.
- **Sync-ready (v2 foundation):** UUID primary keys, `created_at`/`updated_at` timestamps, soft-delete flags, and an append-only event/outbox log on all relevant entities so multi-machine sync can be added without schema rework.
- **Responsive:** web UI must work well on desktop and be usable on a mobile phone screen.
- **Localization:** full English/Urdu support including RTL.
- **Security:** role enforcement on both client and server; passwords stored hashed; PIN login optional for sales staff.
- **Reliability & recovery:** automated local backups; graceful handling of printer-not-available.
- **Performance:** order entry and printing should feel instant on counter hardware.
- **Auditability:** complete, tamper-evident activity history.

---

## 8. Assumptions & constraints

- Single restaurant, single location, single PC for v1; 1 Super Admin, 1 Inventory Manager, 2 Sales Managers.
- Inventory figures are **estimates**, reconciled by periodic physical counts.
- Recipes are flat (no sub-recipes) in v1.
- Bills are per-order (no merging) in v1.
- Final bill-header details and exact GST/service rates are provided by the owner and set in configuration.

---

## 9. Future scope (v2+)

- Online sync across multiple machines/locations.
- Owner's read-only mobile/remote dashboard.
- Bill merging across a table's orders.
- Sub-recipes / shared preparations.
- Split payments and multiple payment methods.
- Cloud backup and remote management.

---

## 10. Resolved decisions

All previously open items are now confirmed:

1. **GST applies to Parcel** as well; only the service charge is dropped for Parcel. The tax/charge model is built to allow the admin to enable additional charges later, but **GST is the only tax in v1**.
2. **Parcel serial numbers run continuously** (never reset), with the date stored on the record.
3. **Bill-header content and exact GST / service-charge percentages** are supplied by the owner and set in configuration (no hardcoded values).
4. **Backups** run **nightly by default**, the schedule is **admin-configurable**, and an **on-demand backup** action is available.

No outstanding product questions remain for v1.
