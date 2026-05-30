/* ============================================================
   Inventory — Items list, Item editor, Categories
   ============================================================ */
(function () {
  const { useState } = React;
  const e = React.createElement;
  const Icon = window.Icon;
  const H = window.KBHelpers;

  /* ---------- ITEMS LIST ---------- */
  function Items({ go }) {
    const S = window.useStore();
    const st = S.state;
    const [q, setQ] = useState("");
    const [catF, setCatF] = useState("ALL");
    const [view, setView] = useState("ALL"); // ALL | LOW

    let rows = st.items.filter((i) => i.active);
    if (catF !== "ALL") rows = rows.filter((i) => i.cat === catF);
    if (view === "LOW") rows = rows.filter((i) => i.qty <= i.reorder);
    if (q) rows = rows.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));

    const totalValue = st.items.reduce((s, i) => s + i.qty * i.avg, 0);
    const low = H.lowStockItems(st);

    return e("div", { className: "page page-wide" },
      e("div", { className: "page-head" },
        e("div", null, e("h1", null, "Inventory items"), e("div", { className: "sub" }, st.items.length + " items · stock value " + H.money(totalValue))),
        e("div", { className: "page-head-actions" },
          e(window.Btn, { variant: "ghost", icon: "truck", onClick: () => go("grn") }, "Receive stock"),
          e(window.Btn, { variant: "primary", icon: "plus", onClick: () => go("item", { id: "new" }) }, "New item"))),

      e("div", { className: "row between", style: { marginBottom: 16, gap: 12, flexWrap: "wrap" } },
        e("div", { className: "row", style: { gap: 10 } },
          e(window.Seg, { value: view, onChange: setView, options: [{ value: "ALL", label: "All items" }, { value: "LOW", label: "Low stock (" + low.length + ")" }] }),
          e(window.Select, { value: catF, onChange: (ev) => setCatF(ev.target.value), style: { width: 180 } },
            e("option", { value: "ALL" }, "All categories"),
            st.itemCategories.map((c) => e("option", { key: c.id, value: c.id }, c.name)))),
        e("div", { className: "input-icon", style: { width: 240 } }, e(Icon.search, { size: 16 }), e("input", { className: "input", placeholder: "Search items…", value: q, onChange: (ev) => setQ(ev.target.value) }))),

      e("div", { className: "tbl-wrap" },
        e("table", { className: "tbl" },
          e("thead", null, e("tr", null,
            e("th", null, "Item"), e("th", null, "Category"), e("th", { className: "r" }, "On hand"),
            e("th", { className: "r" }, "Reorder"), e("th", { className: "r" }, "Avg cost"), e("th", { className: "r" }, "Stock value"),
            e("th", null, "Status"), e("th", null, ""))),
          e("tbody", null, rows.map((i) => {
            const c = st.itemCategories.find((x) => x.id === i.cat);
            const out = i.qty <= 0.001, lo = i.qty <= i.reorder;
            return e("tr", { key: i.id, className: "clickable", onClick: () => go("item", { id: i.id }) },
              e("td", null, e("div", { style: { fontWeight: 600 } }, i.name)),
              e("td", { className: "muted" }, c ? c.name : "—"),
              e("td", { className: "r num", style: { fontWeight: 700, color: out ? "var(--danger)" : lo ? "var(--warn)" : "var(--ink)" } }, H.fmtQty(i.qty) + " " + i.unit),
              e("td", { className: "r num muted" }, H.fmtQty(i.reorder)),
              e("td", { className: "r num muted" }, H.money(i.avg)),
              e("td", { className: "r num", style: { fontWeight: 600 } }, H.money(i.qty * i.avg)),
              e("td", null, out ? e("span", { className: "badge b-cancelled" }, "Out") : lo ? e("span", { className: "badge b-pending" }, "Low") : e("span", { className: "badge b-ok" }, "OK")),
              e("td", { className: "r" }, e(Icon.chevR, { size: 16, style: { color: "var(--ink-3)" } })));
          })))));
  }

  /* ---------- ITEM EDITOR ---------- */
  function ItemEditor({ route, go }) {
    const S = window.useStore();
    const st = S.state;
    const isNew = route.params.id === "new";
    const existing = !isNew && st.items.find((i) => i.id === route.params.id);
    const [form, setForm] = useState(() => existing ? { ...existing } : { name: "", cat: st.itemCategories[0].id, unit: "kg", qty: 0, avg: 0, reorder: 0, active: true });
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const usedIn = existing ? st.dishes.filter((d) => (d.recipe || []).some((r) => r.item === existing.id) || d.resale_item === existing.id) : [];
    const recentMoves = existing ? st.purchases.filter((p) => p.lines.some((l) => l.item === existing.id)).slice(0, 5) : [];

    function save() {
      if (!form.name.trim()) return S.toast("Enter an item name", "warn");
      S.update((s) => {
        if (isNew) { s.items = [{ ...form, id: window.KB_uid("it") }, ...s.items]; }
        else { s.items = s.items.map((i) => i.id === form.id ? { ...form } : i); }
        return s;
      });
      S.audit("item", form.id || "new", isNew ? "CREATE" : "UPDATE", (isNew ? "Created" : "Updated") + " item " + form.name);
      S.toast(isNew ? "Item created" : "Item saved", "ok");
      go("items");
    }

    return e("div", { className: "page", style: { maxWidth: 880 } },
      e("div", { className: "row", style: { gap: 12, marginBottom: 18 } },
        e("button", { className: "icon-btn", onClick: () => go("items") }, e(Icon.chevL, { size: 18 })),
        e("div", { style: { flex: 1 } }, e("h1", { style: { fontSize: 23 } }, isNew ? "New inventory item" : form.name),
          e("div", { className: "sub", style: { color: "var(--ink-2)", fontSize: 13, marginTop: 2 } }, isNew ? "Add a raw material or resale product" : "Edit item details")),
        e(window.Btn, { variant: "ghost", onClick: () => go("items") }, "Cancel"),
        e(window.Btn, { variant: "primary", icon: "save", onClick: save }, "Save item")),

      e("div", { className: "grid", style: { gridTemplateColumns: existing ? "1.4fr 1fr" : "1fr", alignItems: "start" } },
        e(window.Panel, { title: "Details" },
          e("div", { style: { display: "grid", gap: 16 } },
            e(window.Field, { label: "Item name" }, e(window.Input, { value: form.name, onChange: (ev) => set("name", ev.target.value), placeholder: "e.g. Chicken (boneless)" })),
            e("div", { className: "grid g2" },
              e(window.Field, { label: "Category" }, e(window.Select, { value: form.cat, onChange: (ev) => set("cat", ev.target.value) }, st.itemCategories.map((c) => e("option", { key: c.id, value: c.id }, c.name)))),
              e(window.Field, { label: "Stock unit" }, e(window.Select, { value: form.unit, onChange: (ev) => set("unit", ev.target.value) }, st.units.map((u) => e("option", { key: u.id, value: u.id }, u.name))))),
            e("div", { className: "grid g3" },
              e(window.Field, { label: "Quantity on hand", hint: isNew ? "Opening stock" : "Adjust via Stock Count" }, e(window.Input, { type: "number", value: form.qty, onChange: (ev) => set("qty", Number(ev.target.value) || 0), disabled: !isNew })),
              e(window.Field, { label: "Reorder level", hint: "Low-stock alert" }, e(window.Input, { type: "number", value: form.reorder, onChange: (ev) => set("reorder", Number(ev.target.value) || 0) })),
              e(window.Field, { label: "Avg cost (₨/" + form.unit + ")" }, e(window.Input, { type: "number", value: form.avg, onChange: (ev) => set("avg", Number(ev.target.value) || 0) }))),
            e("label", { className: "row between", style: { background: "var(--surface-2)", padding: "12px 14px", borderRadius: "var(--r-md)", cursor: "pointer" } },
              e("div", null, e("div", { style: { fontWeight: 700, fontSize: 13.5 } }, "Active"), e("div", { style: { fontSize: 12, color: "var(--ink-2)", marginTop: 2 } }, "Inactive items are hidden from receipts & counts.")),
              e(window.Switch, { on: form.active, onClick: () => set("active", !form.active) })))),

        existing && e("div", { style: { display: "grid", gap: 16 } },
          e(window.Panel, { title: "Used in dishes", sub: usedIn.length + " recipes" },
            usedIn.length === 0 ? e("div", { className: "muted", style: { fontSize: 13 } }, "Not used in any dish yet.") :
            e("div", { style: { display: "grid", gap: 8 } }, usedIn.map((d) => e("div", { key: d.id, className: "row between", style: { fontSize: 13 } }, e("span", { style: { fontWeight: 600 } }, d.name), e("span", { className: "muted num" }, H.money(d.price)))))),
          e(window.Panel, { title: "Recent receipts" },
            recentMoves.length === 0 ? e("div", { className: "muted", style: { fontSize: 13 } }, "No purchase history.") :
            e("div", { style: { display: "grid", gap: 10 } }, recentMoves.map((p) => { const l = p.lines.find((x) => x.item === existing.id); const v = st.vendors.find((x) => x.id === p.vendor); return e("div", { key: p.id, className: "row between", style: { fontSize: 13 } }, e("div", null, e("div", { style: { fontWeight: 600 } }, "+" + H.fmtQty(l.qty) + " " + existing.unit), e("div", { style: { fontSize: 11.5, color: "var(--ink-3)" } }, v.name + " · " + H.fmtDate(p.date))), e("span", { className: "num muted" }, H.money(l.cost))); }))))));
  }

  /* ---------- CATEGORIES ---------- */
  function Categories({ go }) {
    const S = window.useStore();
    const st = S.state;
    const [tab, setTab] = useState("item");
    const [modal, setModal] = useState(null); // {kind, editing}

    const itemCats = st.itemCategories.map((c) => ({ ...c, count: st.items.filter((i) => i.cat === c.id).length }));
    const menuCats = st.menuCategories.map((c) => ({ ...c, count: st.dishes.filter((d) => d.cat === c.id).length }));

    function saveCat(name) {
      const list = tab === "item" ? "itemCategories" : "menuCategories";
      S.update((s) => {
        if (modal.editing) s[list] = s[list].map((c) => c.id === modal.editing.id ? { ...c, name } : c);
        else s[list] = [...s[list], { id: window.KB_uid("c"), name, active: true, sort: s[list].length + 1 }];
        return s;
      });
      S.toast(modal.editing ? "Category renamed" : "Category added", "ok");
      setModal(null);
    }

    const rows = tab === "item" ? itemCats : menuCats;
    return e("div", { className: "page", style: { maxWidth: 720 } },
      e("div", { className: "page-head" },
        e("div", null, e("h1", null, "Categories"), e("div", { className: "sub" }, "Organize inventory items and menu sections.")),
        e("div", { className: "page-head-actions" }, e(window.Btn, { variant: "primary", icon: "plus", onClick: () => setModal({ kind: "new" }) }, "New category"))),
      e("div", { className: "tabs", style: { marginBottom: 18 } },
        e("button", { className: "tab" + (tab === "item" ? " active" : ""), onClick: () => setTab("item") }, "Inventory categories"),
        e("button", { className: "tab" + (tab === "menu" ? " active" : ""), onClick: () => setTab("menu") }, "Menu sections")),
      e("div", { className: "tbl-wrap" },
        e("table", { className: "tbl" },
          e("thead", null, e("tr", null, e("th", null, "Name"), e("th", { className: "r" }, tab === "item" ? "Items" : "Dishes"), e("th", null, "Status"), e("th", { className: "r" }, ""))),
          e("tbody", null, rows.map((c) =>
            e("tr", { key: c.id },
              e("td", null, e("div", { style: { fontWeight: 600 } }, c.name)),
              e("td", { className: "r num muted" }, c.count),
              e("td", null, e("span", { className: "badge " + (c.active ? "b-ok" : "b-neutral") }, c.active ? "Active" : "Hidden")),
              e("td", { className: "r" }, e("button", { className: "icon-btn", style: { width: 32, height: 32 }, onClick: () => setModal({ kind: "edit", editing: c }) }, e(Icon.edit, { size: 15 })))))))),
      modal && e(CatModal, { editing: modal.editing, onSave: saveCat, onClose: () => setModal(null) }));
  }

  function CatModal({ editing, onSave, onClose }) {
    const [name, setName] = useState(editing ? editing.name : "");
    return e(window.Modal, { title: editing ? "Rename category" : "New category", onClose, width: 420,
      footer: e(React.Fragment, null, e(window.Btn, { variant: "ghost", onClick: onClose }, "Cancel"), e(window.Btn, { variant: "primary", disabled: !name.trim(), onClick: () => onSave(name.trim()) }, "Save")) },
      e(window.Field, { label: "Category name" }, e(window.Input, { autoFocus: true, value: name, onChange: (ev) => setName(ev.target.value), onKeyDown: (ev) => ev.key === "Enter" && name.trim() && onSave(name.trim()) })));
  }

  window.ItemsScreen = Items;
  window.ItemEditorScreen = ItemEditor;
  window.CategoriesScreen = Categories;
})();
