/* ============================================================
   Vendors + Goods Received (GRN) flow
   ============================================================ */
(function () {
  const { useState } = React;
  const e = React.createElement;
  const Icon = window.Icon;
  const H = window.KBHelpers;

  function vendorBalance(st, vid) {
    const purchased = st.purchases.filter((p) => p.vendor === vid).reduce((s, p) => s + p.total, 0);
    const paid = st.vendorPayments.filter((p) => p.vendor === vid).reduce((s, p) => s + p.amount, 0);
    return { purchased, paid, balance: purchased - paid };
  }

  /* ---------- VENDORS ---------- */
  function Vendors({ go }) {
    const S = window.useStore();
    const st = S.state;
    const [modal, setModal] = useState(null);
    const [payFor, setPayFor] = useState(null);

    const totalOwed = st.vendors.reduce((s, v) => s + Math.max(0, vendorBalance(st, v.id).balance), 0);

    return e("div", { className: "page page-wide" },
      e("div", { className: "page-head" },
        e("div", null, e("h1", null, "Vendors"), e("div", { className: "sub" }, st.vendors.length + " suppliers · " + H.money(totalOwed) + " outstanding")),
        e("div", { className: "page-head-actions" },
          e(window.Btn, { variant: "ghost", icon: "truck", onClick: () => go("grn") }, "Receive stock"),
          e(window.Btn, { variant: "primary", icon: "plus", onClick: () => setModal({ kind: "new" }) }, "New vendor"))),

      e("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px,1fr))", gap: 16 } },
        st.vendors.map((v) => {
          const bal = vendorBalance(st, v.id);
          const lastBuy = st.purchases.filter((p) => p.vendor === v.id).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          return e("div", { key: v.id, className: "card", style: { padding: 18 } },
            e("div", { className: "row between", style: { marginBottom: 12 } },
              e("div", { className: "row", style: { gap: 11 } },
                e("div", { style: { width: 42, height: 42, borderRadius: 11, background: "var(--surface-3)", display: "grid", placeItems: "center", color: "var(--ink-2)" } }, e(Icon.truck, { size: 20 })),
                e("div", null, e("div", { style: { fontWeight: 700, fontSize: 15 } }, v.name), e("div", { className: "row", style: { gap: 5, fontSize: 12, color: "var(--ink-2)", marginTop: 3 } }, e(Icon.phone, { size: 12 }), v.contact))),
              e("button", { className: "icon-btn", style: { width: 32, height: 32 }, onClick: () => setModal({ kind: "edit", editing: v }) }, e(Icon.edit, { size: 15 }))),
            v.notes && e("div", { style: { fontSize: 12.5, color: "var(--ink-2)", marginBottom: 12, lineHeight: 1.5 } }, v.notes),
            e("div", { className: "row", style: { gap: 0, background: "var(--surface-2)", borderRadius: "var(--r-md)", padding: "10px 0", marginBottom: 12 } },
              e("div", { style: { flex: 1, textAlign: "center", borderRight: "1px solid var(--line)" } }, e("div", { style: { fontSize: 11, color: "var(--ink-3)" } }, "Purchased"), e("div", { className: "num", style: { fontWeight: 700, fontSize: 14 } }, H.money(bal.purchased))),
              e("div", { style: { flex: 1, textAlign: "center" } }, e("div", { style: { fontSize: 11, color: "var(--ink-3)" } }, "Balance"), e("div", { className: "num", style: { fontWeight: 700, fontSize: 14, color: bal.balance > 0 ? "var(--warn)" : "var(--ok)" } }, H.money(bal.balance)))),
            e("div", { className: "row between" },
              e("span", { className: "muted-2", style: { fontSize: 12 } }, lastBuy ? "Last: " + H.fmtDate(lastBuy.date) : "No purchases"),
              e(window.Btn, { variant: bal.balance > 0 ? "soft" : "ghost", size: "sm", icon: "wallet", onClick: () => setPayFor(v) }, "Record payment")));
        })),

      modal && e(VendorModal, { editing: modal.editing, S, onClose: () => setModal(null) }),
      payFor && e(PaymentModal, { vendor: payFor, S, bal: vendorBalance(st, payFor.id), onClose: () => setPayFor(null) }));
  }

  function VendorModal({ editing, S, onClose }) {
    const [f, setF] = useState(editing ? { ...editing } : { name: "", contact: "", notes: "", active: true });
    const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
    function save() {
      if (!f.name.trim()) return S.toast("Enter vendor name", "warn");
      S.update((s) => {
        if (editing) s.vendors = s.vendors.map((v) => v.id === f.id ? { ...f } : v);
        else s.vendors = [...s.vendors, { ...f, id: window.KB_uid("v") }];
        return s;
      });
      S.toast(editing ? "Vendor updated" : "Vendor added", "ok"); onClose();
    }
    return e(window.Modal, { title: editing ? "Edit vendor" : "New vendor", onClose, width: 460,
      footer: e(React.Fragment, null, e(window.Btn, { variant: "ghost", onClick: onClose }, "Cancel"), e(window.Btn, { variant: "primary", icon: "save", onClick: save }, "Save")) },
      e("div", { style: { display: "grid", gap: 14 } },
        e(window.Field, { label: "Vendor name" }, e(window.Input, { value: f.name, onChange: (ev) => set("name", ev.target.value) })),
        e(window.Field, { label: "Contact number" }, e(window.Input, { value: f.contact, onChange: (ev) => set("contact", ev.target.value), placeholder: "03xx-xxxxxxx" })),
        e(window.Field, { label: "Notes" }, e(window.Textarea, { value: f.notes, onChange: (ev) => set("notes", ev.target.value), placeholder: "Delivery schedule, terms…" }))));
  }

  function PaymentModal({ vendor, S, bal, onClose }) {
    const [amount, setAmount] = useState(Math.max(0, bal.balance));
    const [note, setNote] = useState("");
    function save() {
      S.update((s) => { s.vendorPayments = [{ id: window.KB_uid("vp"), vendor: vendor.id, amount: Number(amount) || 0, at: new Date().toISOString(), note, by: S.session.userId }, ...s.vendorPayments]; return s; });
      S.audit("vendor", vendor.id, "PAYMENT", "Paid " + H.money(amount) + " to " + vendor.name);
      S.toast("Payment recorded", "ok"); onClose();
    }
    return e(window.Modal, { title: "Record payment", sub: vendor.name + " · balance " + H.money(bal.balance), onClose, width: 420,
      footer: e(React.Fragment, null, e(window.Btn, { variant: "ghost", onClick: onClose }, "Cancel"), e(window.Btn, { variant: "primary", icon: "check", onClick: save }, "Record " + H.money(amount || 0))) },
      e("div", { style: { display: "grid", gap: 14 } },
        e(window.Field, { label: "Amount (₨)" }, e(window.Input, { type: "number", value: amount, onChange: (ev) => setAmount(ev.target.value) })),
        e(window.Field, { label: "Note (optional)" }, e(window.Input, { value: note, onChange: (ev) => setNote(ev.target.value), placeholder: "e.g. weekly settlement" }))));
  }

  /* ---------- GOODS RECEIVED (GRN) ---------- */
  function GRN({ go }) {
    const S = window.useStore();
    const st = S.state;
    const [tab, setTab] = useState("history");
    const [draft, setDraft] = useState(null); // {vendor, ref, lines:[]}

    if (tab === "new" || draft) return e(GRNForm, { st, S, draft, setDraft, back: () => { setDraft(null); setTab("history"); } });

    return e("div", { className: "page page-wide" },
      e("div", { className: "page-head" },
        e("div", null, e("h1", null, "Goods received"), e("div", { className: "sub" }, "Record stock deliveries from vendors — quantities increase and average cost updates.")),
        e("div", { className: "page-head-actions" }, e(window.Btn, { variant: "primary", icon: "plus", onClick: () => setDraft({ vendor: st.vendors[0].id, ref: "", date: "2026-05-30", lines: [] }) }, "New receipt"))),

      e("div", { className: "tbl-wrap" },
        e("table", { className: "tbl" },
          e("thead", null, e("tr", null, e("th", null, "Date"), e("th", null, "Vendor"), e("th", null, "Reference"), e("th", { className: "r" }, "Items"), e("th", null, "Received by"), e("th", { className: "r" }, "Total"))),
          e("tbody", null, st.purchases.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).map((p) => {
            const v = st.vendors.find((x) => x.id === p.vendor); const by = st.users.find((u) => u.id === p.by);
            return e("tr", { key: p.id },
              e("td", null, e("div", { style: { fontWeight: 600 } }, H.fmtDate(p.date))),
              e("td", null, v.name),
              e("td", { className: "muted num" }, p.ref || "—"),
              e("td", { className: "r num" }, p.lines.length),
              e("td", { className: "muted" }, by ? by.full_name : "—"),
              e("td", { className: "r num", style: { fontWeight: 700 } }, H.money(p.total)));
          })))));
  }

  function GRNForm({ st, S, draft, setDraft, back }) {
    const [f, setF] = useState(draft || { vendor: st.vendors[0].id, ref: "", date: "2026-05-30", lines: [] });
    const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
    const [addItem, setAddItem] = useState(st.items[0].id);

    function addLine() {
      const it = st.items.find((i) => i.id === addItem);
      if (f.lines.some((l) => l.item === addItem)) return;
      set("lines", [...f.lines, { item: addItem, qty: 1, unit: it.unit, cost: it.avg }]);
    }
    const total = f.lines.reduce((s, l) => s + l.qty * l.cost, 0);

    function post() {
      if (!f.lines.length) return S.toast("Add at least one item", "warn");
      S.update((s) => {
        // update items: qty + new avg cost (weighted)
        s.items = s.items.map((it) => {
          const lns = f.lines.filter((l) => l.item === it.id);
          if (!lns.length) return it;
          let qty = it.qty, val = it.qty * it.avg;
          lns.forEach((l) => { const sq = H.toStockUnits(s, it.id, l.qty, l.unit); qty += sq; val += sq * l.cost; });
          return { ...it, qty: Math.round(qty * 1000) / 1000, avg: Math.round(val / Math.max(qty, 0.001)) };
        });
        s.purchases = [{ id: window.KB_uid("p"), vendor: f.vendor, date: f.date, ref: f.ref || "—", total, by: S.session.userId, lines: f.lines.map((l) => ({ ...l })) }, ...s.purchases];
        return s;
      });
      const v = st.vendors.find((x) => x.id === f.vendor);
      S.audit("purchase", "new", "RECEIPT", "Stock received from " + v.name + " — " + H.money(total));
      S.toast("Stock received · " + H.money(total) + " added", "ok");
      back();
    }

    return e("div", { className: "page", style: { maxWidth: 860 } },
      e("div", { className: "row", style: { gap: 12, marginBottom: 18 } },
        e("button", { className: "icon-btn", onClick: back }, e(Icon.chevL, { size: 18 })),
        e("div", { style: { flex: 1 } }, e("h1", { style: { fontSize: 23 } }, "New goods receipt"), e("div", { className: "sub", style: { color: "var(--ink-2)", fontSize: 13, marginTop: 2 } }, "Stock will increase and average cost will recalculate.")),
        e(window.Btn, { variant: "ghost", onClick: back }, "Cancel"),
        e(window.Btn, { variant: "primary", icon: "check", onClick: post }, "Post receipt")),

      e(window.Panel, { style: { marginBottom: 16 } },
        e("div", { className: "grid g3" },
          e(window.Field, { label: "Vendor" }, e(window.Select, { value: f.vendor, onChange: (ev) => set("vendor", ev.target.value) }, st.vendors.map((v) => e("option", { key: v.id, value: v.id }, v.name)))),
          e(window.Field, { label: "Invoice / reference" }, e(window.Input, { value: f.ref, onChange: (ev) => set("ref", ev.target.value), placeholder: "INV-0000" })),
          e(window.Field, { label: "Date" }, e(window.Input, { type: "date", value: f.date, onChange: (ev) => set("date", ev.target.value) })))),

      e(window.Panel, { title: "Items received", actions: e("div", { className: "row", style: { gap: 6 } },
        e(window.Select, { value: addItem, onChange: (ev) => setAddItem(ev.target.value), style: { width: 200, padding: "7px 10px", fontSize: 13 } }, st.items.map((i) => e("option", { key: i.id, value: i.id }, i.name))),
        e(window.Btn, { variant: "soft", size: "sm", icon: "plus", onClick: addLine }, "Add item")), pad: false },
        f.lines.length === 0 ? e(window.Empty, { icon: "truck", title: "No items yet", children: "Choose items above to add them to this delivery." }) :
        e("table", { className: "tbl" },
          e("thead", null, e("tr", null, e("th", null, "Item"), e("th", { className: "r" }, "Qty"), e("th", null, "Unit"), e("th", { className: "r" }, "Unit cost (₨)"), e("th", { className: "r" }, "Line total"), e("th", null, ""))),
          e("tbody", null, f.lines.map((l, idx) => {
            const it = st.items.find((i) => i.id === l.item);
            return e("tr", { key: l.item },
              e("td", null, e("span", { style: { fontWeight: 600 } }, it.name)),
              e("td", { className: "r" }, e("input", { className: "input num", type: "number", value: l.qty, onChange: (ev) => set("lines", f.lines.map((x, i) => i === idx ? { ...x, qty: Number(ev.target.value) || 0 } : x)), style: { width: 76, padding: "6px 8px", textAlign: "right" } })),
              e("td", null, e("select", { className: "select", value: l.unit, onChange: (ev) => set("lines", f.lines.map((x, i) => i === idx ? { ...x, unit: ev.target.value } : x)), style: { width: 80, padding: "6px 8px", fontSize: 13 } }, st.units.map((u) => e("option", { key: u.id, value: u.id }, u.name)))),
              e("td", { className: "r" }, e("input", { className: "input num", type: "number", value: l.cost, onChange: (ev) => set("lines", f.lines.map((x, i) => i === idx ? { ...x, cost: Number(ev.target.value) || 0 } : x)), style: { width: 96, padding: "6px 8px", textAlign: "right" } })),
              e("td", { className: "r num", style: { fontWeight: 700 } }, H.money(l.qty * l.cost)),
              e("td", { className: "r" }, e("button", { className: "icon-btn", style: { width: 30, height: 30 }, onClick: () => set("lines", f.lines.filter((_, i) => i !== idx)) }, e(Icon.trash, { size: 14 }))));
          }),
          e("tr", null, e("td", { colSpan: 4, className: "r", style: { fontWeight: 700, fontSize: 14 } }, "Total"), e("td", { className: "r num", style: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--accent-700)" } }, H.money(total)), e("td"))))));
  }

  window.VendorsScreen = Vendors;
  window.GRNScreen = GRN;
})();
