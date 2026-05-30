/* ============================================================
   Orders — live board + filterable history
   ============================================================ */
(function () {
  const { useState } = React;
  const e = React.createElement;
  const Icon = window.Icon;
  const H = window.KBHelpers;

  const STATUSES = ["ALL", "DRAFT", "PRINTED", "DELIVERED", "COMPLETED", "CANCELLED"];

  function Orders({ go }) {
    const S = window.useStore();
    const st = S.state;
    const [status, setStatus] = useState("ALL");
    const [cat, setCat] = useState("ALL");
    const [q, setQ] = useState("");

    let rows = [...st.orders];
    if (status !== "ALL") rows = rows.filter((o) => o.status === status);
    if (cat !== "ALL") rows = rows.filter((o) => o.category === cat);
    if (q) rows = rows.filter((o) => o.number.toLowerCase().includes(q.toLowerCase()) || o.items.some((li) => li.name.toLowerCase().includes(q.toLowerCase())));
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const counts = {};
    STATUSES.forEach((s) => counts[s] = s === "ALL" ? st.orders.length : st.orders.filter((o) => o.status === s).length);

    const openTotal = st.orders.filter((o) => ["PRINTED", "DELIVERED"].includes(o.status)).reduce((s, o) => s + H.calcBill(st, o).total, 0);

    return e("div", { className: "page page-wide" },
      e("div", { className: "page-head" },
        e("div", null, e("h1", null, "Orders"), e("div", { className: "sub" }, st.orders.filter((o) => ["DRAFT","PRINTED","DELIVERED"].includes(o.status)).length + " open · " + H.money(openTotal) + " awaiting settlement")),
        e("div", { className: "page-head-actions" },
          e(window.Btn, { variant: "primary", icon: "plus", onClick: () => go("counter") }, "New Order"))),

      e("div", { className: "row between", style: { marginBottom: 16, gap: 12, flexWrap: "wrap" } },
        e("div", { className: "row", style: { gap: 8, flexWrap: "wrap" } },
          STATUSES.map((s) =>
            e("button", { key: s, onClick: () => setStatus(s), className: "row", style: { gap: 7, padding: "8px 13px", borderRadius: 99, border: "1px solid " + (status === s ? "var(--char)" : "var(--line)"), background: status === s ? "var(--char)" : "var(--surface)", color: status === s ? "var(--char-ink)" : "var(--ink-2)", fontWeight: 700, fontSize: 13, cursor: "pointer" } },
              s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase(),
              e("span", { className: "num", style: { opacity: .7 } }, counts[s])))),
        e("div", { className: "row", style: { gap: 10 } },
          e(window.Select, { value: cat, onChange: (ev) => setCat(ev.target.value), style: { width: 150 } },
            e("option", { value: "ALL" }, "All areas"),
            e("option", { value: "GENTS_HALL" }, "Gents Hall"),
            e("option", { value: "FAMILY_HALL" }, "Family Hall"),
            e("option", { value: "PARCEL" }, "Parcel")),
          e("div", { className: "input-icon", style: { width: 220 } }, e(Icon.search, { size: 16 }), e("input", { className: "input", placeholder: "Search order or dish…", value: q, onChange: (ev) => setQ(ev.target.value) })))),

      e("div", { className: "tbl-wrap" },
        rows.length === 0 ? e(window.Empty, { icon: "orders", title: "No orders match", children: "Try clearing the filters." }) :
        e("table", { className: "tbl" },
          e("thead", null, e("tr", null,
            e("th", null, "Order"), e("th", null, "Area"), e("th", null, "Items"),
            e("th", null, "Cashier"), e("th", null, "Time"), e("th", { className: "r" }, "Total"),
            e("th", null, "Status"), e("th", null, ""))),
          e("tbody", null, rows.map((o) => {
            const cashier = st.users.find((u) => u.id === o.created_by);
            const bill = H.calcBill(st, o);
            return e("tr", { key: o.id, className: "clickable", onClick: () => go("order", { id: o.id }) },
              e("td", null, e("div", { style: { fontWeight: 700, fontVariantNumeric: "tabular-nums" } }, o.category === "PARCEL" ? "Parcel #" + o.parcel : (o.category === "GENTS_HALL" ? "Gents T" : "Family T") + o.table), e("div", { style: { fontSize: 11.5, color: "var(--ink-3)" } }, "#" + o.number)),
              e("td", null, e("span", { className: "pill" }, H.CATEGORY_LABEL[o.category])),
              e("td", { className: "muted", style: { maxWidth: 230 } }, e("span", { style: { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, o.items.map((li) => li.qty + "× " + li.name).join(", "))),
              e("td", null, cashier ? e("div", { className: "row", style: { gap: 8 } }, e(window.Avatar, { user: cashier, size: 26 }), e("span", { style: { fontSize: 13 } }, cashier.full_name.split(" ")[0])) : "—"),
              e("td", { className: "muted", style: { fontSize: 13 } }, H.fmtTime(o.created_at)),
              e("td", { className: "r num", style: { fontWeight: 700 } }, H.money(o.settled_total || bill.total)),
              e("td", null, e(window.StatusBadge, { status: o.status })),
              e("td", { className: "r" }, e(Icon.chevR, { size: 16, style: { color: "var(--ink-3)" } })));
          })))));
  }

  window.OrdersScreen = Orders;
})();
