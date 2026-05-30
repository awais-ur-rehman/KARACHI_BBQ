/* ============================================================
   Order detail + Bill/KOT preview + Settle + Cancel
   ============================================================ */
(function () {
  const { useState } = React;
  const e = React.createElement;
  const Icon = window.Icon;
  const H = window.KBHelpers;

  /* ---- Thermal receipt (80mm) ---- */
  function Receipt({ order, st, mode }) {
    const bill = H.calcBill(st, order, { method: order.settled_method });
    const cashier = st.users.find((u) => u.id === order.created_by);
    const rows = order.items;
    const isKOT = mode === "kot";
    return e("div", { style: { width: 300, margin: "0 auto", background: "#fff", color: "#1a1a1a", fontFamily: "'Courier New', monospace", fontSize: 12.5, lineHeight: 1.5, padding: "20px 18px", boxShadow: "var(--sh-md)", borderRadius: 4 } },
      e("div", { style: { textAlign: "center", borderBottom: "1px dashed #999", paddingBottom: 10, marginBottom: 10 } },
        isKOT
          ? e("div", { style: { fontWeight: 700, fontSize: 16, letterSpacing: 1 } }, "*** KITCHEN ***")
          : e(React.Fragment, null,
              e("div", { style: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: .5 } }, st.settings.restaurant_name),
              e("div", { style: { fontSize: 10.5, marginTop: 3 } }, st.settings.address),
              e("div", { style: { fontSize: 10.5 } }, "Tel: " + st.settings.phone + " · " + st.settings.tax_number))),
      e("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11 } },
        e("span", null, order.category === "PARCEL" ? "Parcel #" + order.parcel : H.CATEGORY_LABEL[order.category] + " · T" + order.table),
        e("span", null, isKOT ? "KOT" : "BILL")),
      e("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 } },
        e("span", null, "#" + order.number),
        e("span", null, H.fmtTime(order.created_at))),
      !isKOT && e("div", { style: { fontSize: 11 } }, "Cashier: " + (cashier ? cashier.full_name : "—")),
      e("div", { style: { borderTop: "1px dashed #999", borderBottom: "1px dashed #999", margin: "10px 0", padding: "8px 0" } },
        rows.map((li) =>
          e("div", { key: li.id, style: { marginBottom: 6 } },
            e("div", { style: { display: "flex", justifyContent: "space-between" } },
              e("span", null, li.qty + "× " + li.name),
              !isKOT && e("span", null, H.money0(li.price * li.qty))),
            li.note && e("div", { style: { fontSize: 10.5, fontStyle: "italic", color: "#b23121", paddingLeft: 14 } }, "» " + li.note)))),
      isKOT
        ? e("div", { style: { textAlign: "center", fontSize: 11, marginTop: 6 } }, "Total items: " + rows.reduce((s, li) => s + li.qty, 0))
        : e(React.Fragment, null,
            e("div", { style: { display: "flex", justifyContent: "space-between" } }, e("span", null, "Subtotal"), e("span", null, H.money0(bill.subtotal))),
            bill.discount > 0 && e("div", { style: { display: "flex", justifyContent: "space-between" } }, e("span", null, "Discount"), e("span", null, "-" + H.money0(bill.discount))),
            bill.charges.map((c) => e("div", { key: c.id, style: { display: "flex", justifyContent: "space-between" } }, e("span", null, c.name + " " + c.pct + "%"), e("span", null, H.money0(c.amount)))),
            e("div", { style: { display: "flex", justifyContent: "space-between", borderTop: "1px solid #333", marginTop: 8, paddingTop: 8, fontWeight: 700, fontSize: 15 } }, e("span", null, "TOTAL"), e("span", null, "Rs " + H.money0(bill.total))),
            order.settled_method && e("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11 } }, e("span", null, "Paid via"), e("span", null, (st.paymentMethods.find((m) => m.id === order.settled_method) || {}).name)),
            e("div", { style: { textAlign: "center", fontSize: 11, marginTop: 14, borderTop: "1px dashed #999", paddingTop: 10 } }, "Shukriya! Visit again", e("br"), "Karachi B.B.Q · Since 1998")));
  }

  /* ---- Settle modal ---- */
  function SettleModal({ order, st, S, onClose, onDone }) {
    const [method, setMethod] = useState(order.settled_method || "pm-cash");
    const [discount, setDiscount] = useState(order.discount || 0);
    const bill = H.calcBill(st, order, { method, discount });
    return e(window.Modal, { title: "Settle payment", sub: "#" + order.number, onClose, width: 460,
      footer: e(React.Fragment, null,
        e(window.Btn, { variant: "ghost", onClick: onClose }, "Cancel"),
        e(window.Btn, { variant: "primary", icon: "check", onClick: () => { window.KBOrders.settle(S, order.id, method, bill); S.toast("Payment recorded · " + H.money(bill.total), "ok"); onDone(); } }, "Confirm " + H.money(bill.total))) },
      e(window.Field, { label: "Payment method", style: { marginBottom: 16 } },
        e("div", { style: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 } },
          st.paymentMethods.filter((m) => m.active).map((m) =>
            e("button", { key: m.id, onClick: () => setMethod(m.id), className: "row", style: { gap: 9, justifyContent: "center", padding: "11px", borderRadius: "var(--r-sm)", border: "1.5px solid " + (method === m.id ? "var(--accent)" : "var(--line-strong)"), background: method === m.id ? "var(--accent-soft)" : "var(--surface)", color: method === m.id ? "var(--accent-700)" : "var(--ink)", fontWeight: 700, fontSize: 13.5, cursor: "pointer" } },
              e(Icon[m.id === "pm-cash" ? "cash" : m.id === "pm-card" ? "card" : "wallet"], { size: 16 }), m.name)))),
      e(window.Field, { label: "Discount (₨)", hint: "Applied before taxes & charges.", style: { marginBottom: 18 } },
        e(window.Input, { type: "number", min: 0, value: discount, onChange: (ev) => setDiscount(Math.max(0, Number(ev.target.value) || 0)) })),
      e("div", { style: { background: "var(--surface-2)", borderRadius: "var(--r-md)", padding: "14px 16px" } },
        e("div", { className: "row between", style: { marginBottom: 6 } }, e("span", { className: "muted", style: { fontSize: 13 } }, "Subtotal"), e("span", { className: "num" }, H.money(bill.subtotal))),
        discount > 0 && e("div", { className: "row between", style: { marginBottom: 6 } }, e("span", { className: "muted", style: { fontSize: 13 } }, "Discount"), e("span", { className: "num", style: { color: "var(--danger)" } }, "-" + H.money(discount))),
        bill.charges.map((c) => e("div", { key: c.id, className: "row between", style: { marginBottom: 6 } }, e("span", { className: "muted", style: { fontSize: 13 } }, c.name + " (" + c.pct + "%)"), e("span", { className: "num" }, H.money(c.amount)))),
        e("div", { className: "row between", style: { paddingTop: 10, marginTop: 4, borderTop: "1px dashed var(--line-strong)" } },
          e("span", { style: { fontWeight: 700, fontSize: 15 } }, "Total due"),
          e("span", { className: "num", style: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--accent-700)" } }, H.money(bill.total)))),
      e("div", { className: "muted-2", style: { fontSize: 12, marginTop: 12 } }, "Cash GST is 16%; card / digital is 5%. Total updates with the method."));
  }

  /* ---- Cancel modal ---- */
  function CancelModal({ order, st, S, onClose, onDone }) {
    const user = S.currentUser();
    const locked = ["PRINTED", "DELIVERED"].includes(order.status);
    const [reason, setReason] = useState("");
    const [restock, setRestock] = useState(true);
    const canCancel = user.role === "SUPER_ADMIN" || order.status === "DRAFT";
    return e(window.Modal, { title: "Cancel order", sub: "#" + order.number, onClose, width: 460,
      footer: e(React.Fragment, null,
        e(window.Btn, { variant: "ghost", onClick: onClose }, "Keep order"),
        e(window.Btn, { variant: "danger", icon: "x", disabled: !canCancel || !reason.trim(), onClick: () => { window.KBOrders.cancel(S, order.id, reason, locked && restock); S.toast("Order cancelled", "warn"); onDone(); } }, "Cancel order")) },
      !canCancel && e("div", { className: "locked-banner", style: { marginBottom: 16 } }, e(Icon.lock, { size: 17 }), "Only a Super Admin can cancel a printed order."),
      e(window.Field, { label: "Reason for cancellation", style: { marginBottom: 16 } },
        e(window.Textarea, { value: reason, onChange: (ev) => setReason(ev.target.value), placeholder: "e.g. customer left, duplicate order, kitchen error…" })),
      locked && e("label", { className: "row between", style: { background: "var(--surface-2)", padding: "12px 14px", borderRadius: "var(--r-md)", cursor: "pointer" } },
        e("div", null,
          e("div", { style: { fontWeight: 700, fontSize: 13.5 } }, "Return ingredients to stock"),
          e("div", { style: { fontSize: 12, color: "var(--ink-2)", marginTop: 2 } }, "Reverses the deduction made at print time.")),
        e(window.Switch, { on: restock, onClick: () => setRestock(!restock) })));
  }

  function Timeline({ order, st }) {
    const steps = [
      { k: "created_at", label: "Order created", icon: "plus" },
      { k: "printed_at", label: "Bill printed · stock deducted", icon: "print" },
      { k: "delivered_at", label: "Delivered to table", icon: "check" },
      { k: "completed_at", label: "Payment settled", icon: "cash" },
    ];
    if (order.status === "CANCELLED") steps.push({ k: "cancelled_at", label: "Cancelled", icon: "x", danger: true });
    return e("div", { style: { display: "flex", flexDirection: "column", gap: 0 } },
      steps.filter((s) => order[s.k]).map((s, i, arr) =>
        e("div", { key: s.k, className: "row", style: { gap: 12, alignItems: "flex-start" } },
          e("div", { style: { display: "flex", flexDirection: "column", alignItems: "center" } },
            e("div", { style: { width: 28, height: 28, borderRadius: 99, background: s.danger ? "var(--st-cancelled-bg)" : "var(--accent-soft)", color: s.danger ? "var(--danger)" : "var(--accent-700)", display: "grid", placeItems: "center", flex: "0 0 auto" } }, e(Icon[s.icon], { size: 14 })),
            i < arr.length - 1 && e("div", { style: { width: 2, flex: 1, minHeight: 22, background: "var(--line)" } })),
          e("div", { style: { paddingBottom: 18, paddingTop: 3 } },
            e("div", { style: { fontWeight: 600, fontSize: 13.5 } }, s.label),
            e("div", { style: { fontSize: 12, color: "var(--ink-3)", marginTop: 1 } }, H.fmtTime(order[s.k]))))));
  }

  function OrderDetail({ route, go }) {
    const S = window.useStore();
    const st = S.state;
    const user = S.currentUser();
    const order = st.orders.find((o) => o.id === route.params.id);
    const [mode, setMode] = useState("bill");
    const [settle, setSettle] = useState(route.params.settle || false);
    const [cancel, setCancel] = useState(false);
    const justPrinted = route.name === "bill";

    if (!order) return e("div", { className: "page" }, e(window.Empty, { icon: "orders", title: "Order not found", action: e(window.Btn, { variant: "ghost", onClick: () => go("orders") }, "Back to orders") }));

    const bill = H.calcBill(st, order, { method: order.settled_method });
    const cashier = st.users.find((u) => u.id === order.created_by);
    const locked = order.status !== "DRAFT";

    return e("div", { className: "page page-wide" },
      e("div", { className: "row", style: { gap: 12, marginBottom: 18 } },
        e("button", { className: "icon-btn", onClick: () => go(justPrinted ? "counter" : "orders") }, e(Icon.chevL, { size: 18 })),
        e("div", { style: { flex: 1 } },
          e("div", { className: "row", style: { gap: 10 } },
            e("h1", { style: { fontSize: 24, whiteSpace: "nowrap" } }, order.category === "PARCEL" ? "Parcel #" + order.parcel : H.CATEGORY_LABEL[order.category] + " · Table " + order.table),
            e(window.StatusBadge, { status: order.status })),
          e("div", { className: "sub", style: { color: "var(--ink-2)", fontSize: 13, marginTop: 3 } }, "#" + order.number + " · " + (cashier ? cashier.full_name : "") + " · " + H.fmtDateTime(order.created_at))),
        e("div", { className: "row" },
          order.status === "DRAFT" && e(window.Btn, { variant: "ghost", icon: "edit", onClick: () => go("counter", { id: order.id }) }, "Edit"),
          order.status !== "CANCELLED" && order.status !== "COMPLETED" && e(window.Btn, { variant: "danger-ghost", icon: "x", onClick: () => setCancel(true) }, "Cancel"),
          order.status === "DRAFT" && e(window.Btn, { variant: "primary", icon: "print", onClick: () => { window.KBOrders.printBill(S, order.id); S.toast("Bill printed · stock deducted", "ok"); } }, "Print bill"),
          order.status === "PRINTED" && e(window.Btn, { variant: "ghost", icon: "check", onClick: () => { window.KBOrders.markDelivered(S, order.id); S.toast("Marked delivered", "ok"); } }, "Mark delivered"),
          (order.status === "PRINTED" || order.status === "DELIVERED") && e(window.Btn, { variant: "primary", icon: "cash", onClick: () => setSettle(true) }, "Settle payment"),
          order.status === "COMPLETED" && e(window.Btn, { variant: "ghost", icon: "print" }, "Reprint"))),

      justPrinted && e("div", { className: "locked-banner", style: { marginBottom: 16, background: "var(--st-completed-bg)", borderColor: "#bfe0c4", color: "var(--ok)" } },
        e(Icon.check, { size: 17 }), "Bill printed and order locked. Ingredients have been deducted from stock. Settle payment when the customer is ready."),

      e("div", { className: "grid", style: { gridTemplateColumns: "1.5fr 1fr", alignItems: "start" } },
        e("div", { style: { display: "grid", gap: 16 } },
          e(window.Panel, { title: "Items", sub: order.items.reduce((s, li) => s + li.qty, 0) + " items", pad: false },
            e("table", { className: "tbl" },
              e("thead", null, e("tr", null, e("th", null, "Dish"), e("th", { className: "r" }, "Qty"), e("th", { className: "r" }, "Price"), e("th", { className: "r" }, "Amount"))),
              e("tbody", null, order.items.map((li) =>
                e("tr", { key: li.id },
                  e("td", null, e("div", { style: { fontWeight: 600 } }, li.name), li.note && e("div", { style: { fontSize: 12, color: "var(--accent-700)", fontStyle: "italic", marginTop: 2 } }, "» " + li.note)),
                  e("td", { className: "r num" }, li.qty),
                  e("td", { className: "r num muted" }, H.money(li.price)),
                  e("td", { className: "r num", style: { fontWeight: 700 } }, H.money(li.price * li.qty)))))) ),
          e("div", { className: "grid g2" },
            e(window.Panel, { title: "Bill summary" },
              e("div", { style: { display: "grid", gap: 8 } },
                e("div", { className: "row between" }, e("span", { className: "muted", style: { fontSize: 13 } }, "Subtotal"), e("span", { className: "num" }, H.money(bill.subtotal))),
                bill.discount > 0 && e("div", { className: "row between" }, e("span", { className: "muted", style: { fontSize: 13 } }, "Discount"), e("span", { className: "num", style: { color: "var(--danger)" } }, "-" + H.money(bill.discount))),
                bill.charges.map((c) => e("div", { key: c.id, className: "row between" }, e("span", { className: "muted", style: { fontSize: 13 } }, c.name + " (" + c.pct + "%)"), e("span", { className: "num" }, H.money(c.amount)))),
                e("div", { className: "row between", style: { paddingTop: 10, marginTop: 2, borderTop: "1px dashed var(--line-strong)" } }, e("span", { style: { fontWeight: 700 } }, "Total"), e("span", { className: "num", style: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--accent-700)" } }, H.money(bill.total))))),
            e(window.Panel, { title: "Timeline" }, e(Timeline, { order, st })))),

        /* Receipt preview */
        e("div", { style: { position: "sticky", top: 0 } },
          e("div", { className: "row between", style: { marginBottom: 12 } },
            e(window.Seg, { value: mode, onChange: setMode, options: [{ value: "bill", label: "Customer Bill" }, { value: "kot", label: "Kitchen (KOT)" }] }),
            e(window.Btn, { variant: "dark", size: "sm", icon: "print", onClick: () => S.toast("Sent to thermal printer", "ok") }, "Print")),
          e("div", { style: { background: "var(--surface-3)", borderRadius: "var(--r-lg)", padding: "24px 0", border: "1px solid var(--line)" } },
            e(Receipt, { order, st, mode })))),

      settle && e(SettleModal, { order, st, S, onClose: () => setSettle(false), onDone: () => { setSettle(false); } }),
      cancel && e(CancelModal, { order, st, S, onClose: () => setCancel(false), onDone: () => { setCancel(false); go("orders"); } }));
  }

  window.OrderDetailScreen = OrderDetail;
})();
