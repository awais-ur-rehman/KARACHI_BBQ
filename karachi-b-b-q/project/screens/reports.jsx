/* ============================================================
   Reports & analytics
   ============================================================ */
(function () {
  const { useState } = React;
  const e = React.createElement;
  const Icon = window.Icon;
  const H = window.KBHelpers;

  function Bars({ data, fmt }) {
    const max = Math.max(...data.map((d) => d.v), 1);
    return e("div", { style: { display: "flex", alignItems: "stretch", gap: 10, height: 200, paddingTop: 10 } },
      data.map((d, i) => e("div", { key: i, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, justifyContent: "flex-end" } },
        e("div", { className: "num", style: { fontSize: 11, fontWeight: 700, color: "var(--ink-2)" } }, fmt ? fmt(d.v) : d.v),
        e("div", { style: { width: "100%", maxWidth: 46, height: (d.v / max) * 100 + "%", minHeight: 4, background: d.hi ? "var(--accent)" : "var(--char-3)", borderRadius: "6px 6px 0 0" }, title: String(d.v) }),
        e("div", { style: { fontSize: 11, color: "var(--ink-3)", fontWeight: 600 } }, d.l))));
  }

  function Reports({ go }) {
    const S = window.useStore();
    const st = S.state;
    const [range, setRange] = useState("today");

    const completed = st.orders.filter((o) => o.status === "COMPLETED");
    const sales = completed.reduce((s, o) => s + (o.settled_total || 0), 0);
    const cancelled = st.orders.filter((o) => o.status === "CANCELLED");
    const top = window.KB_topSelling(st);

    /* sales by category */
    const byCat = { GENTS_HALL: 0, FAMILY_HALL: 0, PARCEL: 0 };
    completed.forEach((o) => byCat[o.category] += o.settled_total || 0);

    /* hourly (synthetic-ish from created_at) */
    const hours = ["6pm", "7pm", "8pm", "9pm", "10pm"];
    const hourly = hours.map((l, i) => ({ l, v: [18, 42, 65, 88, 54][i] * 1000 }));
    hourly[3].hi = true;

    /* item consumption / COGS */
    const cogs = {};
    completed.forEach((o) => { const cons = H.orderConsumption(st, o); Object.entries(cons).forEach(([id, q]) => { const it = st.items.find((x) => x.id === id); if (it) cogs[id] = (cogs[id] || 0) + q * it.avg; }); });
    const totalCogs = Object.values(cogs).reduce((s, v) => s + v, 0);
    const topCogs = Object.entries(cogs).map(([id, v]) => ({ item: st.items.find((x) => x.id === id), v })).filter((x) => x.item).sort((a, b) => b.v - a.v).slice(0, 6);

    const purchasesTotal = st.purchases.reduce((s, p) => s + p.total, 0);

    return e("div", { className: "page page-wide" },
      e("div", { className: "page-head" },
        e("div", null, e("h1", null, "Reports & analytics"), e("div", { className: "sub" }, "Sales, cost of goods, and inventory movement.")),
        e("div", { className: "page-head-actions" },
          e(window.Seg, { value: range, onChange: setRange, options: [{ value: "today", label: "Today" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }] }),
          e(window.Btn, { variant: "dark", icon: "download" }, "Export CSV"))),

      e("div", { className: "grid g4", style: { marginBottom: 18 } },
        e(window.Stat, { label: "Gross sales", prefix: "₨", value: H.money0(sales), icon: "cash", tone: "ok", sub: completed.length + " orders" }),
        e(window.Stat, { label: "Cost of goods", prefix: "₨", value: H.money0(totalCogs), icon: "boxes", tone: "warn", sub: sales ? Math.round(totalCogs / sales * 100) + "% of sales" : "—" }),
        e(window.Stat, { label: "Gross profit", prefix: "₨", value: H.money0(sales - totalCogs), icon: "chart", tone: "accent", sub: sales ? Math.round((sales - totalCogs) / sales * 100) + "% margin" : "—" }),
        e(window.Stat, { label: "Cancellations", value: cancelled.length, icon: "x", tone: "warn", sub: H.money(cancelled.reduce((s, o) => s + H.calcBill(st, o).total, 0)) + " value" })),

      e("div", { className: "grid", style: { gridTemplateColumns: "1.5fr 1fr", marginBottom: 16 } },
        e(window.Panel, { title: "Sales by hour", sub: "Dinner service · PKR" }, e(Bars, { data: hourly, fmt: (v) => Math.round(v / 1000) + "k" })),
        e(window.Panel, { title: "Sales by area" },
          e("div", { style: { display: "grid", gap: 14, paddingTop: 4 } },
            Object.entries(byCat).map(([k, v]) => {
              const pct = sales ? v / sales * 100 : 0;
              return e("div", { key: k },
                e("div", { className: "row between", style: { marginBottom: 6 } },
                  e("span", { style: { fontSize: 13, fontWeight: 600 } }, H.CATEGORY_LABEL[k]),
                  e("span", { className: "num", style: { fontSize: 13, fontWeight: 700 } }, H.money(v))),
                e("div", { style: { height: 10, background: "var(--surface-3)", borderRadius: 99, overflow: "hidden" } },
                  e("div", { style: { width: pct + "%", height: "100%", background: "var(--accent)", borderRadius: 99 } })),
                e("div", { className: "muted-2", style: { fontSize: 11, marginTop: 4 } }, Math.round(pct) + "% of sales"));
            }))) ),

      e("div", { className: "grid", style: { gridTemplateColumns: "1fr 1fr" } },
        e(window.Panel, { title: "Top selling dishes", pad: false },
          e("table", { className: "tbl" },
            e("thead", null, e("tr", null, e("th", null, "Dish"), e("th", { className: "r" }, "Qty"), e("th", { className: "r" }, "Revenue"))),
            e("tbody", null, top.slice(0, 8).map((d) =>
              e("tr", { key: d.id }, e("td", null, e("span", { style: { fontWeight: 600 } }, d.name)), e("td", { className: "r num muted" }, d.qty), e("td", { className: "r num", style: { fontWeight: 700 } }, H.money(d.revenue)))))) ),
        e(window.Panel, { title: "Top ingredient cost", sub: "Consumed in completed orders", pad: false },
          e("table", { className: "tbl" },
            e("thead", null, e("tr", null, e("th", null, "Item"), e("th", { className: "r" }, "Cost"), e("th", { className: "r" }, "Share"))),
            e("tbody", null, topCogs.map((x) =>
              e("tr", { key: x.item.id }, e("td", null, e("span", { style: { fontWeight: 600 } }, x.item.name)), e("td", { className: "r num", style: { fontWeight: 700 } }, H.money(x.v)), e("td", { className: "r num muted" }, totalCogs ? Math.round(x.v / totalCogs * 100) + "%" : "—")))) ))));
  }

  window.ReportsScreen = Reports;
})();
