/* ============================================================
   Counter — order workspace. Build / edit a DRAFT order.
   Left: menu grid. Right: cart.
   ============================================================ */
(function () {
  const { useState, useMemo } = React;
  const e = React.createElement;
  const Icon = window.Icon;
  const H = window.KBHelpers;

  /* ---- Start picker ---- */
  function StartPicker({ onStart }) {
    const S = window.useStore();
    const [cat, setCat] = useState(null);
    const [table, setTable] = useState("");
    const occupied = useMemo(() => {
      const m = {};
      S.state.orders.filter((o) => ["DRAFT", "PRINTED", "DELIVERED"].includes(o.status) && o.table)
        .forEach((o) => { m[o.category + "-" + o.table] = o; });
      return m;
    }, [S.state.orders]);

    const cards = [
      { id: "GENTS_HALL", label: "Gents Hall", icon: "counter", desc: "Dine-in · 14 tables", letter: "G" },
      { id: "FAMILY_HALL", label: "Family Hall", icon: "users", desc: "Dine-in · 10 tables", letter: "F" },
      { id: "PARCEL", label: "Parcel", icon: "box", desc: "Takeaway · auto #" + (S.state.nextParcel || 234), letter: "P" },
    ];

    function start() {
      if (cat === "PARCEL") return onStart({ category: "PARCEL", parcel: S.state.nextParcel || 234, items: [] });
      if (!table) return;
      onStart({ category: cat, table: Number(table), items: [] });
    }
    const tableCount = cat === "GENTS_HALL" ? 14 : 10;

    return e("div", { className: "page", style: { maxWidth: 860 } },
      e("div", { className: "page-head" }, e("div", null, e("h1", null, "New order"), e("div", { className: "sub" }, "Choose where this order is for."))),
      e("div", { className: "grid g3", style: { marginBottom: 26 } },
        cards.map((c) =>
          e("button", { key: c.id, onClick: () => { setCat(c.id); setTable(""); }, style: { textAlign: "left", border: "2px solid " + (cat === c.id ? "var(--accent)" : "var(--line)"), background: cat === c.id ? "var(--accent-soft)" : "var(--surface)", borderRadius: "var(--r-lg)", padding: 22, cursor: "pointer", transition: ".14s" } },
            e("div", { style: { width: 48, height: 48, borderRadius: 12, background: cat === c.id ? "var(--accent)" : "var(--surface-3)", color: cat === c.id ? "#fff" : "var(--ink-2)", display: "grid", placeItems: "center", marginBottom: 14 } }, e(Icon[c.icon], { size: 24 })),
            e("div", { style: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 } }, c.label),
            e("div", { style: { fontSize: 13, color: "var(--ink-2)", marginTop: 4 } }, c.desc)))),

      cat && cat !== "PARCEL" && e("div", { style: { marginBottom: 26 } },
        e("div", { className: "section-title" }, "Select table"),
        e("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 } },
          Array.from({ length: tableCount }, (_, i) => i + 1).map((n) => {
            const occ = occupied[cat + "-" + n];
            return e("button", { key: n, disabled: !!occ, onClick: () => setTable(String(n)),
              style: { aspectRatio: "1", borderRadius: 12, border: "1.5px solid " + (Number(table) === n ? "var(--accent)" : occ ? "var(--line)" : "var(--line-strong)"), background: Number(table) === n ? "var(--accent)" : occ ? "var(--surface-3)" : "var(--surface)", color: Number(table) === n ? "#fff" : occ ? "var(--ink-3)" : "var(--ink)", cursor: occ ? "not-allowed" : "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, position: "relative", display: "grid", placeItems: "center" } },
              n,
              occ && e("span", { style: { position: "absolute", bottom: 6, fontSize: 8.5, fontWeight: 700, letterSpacing: ".04em", color: "var(--st-printed)" } }, "BUSY"));
          })),
        e("div", { className: "muted-2", style: { fontSize: 12, marginTop: 10 } }, "Greyed tables already have an open order.")),

      cat && e(window.Btn, { variant: "primary", size: "lg", disabled: cat !== "PARCEL" && !table, onClick: start, iconRight: "chevR" },
        cat === "PARCEL" ? "Start parcel order" : table ? "Start order · Table " + table : "Select a table"));
  }

  /* ---- Dish card ---- */
  function DishCard({ dish, onAdd, inCart }) {
    const out = !dish.available;
    return e("button", { onClick: () => !out && onAdd(dish), disabled: out,
      style: { position: "relative", textAlign: "left", border: "1px solid " + (inCart ? "var(--accent)" : "var(--line)"), background: out ? "var(--surface-3)" : "var(--surface)", borderRadius: "var(--r-md)", padding: "13px 14px", cursor: out ? "not-allowed" : "pointer", opacity: out ? .65 : 1, transition: ".12s", boxShadow: inCart ? "0 0 0 3px var(--accent-soft)" : "none" } },
      e("div", { style: { fontWeight: 700, fontSize: 13.5, lineHeight: 1.25, minHeight: 34 } }, dish.name),
      e("div", { className: "row between", style: { marginTop: 8 } },
        e("span", { className: "num", style: { fontWeight: 700, fontSize: 14, color: out ? "var(--ink-3)" : "var(--accent-700)" } }, H.money(dish.price)),
        out ? e("span", { className: "badge b-cancelled", style: { fontSize: 10.5 } }, "Sold out")
            : inCart ? e("span", { style: { width: 22, height: 22, borderRadius: 99, background: "var(--accent)", color: "#fff", display: "grid", placeItems: "center" } }, e(Icon.check, { size: 14 }))
            : e("span", { style: { width: 22, height: 22, borderRadius: 99, background: "var(--accent-soft)", color: "var(--accent-700)", display: "grid", placeItems: "center" } }, e(Icon.plus, { size: 14 }))));
  }

  /* ---- Workspace ---- */
  function Workspace({ draft, setDraft, go }) {
    const S = window.useStore();
    const st = S.state;
    const [tab, setTab] = useState(st.menuCategories[0].id);
    const [q, setQ] = useState("");
    const [noteFor, setNoteFor] = useState(null);

    const dishes = st.dishes.filter((d) => {
      if (q) return d.name.toLowerCase().includes(q.toLowerCase());
      return d.cat === tab;
    });
    const cartMap = {};
    draft.items.forEach((li) => (cartMap[li.dish] = li));

    function addDish(dish) {
      setDraft((d) => {
        const ex = d.items.find((li) => li.dish === dish.id && !li.note);
        if (ex) return { ...d, items: d.items.map((li) => li === ex ? { ...li, qty: li.qty + 1 } : li) };
        return { ...d, items: [...d.items, { id: window.KB_uid("oi"), dish: dish.id, name: dish.name, qty: 1, price: dish.price, note: null }] };
      });
    }
    function setQty(lineId, qty) {
      setDraft((d) => qty <= 0 ? { ...d, items: d.items.filter((li) => li.id !== lineId) } : { ...d, items: d.items.map((li) => li.id === lineId ? { ...li, qty } : li) });
    }
    function setNote(lineId, note) {
      setDraft((d) => ({ ...d, items: d.items.map((li) => li.id === lineId ? { ...li, note: note || null } : li) }));
    }

    const bill = H.calcBill(st, { ...draft, items: draft.items }, { discount: draft.discount });
    const empty = draft.items.length === 0;

    function doSaveDraft() {
      const id = window.KBOrders.saveDraft(S, draft);
      S.toast("Draft saved · " + (draft.number || ""), "ok");
      go("orders");
    }
    function doPrint() {
      const id = window.KBOrders.saveDraft(S, draft);
      window.KBOrders.printBill(S, id);
      S.toast("Bill printed · stock deducted", "ok");
      go("bill", { id });
    }

    return e("div", { style: { display: "grid", gridTemplateColumns: "1fr 384px", height: "100%", overflow: "hidden" } },
      /* Menu side */
      e("div", { style: { display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--line)" } },
        e("div", { style: { padding: "16px 24px 0", flex: "0 0 auto" } },
          e("div", { className: "row between", style: { marginBottom: 14 } },
            e("div", { className: "input-icon", style: { width: 280 } }, e(Icon.search, { size: 16 }), e("input", { className: "input", placeholder: "Search dishes…", value: q, onChange: (ev) => setQ(ev.target.value) })),
            e("div", { className: "pill" }, e(Icon.menu, { size: 14 }), st.dishes.filter((d) => d.available).length + " available")),
          !q && e("div", { className: "tabs", style: { gap: 2 } },
            st.menuCategories.filter((c) => c.active).sort((a, b) => a.sort - b.sort).map((c) =>
              e("button", { key: c.id, className: "tab" + (tab === c.id ? " active" : ""), onClick: () => setTab(c.id) }, c.name)))),
        e("div", { style: { flex: 1, overflowY: "auto", padding: "18px 24px 32px" } },
          dishes.length === 0 ? e(window.Empty, { icon: "search", title: "No dishes found" }) :
          e("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 12 } },
            dishes.map((d) => e(DishCard, { key: d.id, dish: d, inCart: !!cartMap[d.id], onAdd: addDish }))))),

      /* Cart side */
      e("div", { style: { display: "flex", flexDirection: "column", background: "var(--surface)", overflow: "hidden" } },
        e("div", { className: "row between", style: { padding: "16px 18px", borderBottom: "1px solid var(--line)", flex: "0 0 auto" } },
          e("div", { style: { minWidth: 0 } },
            e("div", { className: "row", style: { gap: 8 } },
              e("div", { style: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, whiteSpace: "nowrap" } }, draft.category === "PARCEL" ? "Parcel #" + draft.parcel : H.CATEGORY_LABEL[draft.category] + " · T" + draft.table),
              e("span", { className: "badge b-draft" }, "Draft")),
            e("div", { style: { fontSize: 12, color: "var(--ink-2)", marginTop: 3 } }, draft.number || "New order")),
          e("button", { className: "icon-btn", title: "Discard", onClick: () => go(draft.id ? "orders" : "dashboard") }, e(Icon.x, { size: 18 }))),

        e("div", { style: { flex: 1, overflowY: "auto", padding: "8px 0" } },
          empty ? e("div", { style: { padding: "48px 24px", textAlign: "center", color: "var(--ink-3)" } },
            e("div", { className: "empty-ic", style: { margin: "0 auto 14px" } }, e(Icon.cart, { size: 24 })),
            e("div", { style: { fontWeight: 600, color: "var(--ink-2)" } }, "Tap dishes to add them"))
          : draft.items.map((li) =>
            e("div", { key: li.id, style: { padding: "11px 18px", borderBottom: "1px solid var(--line)" } },
              e("div", { className: "row between", style: { gap: 10 } },
                e("div", { style: { flex: 1, minWidth: 0 } },
                  e("div", { style: { fontWeight: 600, fontSize: 13.5 } }, li.name),
                  e("div", { className: "num", style: { fontSize: 12, color: "var(--ink-2)", marginTop: 2 } }, H.money(li.price) + " each")),
                e(window.Stepper, { value: li.qty, min: 0, onChange: (v) => setQty(li.id, v) }),
                e("div", { className: "num", style: { width: 66, textAlign: "right", fontWeight: 700, fontSize: 13.5 } }, H.money(li.price * li.qty))),
              noteFor === li.id
                ? e("div", { className: "row", style: { gap: 6, marginTop: 8 } },
                    e("input", { className: "input", autoFocus: true, defaultValue: li.note || "", placeholder: "e.g. less spicy, no onion", onBlur: (ev) => { setNote(li.id, ev.target.value); setNoteFor(null); }, onKeyDown: (ev) => { if (ev.key === "Enter") { setNote(li.id, ev.target.value); setNoteFor(null); } }, style: { fontSize: 12.5, padding: "6px 9px" } }))
                : e("button", { onClick: () => setNoteFor(li.id), className: "row", style: { marginTop: 6, gap: 5, border: "none", background: "none", padding: 0, cursor: "pointer", color: li.note ? "var(--accent-700)" : "var(--ink-3)", fontSize: 12, fontWeight: 600 } },
                    e(Icon.edit, { size: 12 }), li.note ? li.note : "Add note"))) ),

        /* Totals + actions */
        e("div", { style: { flex: "0 0 auto", borderTop: "1px solid var(--line)", padding: "14px 18px", background: "var(--surface-2)" } },
          e("div", { className: "row between", style: { marginBottom: 6 } },
            e("span", { className: "muted", style: { fontSize: 13 } }, "Subtotal"),
            e("span", { className: "num", style: { fontWeight: 600, fontSize: 13.5 } }, H.money(bill.subtotal))),
          bill.charges.map((c) => e("div", { key: c.id, className: "row between", style: { marginBottom: 6 } },
            e("span", { className: "muted", style: { fontSize: 13 } }, c.name + " (" + c.pct + "%)"),
            e("span", { className: "num", style: { fontSize: 13.5 } }, H.money(c.amount)))),
          e("div", { className: "row between", style: { marginTop: 10, paddingTop: 12, borderTop: "1px dashed var(--line-strong)" } },
            e("span", { style: { fontWeight: 700, fontSize: 15 } }, "Total"),
            e("span", { className: "num", style: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--accent-700)" } }, H.money(bill.total))),
          e("div", { className: "row", style: { gap: 10, marginTop: 14 } },
            e(window.Btn, { variant: "ghost", icon: "save", disabled: empty, onClick: doSaveDraft, style: { flex: 1 } }, "Save draft"),
            e(window.Btn, { variant: "primary", icon: "print", disabled: empty, onClick: doPrint, style: { flex: 1.3 } }, "Print bill")),
          e("div", { className: "muted-2", style: { fontSize: 11, textAlign: "center", marginTop: 9, lineHeight: 1.5 } }, "Printing locks the order and deducts stock."))));
  }

  function Counter({ route, go }) {
    const S = window.useStore();
    const params = route.params || {};
    // determine starting draft
    const [draft, setDraft] = useState(() => {
      if (params.id) {
        const o = S.state.orders.find((x) => x.id === params.id);
        if (o && o.status === "DRAFT") return { id: o.id, number: o.number, category: o.category, table: o.table, parcel: o.parcel, items: o.items.map((li) => ({ ...li })), discount: o.discount || 0 };
      }
      if (params.cat) return null; // picker will preselect below... we still go through picker
      return null;
    });

    if (!draft) return e(StartPicker, { onStart: (d) => setDraft(d) });
    return e(Workspace, { draft, setDraft, go });
  }

  window.CounterScreen = Counter;
})();
