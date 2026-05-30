/* ============================================================
   Dashboards — role-specific home screens
   ============================================================ */
(function () {
  const e = React.createElement;
  const Icon = window.Icon;
  const H = window.KBHelpers;

  function todaysCompleted(state) {
    return state.orders.filter((o) => o.status === "COMPLETED");
  }
  function salesTotal(state) {
    return todaysCompleted(state).reduce((s, o) => s + (o.settled_total || H.calcBill(state, o).total), 0);
  }

  function MiniBar({ data, color = "var(--accent)" }) {
    const max = Math.max(...data.map((d) => d.v), 1);
    return e("div", { style: { display: "flex", alignItems: "stretch", gap: 8, height: 150 } },
      data.map((d, i) => e("div", { key: i, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 8 } },
        e("div", { style: { width: "100%", height: (d.v / max) * 100 + "%", minHeight: 4, background: d.hi ? color : "var(--surface-3)", borderRadius: "6px 6px 0 0", transition: ".3s" }, title: H.money(d.v) }),
        e("div", { style: { fontSize: 11, color: "var(--ink-3)", fontWeight: 600 } }, d.l))));
  }

  function SalesDashboard({ S, user, go }) {
    const st = S.state;
    const mine = st.orders.filter((o) => o.created_by === user.id);
    const draft = st.orders.filter((o) => o.status === "DRAFT");
    const printed = st.orders.filter((o) => o.status === "PRINTED" || o.status === "DELIVERED");
    const myDone = mine.filter((o) => o.status === "COMPLETED");
    const mySales = myDone.reduce((s, o) => s + (o.settled_total || 0), 0);
    const active = st.orders.filter((o) => ["DRAFT", "PRINTED", "DELIVERED"].includes(o.status));

    return e("div", { className: "page" },
      e("div", { className: "page-head" },
        e("div", null, e("h1", null, "Good evening, " + user.full_name.split(" ")[0]),
          e("div", { className: "sub" }, "Dinner service · " + H.fmtDate("2026-05-30T21:00:00"))),
        e("div", { className: "page-head-actions" },
          e(window.Btn, { variant: "primary", icon: "plus", onClick: () => go("counter") }, "New Order"))),

      e("div", { className: "grid g4", style: { marginBottom: 18 } },
        e(window.Stat, { label: "My sales today", prefix: "₨", value: H.money0(mySales), icon: "cash", tone: "ok", sub: myDone.length + " orders completed" }),
        e(window.Stat, { label: "Open orders", value: active.length, icon: "orders", tone: "accent", sub: draft.length + " drafts · " + printed.length + " printed" }),
        e(window.Stat, { label: "Awaiting payment", value: printed.length, icon: "wallet", tone: "warn", sub: "Delivered, not settled" }),
        e(window.Stat, { label: "Avg ticket", prefix: "₨", value: myDone.length ? H.money0(mySales / myDone.length) : "0", icon: "receipt", tone: "info", sub: "Per completed order" })),

      e("div", { className: "grid", style: { gridTemplateColumns: "1.4fr 1fr" } },
        e(window.Panel, { title: "Open orders", sub: "Tap to resume or settle", actions: e(window.Btn, { variant: "ghost", size: "sm", onClick: () => go("orders") }, "View all"), pad: false },
          e("div", { style: { padding: "6px 0" } },
            active.length === 0
              ? e(window.Empty, { icon: "check", title: "All caught up", children: "No open orders right now." })
              : active.slice(0, 6).map((o) =>
                e("button", { key: o.id, onClick: () => go("order", { id: o.id }), className: "row between", style: { width: "100%", border: "none", background: "none", padding: "12px 20px", cursor: "pointer", textAlign: "left", borderBottom: "1px solid var(--line)" } },
                  e("div", { className: "row", style: { gap: 13 } },
                    e("div", { style: { width: 42, height: 42, borderRadius: 10, background: "var(--surface-3)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--ink-2)" } },
                      o.category === "PARCEL" ? "P" : (o.category === "GENTS_HALL" ? "G" : "F") + o.table),
                    e("div", null,
                      e("div", { style: { fontWeight: 700, fontSize: 14 } }, o.category === "PARCEL" ? "Parcel #" + o.parcel : H.CATEGORY_LABEL[o.category] + " · Table " + o.table),
                      e("div", { style: { fontSize: 12, color: "var(--ink-2)", marginTop: 2 } }, o.items.length + " items · " + H.timeAgo(o.created_at)))),
                  e("div", { className: "row", style: { gap: 12 } },
                    e("span", { className: "num", style: { fontWeight: 700, fontSize: 14 } }, H.money(H.calcBill(st, o).total)),
                    e(window.StatusBadge, { status: o.status }),
                    e(Icon.chevR, { size: 16, style: { color: "var(--ink-3)" } })))))),

        e(window.Panel, { title: "Quick actions" },
          e("div", { style: { display: "grid", gap: 10 } },
            e(QuickAction, { icon: "counter", title: "Gents Hall", sub: "Start dine-in order", onClick: () => go("counter", { cat: "GENTS_HALL" }) }),
            e(QuickAction, { icon: "users", title: "Family Hall", sub: "Start family order", onClick: () => go("counter", { cat: "FAMILY_HALL" }) }),
            e(QuickAction, { icon: "box", title: "Parcel", sub: "Takeaway order", onClick: () => go("counter", { cat: "PARCEL" }) }),
            e(QuickAction, { icon: "orders", title: "All orders", sub: "Search & history", onClick: () => go("orders") })))));
  }

  function QuickAction({ icon, title, sub, onClick }) {
    return e("button", { onClick, className: "row", style: { width: "100%", gap: 13, border: "1px solid var(--line)", background: "var(--surface)", padding: "13px 15px", borderRadius: "var(--r-md)", cursor: "pointer", textAlign: "left" } },
      e("div", { style: { width: 40, height: 40, borderRadius: 10, background: "var(--accent-soft)", color: "var(--accent-700)", display: "grid", placeItems: "center", flex: "0 0 auto" } }, e(Icon[icon], { size: 20 })),
      e("div", { style: { flex: 1 } },
        e("div", { style: { fontWeight: 700, fontSize: 14 } }, title),
        e("div", { style: { fontSize: 12, color: "var(--ink-2)" } }, sub)),
      e(Icon.chevR, { size: 16, style: { color: "var(--ink-3)" } }));
  }

  function InventoryDashboard({ S, user, go }) {
    const st = S.state;
    const low = H.lowStockItems(st);
    const soldOut = st.dishes.filter((d) => !d.available);
    const recentGrn = st.purchases.slice(0, 4);
    const stockValue = st.items.reduce((s, i) => s + i.qty * i.avg, 0);

    return e("div", { className: "page" },
      e("div", { className: "page-head" },
        e("div", null, e("h1", null, "Inventory overview"),
          e("div", { className: "sub" }, "Stock health · " + H.fmtDate("2026-05-30T21:00:00"))),
        e("div", { className: "page-head-actions" },
          e(window.Btn, { variant: "ghost", icon: "clipboard", onClick: () => go("stockcount") }, "Stock count"),
          e(window.Btn, { variant: "primary", icon: "truck", onClick: () => go("grn") }, "Receive Stock"))),

      e("div", { className: "grid g4", style: { marginBottom: 18 } },
        e(window.Stat, { label: "Stock on hand value", prefix: "₨", value: H.money0(stockValue), icon: "boxes", tone: "info", sub: st.items.length + " tracked items" }),
        e(window.Stat, { label: "Low / out of stock", value: low.length, icon: "warn", tone: "warn", sub: "At or below reorder level" }),
        e(window.Stat, { label: "Sold-out dishes", value: soldOut.length, icon: "chef", tone: "accent", sub: "Hidden from counter" }),
        e(window.Stat, { label: "Active vendors", value: st.vendors.filter((v) => v.active).length, icon: "truck", tone: "ok", sub: "Suppliers on file" })),

      e("div", { className: "grid", style: { gridTemplateColumns: "1.3fr 1fr" } },
        e(window.Panel, { title: "Low stock alerts", sub: "Items needing reorder", actions: e(window.Btn, { variant: "ghost", size: "sm", onClick: () => go("items") }, "All items"), pad: false },
          e("div", { className: "tbl-wrap", style: { border: "none", borderRadius: 0 } },
            low.length === 0 ? e(window.Empty, { icon: "check", title: "Stock looks healthy" }) :
            e("table", { className: "tbl" },
              e("thead", null, e("tr", null, e("th", null, "Item"), e("th", { className: "r" }, "On hand"), e("th", { className: "r" }, "Reorder"), e("th", null, ""))),
              e("tbody", null, low.map((i) => {
                const out = i.qty <= 0.001;
                return e("tr", { key: i.id, className: "clickable", onClick: () => go("item", { id: i.id }) },
                  e("td", null, e("div", { style: { fontWeight: 600 } }, i.name)),
                  e("td", { className: "r num", style: { color: out ? "var(--danger)" : "var(--warn)", fontWeight: 700 } }, H.fmtQty(i.qty) + " " + i.unit),
                  e("td", { className: "r num muted" }, H.fmtQty(i.reorder) + " " + i.unit),
                  e("td", { className: "r" }, e("span", { className: "badge " + (out ? "b-cancelled" : "b-pending") }, out ? "Out" : "Low")));
              })))) ),

        e(window.Panel, { title: "Recent receipts", sub: "Latest goods received", actions: e(window.Btn, { variant: "ghost", size: "sm", onClick: () => go("grn") }, "View" ), pad: false },
          e("div", { style: { padding: "6px 0" } },
            recentGrn.map((p) => {
              const v = st.vendors.find((x) => x.id === p.vendor);
              return e("div", { key: p.id, className: "row between", style: { padding: "12px 20px", borderBottom: "1px solid var(--line)" } },
                e("div", null,
                  e("div", { style: { fontWeight: 700, fontSize: 13.5 } }, v.name),
                  e("div", { style: { fontSize: 12, color: "var(--ink-2)", marginTop: 2 } }, p.lines.length + " items · " + H.fmtDate(p.date))),
                e("span", { className: "num", style: { fontWeight: 700 } }, H.money(p.total)));
            })))));
  }

  function AdminDashboard({ S, user, go }) {
    const st = S.state;
    const completed = todaysCompleted(st);
    const sales = salesTotal(st);
    const active = st.orders.filter((o) => ["DRAFT", "PRINTED", "DELIVERED"].includes(o.status));
    const cancelled = st.orders.filter((o) => o.status === "CANCELLED");
    const low = H.lowStockItems(st);
    const byMethod = {};
    completed.forEach((o) => { const m = o.settled_method || "pm-cash"; byMethod[m] = (byMethod[m] || 0) + (o.settled_total || 0); });
    const trend = [
      { l: "Mon", v: 142000 }, { l: "Tue", v: 128000 }, { l: "Wed", v: 156000 }, { l: "Thu", v: 171000 },
      { l: "Fri", v: 198000 }, { l: "Sat", v: 224000 }, { l: "Today", v: Math.max(sales, 12000), hi: true },
    ];
    const topDishes = topSelling(st).slice(0, 5);

    return e("div", { className: "page page-wide" },
      e("div", { className: "page-head" },
        e("div", null, e("h1", null, "Today at a glance"),
          e("div", { className: "sub" }, "Owner view · " + H.fmtDate("2026-05-30T21:00:00") + " · Dinner service")),
        e("div", { className: "page-head-actions" },
          e(window.Btn, { variant: "ghost", icon: "chart", onClick: () => go("reports") }, "Full reports"),
          e(window.Btn, { variant: "dark", icon: "download" }, "Export day"))),

      e("div", { className: "grid", style: { gridTemplateColumns: "repeat(5,1fr)", marginBottom: 18 } },
        e(window.Stat, { label: "Sales today", prefix: "₨", value: H.money0(sales), icon: "cash", tone: "ok", sub: completed.length + " completed orders" }),
        e(window.Stat, { label: "Open orders", value: active.length, icon: "orders", tone: "accent", sub: "In service now" }),
        e(window.Stat, { label: "Cancellations", value: cancelled.length, icon: "x", tone: "warn", sub: "Today" }),
        e(window.Stat, { label: "Low stock", value: low.length, icon: "warn", tone: "warn", sub: "Need reorder" }),
        e(window.Stat, { label: "Avg ticket", prefix: "₨", value: completed.length ? H.money0(sales / completed.length) : "0", icon: "receipt", tone: "info", sub: "Per order" })),

      e("div", { className: "grid", style: { gridTemplateColumns: "1.5fr 1fr", marginBottom: 16 } },
        e(window.Panel, { title: "This week's sales", sub: "Daily revenue · PKR" },
          e(MiniBar, { data: trend })),
        e(window.Panel, { title: "Payment mix", sub: "Today's settlements" },
          e("div", { style: { display: "grid", gap: 12 } },
            st.paymentMethods.filter((m) => m.active).map((m) => {
              const amt = byMethod[m.id] || 0;
              const pct = sales ? (amt / sales) * 100 : 0;
              return e("div", { key: m.id },
                e("div", { className: "row between", style: { marginBottom: 6 } },
                  e("span", { style: { fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" } }, m.name),
                  e("span", { className: "num", style: { fontSize: 13, fontWeight: 700 } }, H.money(amt))),
                e("div", { style: { height: 8, background: "var(--surface-3)", borderRadius: 99, overflow: "hidden" } },
                  e("div", { style: { width: pct + "%", height: "100%", background: "var(--accent)", borderRadius: 99 } })));
            }))) ),

      e("div", { className: "grid", style: { gridTemplateColumns: "1fr 1fr" } },
        e(window.Panel, { title: "Top sellers today", actions: e(window.Btn, { variant: "ghost", size: "sm", onClick: () => go("reports") }, "Reports"), pad: false },
          e("table", { className: "tbl" },
            e("tbody", null, topDishes.map((d, i) =>
              e("tr", { key: d.id },
                e("td", { style: { width: 36 } }, e("span", { style: { fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink-3)" } }, "#" + (i + 1))),
                e("td", null, e("div", { style: { fontWeight: 600 } }, d.name)),
                e("td", { className: "r num muted" }, d.qty + " sold"),
                e("td", { className: "r num", style: { fontWeight: 700 } }, H.money(d.revenue)))))) ),
        e(window.Panel, { title: "Recent activity", sub: "Audit trail", actions: e(window.Btn, { variant: "ghost", size: "sm", onClick: () => go("audit") }, "Full log"), pad: false },
          e("div", { style: { padding: "4px 0" } },
            st.audit.slice(0, 6).map((a) => {
              const actor = st.users.find((u) => u.id === a.actor);
              return e("div", { key: a.id, className: "row", style: { gap: 11, padding: "10px 20px", borderBottom: "1px solid var(--line)" } },
                e("div", { style: { width: 7, height: 7, borderRadius: 99, background: a.action === "CANCEL" || a.action === "LOGIN_FAILED" ? "var(--danger)" : "var(--accent)", flex: "0 0 auto", marginTop: 6 } }),
                e("div", { style: { flex: 1 } },
                  e("div", { style: { fontSize: 13, lineHeight: 1.4 } }, a.summary),
                  e("div", { style: { fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 } }, (actor ? actor.full_name : "System") + " · " + H.timeAgo(a.at))));
            })))));
  }

  function topSelling(st) {
    const map = {};
    st.orders.filter((o) => o.status !== "CANCELLED").forEach((o) => o.items.forEach((li) => {
      if (!map[li.dish]) map[li.dish] = { id: li.dish, name: li.name, qty: 0, revenue: 0 };
      map[li.dish].qty += li.qty; map[li.dish].revenue += li.qty * li.price;
    }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }

  function Dashboard({ go }) {
    const S = window.useStore();
    const user = S.currentUser();
    if (user.role === "SALES_MANAGER") return e(SalesDashboard, { S, user, go });
    if (user.role === "INVENTORY_MANAGER") return e(InventoryDashboard, { S, user, go });
    return e(AdminDashboard, { S, user, go });
  }

  window.DashboardScreen = Dashboard;
  window.KB_topSelling = topSelling;
})();
