/* ============================================================
   Karachi B.B.Q — Seed data (window.KB_SEED)
   Realistic Pakistani BBQ restaurant operation.
   ============================================================ */
(function () {
  const uid = (p) => p + "-" + Math.random().toString(36).slice(2, 9);

  /* ---- Users ---- */
  const users = [
    { id: "u-admin", username: "owner", full_name: "Imran Sheikh", role: "SUPER_ADMIN", active: true, pin: "2468", color: "#B23121", last_login_at: "2026-05-30T09:02:00" },
    { id: "u-inv", username: "inventory", full_name: "Saima Yusuf", role: "INVENTORY_MANAGER", active: true, pin: null, color: "#2F6E9E", last_login_at: "2026-05-30T08:40:00" },
    { id: "u-sales1", username: "counter1", full_name: "Bilal Ahmed", role: "SALES_MANAGER", active: true, pin: "1357", color: "#3F7A4E", last_login_at: "2026-05-30T11:15:00" },
    { id: "u-sales2", username: "counter2", full_name: "Fahad Riaz", role: "SALES_MANAGER", active: true, pin: "9753", color: "#C2680E", last_login_at: "2026-05-29T22:10:00" },
    { id: "u-sales3", username: "nightshift", full_name: "Usman Tariq", role: "SALES_MANAGER", active: false, pin: null, color: "#6E6153", last_login_at: "2026-05-12T23:50:00" },
  ];

  /* ---- Units ---- */
  const units = [
    { id: "kg", name: "kg", family: "WEIGHT", factor: 1 },
    { id: "g", name: "g", family: "WEIGHT", factor: 0.001 },
    { id: "l", name: "litre", family: "VOLUME", factor: 1 },
    { id: "ml", name: "ml", family: "VOLUME", factor: 0.001 },
    { id: "pc", name: "piece", family: "COUNT", factor: 1 },
    { id: "dz", name: "dozen", family: "COUNT", factor: 12 },
  ];

  /* ---- Item categories ---- */
  const itemCategories = [
    { id: "ic-meat", name: "Meat & Poultry", active: true },
    { id: "ic-veg", name: "Vegetables", active: true },
    { id: "ic-spice", name: "Spices & Masala", active: true },
    { id: "ic-dairy", name: "Dairy & Bakery", active: true },
    { id: "ic-oil", name: "Oils & Ghee", active: true },
    { id: "ic-bev", name: "Beverages", active: true },
    { id: "ic-pack", name: "Packaging", active: true },
  ];

  /* ---- Items ---- (qty in stock unit) */
  const items = [
    { id: "it-chk", name: "Chicken (boneless)", cat: "ic-meat", unit: "kg", qty: 1.2, avg: 620, reorder: 8, active: true },
    { id: "it-mut", name: "Mutton", cat: "ic-meat", unit: "kg", qty: 14.5, avg: 1450, reorder: 6, active: true },
    { id: "it-beef", name: "Beef (undercut)", cat: "ic-meat", unit: "kg", qty: 22, avg: 1100, reorder: 8, active: true },
    { id: "it-mince", name: "Beef Mince (qeema)", cat: "ic-meat", unit: "kg", qty: 9.4, avg: 1150, reorder: 5, active: true },
    { id: "it-fish", name: "Rahu Fish", cat: "ic-meat", unit: "kg", qty: 7, avg: 900, reorder: 4, active: true },
    { id: "it-tom", name: "Tomato", cat: "ic-veg", unit: "kg", qty: 18, avg: 180, reorder: 10, active: true },
    { id: "it-onion", name: "Onion", cat: "ic-veg", unit: "kg", qty: 24, avg: 140, reorder: 12, active: true },
    { id: "it-ginger", name: "Ginger", cat: "ic-veg", unit: "kg", qty: 3.1, avg: 480, reorder: 2, active: true },
    { id: "it-garlic", name: "Garlic", cat: "ic-veg", unit: "kg", qty: 2.6, avg: 520, reorder: 2, active: true },
    { id: "it-chili", name: "Green Chili", cat: "ic-veg", unit: "kg", qty: 1.6, avg: 260, reorder: 2, active: true },
    { id: "it-corr", name: "Fresh Coriander", cat: "ic-veg", unit: "kg", qty: 0.9, avg: 220, reorder: 1, active: true },
    { id: "it-redchili", name: "Red Chili Powder", cat: "ic-spice", unit: "kg", qty: 4.2, avg: 720, reorder: 2, active: true },
    { id: "it-turm", name: "Turmeric", cat: "ic-spice", unit: "kg", qty: 3.0, avg: 540, reorder: 1.5, active: true },
    { id: "it-garam", name: "Garam Masala", cat: "ic-spice", unit: "kg", qty: 1.8, avg: 1600, reorder: 1, active: true },
    { id: "it-salt", name: "Salt", cat: "ic-spice", unit: "kg", qty: 12, avg: 45, reorder: 5, active: true },
    { id: "it-yog", name: "Yogurt", cat: "ic-dairy", unit: "kg", qty: 6.5, avg: 220, reorder: 4, active: true },
    { id: "it-flour", name: "Wheat Flour (atta)", cat: "ic-dairy", unit: "kg", qty: 38, avg: 95, reorder: 20, active: true },
    { id: "it-butter", name: "Butter", cat: "ic-dairy", unit: "kg", qty: 2.1, avg: 1300, reorder: 2, active: true },
    { id: "it-oil", name: "Cooking Oil", cat: "ic-oil", unit: "l", qty: 28, avg: 540, reorder: 15, active: true },
    { id: "it-ghee", name: "Desi Ghee", cat: "ic-oil", unit: "kg", qty: 5.5, avg: 1750, reorder: 4, active: true },
    { id: "it-coal", name: "Charcoal", cat: "ic-oil", unit: "kg", qty: 40, avg: 110, reorder: 20, active: true },
    { id: "it-cola", name: "Coca-Cola 345ml", cat: "ic-bev", unit: "pc", qty: 96, avg: 60, reorder: 48, active: true },
    { id: "it-sprite", name: "Sprite 345ml", cat: "ic-bev", unit: "pc", qty: 11, avg: 60, reorder: 48, active: true },
    { id: "it-water", name: "Mineral Water 500ml", cat: "ic-bev", unit: "pc", qty: 140, avg: 35, reorder: 60, active: true },
    { id: "it-lassi", name: "Yogurt for Lassi", cat: "ic-dairy", unit: "kg", qty: 4, avg: 220, reorder: 3, active: true },
    { id: "it-box", name: "Parcel Box (large)", cat: "ic-pack", unit: "pc", qty: 320, avg: 22, reorder: 150, active: true },
    { id: "it-bag", name: "Carry Bag", cat: "ic-pack", unit: "pc", qty: 64, avg: 8, reorder: 100, active: true },
  ];

  /* ---- Menu categories ---- */
  const menuCategories = [
    { id: "mc-karahi", name: "Karahi & Handi", sort: 1, active: true },
    { id: "mc-bbq", name: "BBQ & Tikka", sort: 2, active: true },
    { id: "mc-rice", name: "Rice & Biryani", sort: 3, active: true },
    { id: "mc-bread", name: "Breads", sort: 4, active: true },
    { id: "mc-bev", name: "Beverages", sort: 5, active: true },
  ];

  /* ---- Dishes ---- */
  const dishes = [
    { id: "d-ckarahi", name: "Chicken Karahi (full)", cat: "mc-karahi", price: 1450, type: "RECIPE", available: true,
      recipe: [{ item: "it-chk", qty: 0.9, unit: "kg" }, { item: "it-tom", qty: 0.4, unit: "kg" }, { item: "it-oil", qty: 120, unit: "ml" }, { item: "it-ginger", qty: 30, unit: "g" }, { item: "it-garlic", qty: 30, unit: "g" }, { item: "it-redchili", qty: 15, unit: "g" }] },
    { id: "d-ckarahih", name: "Chicken Karahi (half)", cat: "mc-karahi", price: 800, type: "RECIPE", available: true,
      recipe: [{ item: "it-chk", qty: 0.45, unit: "kg" }, { item: "it-tom", qty: 0.2, unit: "kg" }, { item: "it-oil", qty: 70, unit: "ml" }] },
    { id: "d-mkarahi", name: "Mutton Karahi (full)", cat: "mc-karahi", price: 2400, type: "RECIPE", available: true,
      recipe: [{ item: "it-mut", qty: 0.9, unit: "kg" }, { item: "it-tom", qty: 0.4, unit: "kg" }, { item: "it-ghee", qty: 80, unit: "g" }, { item: "it-ginger", qty: 40, unit: "g" }] },
    { id: "d-handi", name: "Chicken White Handi", cat: "mc-karahi", price: 1350, type: "RECIPE", available: true,
      recipe: [{ item: "it-chk", qty: 0.8, unit: "kg" }, { item: "it-yog", qty: 0.25, unit: "kg" }, { item: "it-butter", qty: 40, unit: "g" }] },
    { id: "d-tikka", name: "Chicken Tikka (1 pc)", cat: "mc-bbq", price: 380, type: "RECIPE", available: true,
      recipe: [{ item: "it-chk", qty: 0.25, unit: "kg" }, { item: "it-yog", qty: 40, unit: "g" }, { item: "it-redchili", qty: 8, unit: "g" }, { item: "it-coal", qty: 60, unit: "g" }] },
    { id: "d-seekh", name: "Beef Seekh Kabab (4 pc)", cat: "mc-bbq", price: 720, type: "RECIPE", available: true,
      recipe: [{ item: "it-mince", qty: 0.32, unit: "kg" }, { item: "it-onion", qty: 60, unit: "g" }, { item: "it-garam", qty: 6, unit: "g" }, { item: "it-coal", qty: 60, unit: "g" }] },
    { id: "d-malai", name: "Malai Boti (8 pc)", cat: "mc-bbq", price: 950, type: "RECIPE", available: true,
      recipe: [{ item: "it-chk", qty: 0.4, unit: "kg" }, { item: "it-butter", qty: 30, unit: "g" }, { item: "it-yog", qty: 60, unit: "g" }] },
    { id: "d-bihari", name: "Bihari Boti (8 pc)", cat: "mc-bbq", price: 880, type: "RECIPE", available: false,
      recipe: [{ item: "it-beef", qty: 0.4, unit: "kg" }, { item: "it-garam", qty: 8, unit: "g" }] },
    { id: "d-fishfry", name: "Fried Fish (plate)", cat: "mc-bbq", price: 1100, type: "RECIPE", available: true,
      recipe: [{ item: "it-fish", qty: 0.45, unit: "kg" }, { item: "it-oil", qty: 150, unit: "ml" }, { item: "it-redchili", qty: 10, unit: "g" }] },
    { id: "d-biryani", name: "Chicken Biryani", cat: "mc-rice", price: 480, type: "RECIPE", available: true,
      recipe: [{ item: "it-chk", qty: 0.2, unit: "kg" }, { item: "it-oil", qty: 50, unit: "ml" }] },
    { id: "d-pulao", name: "Mutton Pulao", cat: "mc-rice", price: 620, type: "RECIPE", available: true,
      recipe: [{ item: "it-mut", qty: 0.2, unit: "kg" }, { item: "it-ghee", qty: 30, unit: "g" }] },
    { id: "d-naan", name: "Naan", cat: "mc-bread", price: 60, type: "RECIPE", available: true,
      recipe: [{ item: "it-flour", qty: 120, unit: "g" }] },
    { id: "d-roghani", name: "Roghani Naan", cat: "mc-bread", price: 90, type: "RECIPE", available: true,
      recipe: [{ item: "it-flour", qty: 130, unit: "g" }, { item: "it-butter", qty: 12, unit: "g" }] },
    { id: "d-roti", name: "Tandoori Roti", cat: "mc-bread", price: 30, type: "RECIPE", available: true,
      recipe: [{ item: "it-flour", qty: 90, unit: "g" }] },
    { id: "d-lassi", name: "Sweet Lassi", cat: "mc-bev", price: 220, type: "RECIPE", available: true,
      recipe: [{ item: "it-lassi", qty: 0.3, unit: "kg" }] },
    { id: "d-cola", name: "Coca-Cola (bottle)", cat: "mc-bev", price: 120, type: "RESALE", available: true, resale_item: "it-cola" },
    { id: "d-sprite", name: "Sprite (bottle)", cat: "mc-bev", price: 120, type: "RESALE", available: true, resale_item: "it-sprite" },
    { id: "d-water", name: "Mineral Water", cat: "mc-bev", price: 70, type: "RESALE", available: true, resale_item: "it-water" },
  ];

  /* ---- Vendors ---- */
  const vendors = [
    { id: "v-meat", name: "Liaquat Meat Suppliers", contact: "0300-2233445", notes: "Daily fresh chicken & mutton, delivers 7am", active: true },
    { id: "v-sabzi", name: "Sabzi Mandi Wholesale", contact: "0321-9988776", notes: "Vegetables, alternate days", active: true },
    { id: "v-masala", name: "Karachi Masala House", contact: "0345-1122334", notes: "Spices, monthly", active: true },
    { id: "v-bev", name: "Pakola Distributors", contact: "0301-5566778", notes: "Soft drinks & water", active: true },
    { id: "v-gen", name: "Al-Habib General Store", contact: "0302-4455667", notes: "Oil, flour, packaging", active: true },
  ];

  /* ---- Purchases (goods received) ---- */
  const purchases = [
    { id: "p-1", vendor: "v-meat", date: "2026-05-30", ref: "INV-8841", total: 87000, by: "u-inv",
      lines: [{ item: "it-mut", qty: 12, unit: "kg", cost: 1450 }, { item: "it-beef", qty: 18, unit: "kg", cost: 1100 }, { item: "it-mince", qty: 8, unit: "kg", cost: 1150 }] },
    { id: "p-2", vendor: "v-sabzi", date: "2026-05-30", ref: "—", total: 9640, by: "u-inv",
      lines: [{ item: "it-tom", qty: 20, unit: "kg", cost: 180 }, { item: "it-onion", qty: 25, unit: "kg", cost: 140 }, { item: "it-chili", qty: 2, unit: "kg", cost: 260 }] },
    { id: "p-3", vendor: "v-bev", date: "2026-05-29", ref: "PK-2290", total: 14400, by: "u-inv",
      lines: [{ item: "it-cola", qty: 120, unit: "pc", cost: 60 }, { item: "it-water", qty: 120, unit: "pc", cost: 35 }] },
    { id: "p-4", vendor: "v-masala", date: "2026-05-27", ref: "KMH-551", total: 11200, by: "u-inv",
      lines: [{ item: "it-redchili", qty: 5, unit: "kg", cost: 720 }, { item: "it-garam", qty: 2, unit: "kg", cost: 1600 }, { item: "it-turm", qty: 3, unit: "kg", cost: 540 }] },
  ];

  /* ---- Vendor payments ---- */
  const vendorPayments = [
    { id: "vp-1", vendor: "v-meat", amount: 60000, at: "2026-05-28T18:00:00", note: "Weekly settlement", by: "u-inv" },
    { id: "vp-2", vendor: "v-bev", amount: 14400, at: "2026-05-29T17:30:00", note: "Paid in full", by: "u-inv" },
    { id: "vp-3", vendor: "v-masala", amount: 5000, at: "2026-05-27T16:00:00", note: "Partial", by: "u-inv" },
  ];

  /* ---- Payment methods ---- */
  const paymentMethods = [
    { id: "pm-cash", name: "Cash", sort: 1, active: true },
    { id: "pm-card", name: "Card", sort: 2, active: true },
    { id: "pm-bank", name: "Bank Transfer", sort: 3, active: true },
    { id: "pm-easy", name: "Easypaisa", sort: 4, active: true },
  ];

  /* ---- Charges ---- */
  const charges = [
    { id: "ch-gst", name: "GST", kind: "PERCENTAGE", base: "SUBTOTAL_AFTER_DISCOUNT", applies: ["GENTS_HALL", "FAMILY_HALL", "PARCEL"], sort: 1, active: true },
    { id: "ch-svc", name: "Service Charge", kind: "PERCENTAGE", base: "SUBTOTAL_AFTER_DISCOUNT", applies: ["GENTS_HALL", "FAMILY_HALL"], sort: 2, active: true },
  ];
  // rates: pm=null => default for all methods
  const chargeRates = [
    { charge: "ch-gst", pm: "pm-cash", rate: 16 },
    { charge: "ch-gst", pm: null, rate: 5 },        // card / bank / easypaisa
    { charge: "ch-svc", pm: null, rate: 5 },        // all methods
  ];

  /* ---- Orders ---- (seed: mix of statuses for today) */
  function line(dishId, qty, note) {
    const d = dishes.find((x) => x.id === dishId);
    return { id: uid("oi"), dish: dishId, name: d.name, qty, price: d.price, note: note || null };
  }
  const orders = [
    { id: "o-1", number: "F12-20260530-1930", category: "FAMILY_HALL", table: 12, status: "DRAFT", created_by: "u-sales1", created_at: "2026-05-30T19:30:00",
      items: [line("d-ckarahi", 1, "less spicy"), line("d-naan", 4), line("d-cola", 2)] },
    { id: "o-2", number: "G05-20260530-1942", category: "GENTS_HALL", table: 5, status: "PRINTED", created_by: "u-sales1", created_at: "2026-05-30T19:42:00", printed_at: "2026-05-30T20:05:00",
      items: [line("d-mkarahi", 1), line("d-seekh", 2), line("d-roghani", 6), line("d-water", 3)] },
    { id: "o-3", number: "F03-20260530-2010", category: "FAMILY_HALL", table: 3, status: "DELIVERED", created_by: "u-sales2", created_at: "2026-05-30T20:10:00", printed_at: "2026-05-30T20:20:00", delivered_at: "2026-05-30T20:35:00",
      items: [line("d-tikka", 4), line("d-malai", 1), line("d-naan", 6), line("d-lassi", 2)] },
    { id: "o-4", number: "P-00231", category: "PARCEL", parcel: 231, status: "COMPLETED", created_by: "u-sales1", created_at: "2026-05-30T18:50:00", printed_at: "2026-05-30T18:52:00", delivered_at: "2026-05-30T18:58:00", completed_at: "2026-05-30T18:58:00",
      settled_method: "pm-cash", settled_total: 2030, items: [line("d-biryani", 2), line("d-seekh", 1), line("d-cola", 2)] },
    { id: "o-5", number: "P-00232", category: "PARCEL", parcel: 232, status: "COMPLETED", created_by: "u-sales2", created_at: "2026-05-30T19:05:00", printed_at: "2026-05-30T19:06:00", completed_at: "2026-05-30T19:12:00",
      settled_method: "pm-card", settled_total: 1638, items: [line("d-ckarahi", 1), line("d-naan", 4)] },
    { id: "o-6", number: "G09-20260530-2025", category: "GENTS_HALL", table: 9, status: "COMPLETED", created_by: "u-sales1", created_at: "2026-05-30T20:25:00", printed_at: "2026-05-30T21:10:00", delivered_at: "2026-05-30T21:00:00", completed_at: "2026-05-30T21:12:00",
      settled_method: "pm-cash", settled_total: 4118, items: [line("d-mkarahi", 1), line("d-pulao", 2), line("d-roti", 8), line("d-cola", 4)] },
    { id: "o-7", number: "F08-20260530-1830", category: "FAMILY_HALL", table: 8, status: "CANCELLED", created_by: "u-sales2", created_at: "2026-05-30T18:30:00", printed_at: "2026-05-30T18:45:00", cancelled_at: "2026-05-30T19:00:00", cancelled_by: "u-admin", cancel_restocked: true,
      items: [line("d-fishfry", 2), line("d-naan", 4)] },
    { id: "o-8", number: "P-00233", category: "PARCEL", parcel: 233, status: "DRAFT", created_by: "u-sales2", created_at: "2026-05-30T21:15:00",
      items: [line("d-malai", 2), line("d-roghani", 4), line("d-water", 2)] },
  ];

  /* ---- Stock counts ---- */
  const stockCounts = [
    { id: "sc-1", at: "2026-05-29T23:30:00", by: "u-inv", note: "End-of-day count",
      lines: [{ item: "it-chk", system: 2.0, counted: 1.2, reason: "Wastage / trim" }, { item: "it-oil", system: 29.5, counted: 28, reason: "Spillage" }] },
  ];

  /* ---- Audit events ---- */
  const audit = [
    { id: "a-1", seq: 142, entity: "order", entity_id: "o-7", action: "CANCEL", actor: "u-admin", at: "2026-05-30T19:00:00", summary: "Cancelled order F08-20260530-1830 (restocked)", before: { status: "PRINTED" }, after: { status: "CANCELLED", cancel_restocked: true } },
    { id: "a-2", seq: 141, entity: "order", entity_id: "o-6", action: "PAYMENT", actor: "u-sales1", at: "2026-05-30T21:12:00", summary: "Payment recorded — Cash ₨4,118 for G09-20260530-2025", before: null, after: { method: "Cash", total: 4118 } },
    { id: "a-3", seq: 140, entity: "order", entity_id: "o-2", action: "PRINT", actor: "u-sales1", at: "2026-05-30T20:05:00", summary: "Bill printed for G05-20260530-1942 — order locked, stock deducted", before: { status: "DRAFT" }, after: { status: "PRINTED" } },
    { id: "a-4", seq: 139, entity: "purchase", entity_id: "p-1", action: "RECEIPT", actor: "u-inv", at: "2026-05-30T07:30:00", summary: "Stock received from Liaquat Meat Suppliers — ₨87,000", before: null, after: { total: 87000 } },
    { id: "a-5", seq: 138, entity: "dish", entity_id: "d-bihari", action: "UPDATE", actor: "u-inv", at: "2026-05-30T11:20:00", summary: "Bihari Boti marked sold out", before: { available: true }, after: { available: false } },
    { id: "a-6", seq: 137, entity: "settings", entity_id: "settings", action: "SETTINGS_CHANGE", actor: "u-admin", at: "2026-05-30T09:15:00", summary: "GST rate (Card) changed 6% → 5%", before: { rate: 6 }, after: { rate: 5 } },
    { id: "a-7", seq: 136, entity: "user", entity_id: "u-admin", action: "LOGIN", actor: "u-admin", at: "2026-05-30T09:02:00", summary: "Imran Sheikh signed in (password)", before: null, after: null },
    { id: "a-8", seq: 135, entity: "item", entity_id: "it-chk", action: "ADJUSTMENT", actor: "u-inv", at: "2026-05-29T23:30:00", summary: "Stock adjustment: Chicken 2.0 → 1.2 kg (Wastage / trim)", before: { qty: 2.0 }, after: { qty: 1.2 } },
    { id: "a-9", seq: 134, entity: "user", entity_id: "u-sales2", action: "LOGIN_FAILED", actor: "u-sales2", at: "2026-05-29T22:08:00", summary: "Failed PIN attempt — counter2", before: null, after: null },
  ];

  const settings = {
    restaurant_name: "Karachi B.B.Q",
    tagline: "Authentic Charcoal Grill • Est. 1998",
    address: "Plot 14, Boat Basin, Block 5, Clifton, Karachi",
    phone: "021-3583-9921",
    tax_number: "NTN 4419082-6",
    default_language: "en",
    currency: "PKR",
    backup_cron: "nightly",
    backup_time: "02:30",
    backup_retention: 14,
    printer: { type: "thermal", connection: "network", ip: "192.168.1.50", port: 9100, width: "80mm" },
  };

  const backups = [
    { id: "bk-1", file: "kbbq-2026-05-30-0230.dump", type: "SCHEDULED", status: "SUCCESS", size: 4820000, started: "2026-05-30T02:30:00", finished: "2026-05-30T02:30:42", by: null },
    { id: "bk-2", file: "kbbq-2026-05-29-0230.dump", type: "SCHEDULED", status: "SUCCESS", size: 4710000, started: "2026-05-29T02:30:00", finished: "2026-05-29T02:30:39", by: null },
    { id: "bk-3", file: "kbbq-2026-05-28-1145.dump", type: "MANUAL", status: "SUCCESS", size: 4690000, started: "2026-05-28T11:45:00", finished: "2026-05-28T11:45:35", by: "u-admin" },
  ];

  window.KB_SEED = {
    users, units, itemCategories, items, menuCategories, dishes, vendors,
    purchases, vendorPayments, paymentMethods, charges, chargeRates,
    orders, stockCounts, audit, settings, backups,
    nextParcel: 234,
  };
  window.KB_uid = uid;
})();
