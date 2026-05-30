/* ============================================================
   Menu & Dishes — grid of dishes by section + recipe editor
   ============================================================ */
(function () {
  const { useState } = React;
  const e = React.createElement;
  const Icon = window.Icon;
  const H = window.KBHelpers;

  function recipeCost(st, dish) {
    if (dish.type === "RESALE" && dish.resale_item) {
      const it = st.items.find((i) => i.id === dish.resale_item);
      return it ? it.avg : 0;
    }
    return (dish.recipe || []).reduce((s, r) => {
      const it = st.items.find((i) => i.id === r.item);
      if (!it) return s;
      const stockQty = H.toStockUnits(st, r.item, r.qty, r.unit);
      return s + stockQty * it.avg;
    }, 0);
  }

  function Menu({ go }) {
    const S = window.useStore();
    const st = S.state;
    const [editing, setEditing] = useState(null);
    const [q, setQ] = useState("");

    return e("div", { className: "page page-wide" },
      e("div", { className: "page-head" },
        e("div", null, e("h1", null, "Menu & dishes"), e("div", { className: "sub" }, st.dishes.length + " dishes · " + st.dishes.filter((d) => !d.available).length + " sold out")),
        e("div", { className: "page-head-actions" },
          e("div", { className: "input-icon", style: { width: 220 } }, e(Icon.search, { size: 16 }), e("input", { className: "input", placeholder: "Search dishes…", value: q, onChange: (ev) => setQ(ev.target.value) })),
          e(window.Btn, { variant: "primary", icon: "plus", onClick: () => setEditing({ id: "new", name: "", cat: st.menuCategories[0].id, price: 0, type: "RECIPE", available: true, recipe: [] }) }, "New dish"))),

      st.menuCategories.filter((c) => c.active).sort((a, b) => a.sort - b.sort).map((c) => {
        let dishes = st.dishes.filter((d) => d.cat === c.id);
        if (q) dishes = dishes.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()));
        if (!dishes.length) return null;
        return e("div", { key: c.id, style: { marginBottom: 26 } },
          e("div", { className: "row between", style: { marginBottom: 12 } },
            e("div", { className: "section-title", style: { margin: 0 } }, c.name + " · " + dishes.length),
            null),
          e("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 } },
            dishes.map((d) => {
              const cost = recipeCost(st, d);
              const margin = d.price ? Math.round(((d.price - cost) / d.price) * 100) : 0;
              return e("div", { key: d.id, className: "card", style: { padding: 16, opacity: d.available ? 1 : .72 } },
                e("div", { className: "row between", style: { marginBottom: 10 } },
                  e("div", null,
                    e("div", { style: { fontWeight: 700, fontSize: 15 } }, d.name),
                    e("div", { className: "row", style: { gap: 7, marginTop: 5 } },
                      e("span", { className: "badge " + (d.type === "RESALE" ? "b-neutral" : "b-accent") }, d.type === "RESALE" ? "Resale" : "Recipe"),
                      !d.available && e("span", { className: "badge b-cancelled" }, "Sold out"))),
                  e("div", { className: "num", style: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--accent-700)" } }, H.money(d.price))),
                e("div", { className: "row between", style: { fontSize: 12, color: "var(--ink-2)", padding: "10px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", marginBottom: 10 } },
                  e("span", null, "Food cost ", e("b", { className: "num", style: { color: "var(--ink)" } }, H.money(cost))),
                  e("span", null, "Margin ", e("b", { className: "num", style: { color: margin > 50 ? "var(--ok)" : "var(--warn)" } }, margin + "%"))),
                e("div", { className: "row", style: { gap: 8 } },
                  e(window.Btn, { variant: "ghost", size: "sm", icon: "edit", onClick: () => setEditing({ ...d, recipe: (d.recipe || []).map((r) => ({ ...r })) }), style: { flex: 1 } }, "Edit recipe"),
                  e("button", { className: "switch" + (d.available ? " on" : ""), onClick: () => { S.update((s) => { s.dishes = s.dishes.map((x) => x.id === d.id ? { ...x, available: !x.available } : x); return s; }); S.audit("dish", d.id, "UPDATE", d.name + (d.available ? " marked sold out" : " back available"), { available: d.available }, { available: !d.available }); } })));
            })));
      }),

      editing && e(RecipeEditor, { dish: editing, st, S, onClose: () => setEditing(null) }));
  }

  function RecipeEditor({ dish, st, S, onClose }) {
    const isNew = dish.id === "new";
    const [form, setForm] = useState({ ...dish });
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const [addItem, setAddItem] = useState(st.items[0].id);

    const cost = recipeCost(st, form);
    const margin = form.price ? Math.round(((form.price - cost) / form.price) * 100) : 0;

    function addLine() {
      const it = st.items.find((i) => i.id === addItem);
      if (form.recipe.some((r) => r.item === addItem)) return;
      set("recipe", [...form.recipe, { item: addItem, qty: 1, unit: it.unit }]);
    }
    function save() {
      if (!form.name.trim()) return S.toast("Enter a dish name", "warn");
      S.update((s) => {
        if (isNew) s.dishes = [...s.dishes, { ...form, id: window.KB_uid("d") }];
        else s.dishes = s.dishes.map((d) => d.id === form.id ? { ...form } : d);
        return s;
      });
      S.audit("dish", form.id || "new", isNew ? "CREATE" : "UPDATE", (isNew ? "Created" : "Updated") + " dish " + form.name);
      S.toast(isNew ? "Dish created" : "Recipe saved", "ok");
      onClose();
    }

    return e(window.Modal, { title: isNew ? "New dish" : form.name, sub: "Define selling price and the ingredients consumed per serving.", onClose, width: 600,
      footer: e(React.Fragment, null, e(window.Btn, { variant: "ghost", onClick: onClose }, "Cancel"), e(window.Btn, { variant: "primary", icon: "save", onClick: save }, "Save dish")) },
      e("div", { style: { display: "grid", gap: 16 } },
        e("div", { className: "grid g2" },
          e(window.Field, { label: "Dish name" }, e(window.Input, { value: form.name, onChange: (ev) => set("name", ev.target.value), placeholder: "e.g. Chicken Karahi (full)" })),
          e(window.Field, { label: "Selling price (₨)" }, e(window.Input, { type: "number", value: form.price, onChange: (ev) => set("price", Number(ev.target.value) || 0) }))),
        e("div", { className: "grid g2" },
          e(window.Field, { label: "Menu section" }, e(window.Select, { value: form.cat, onChange: (ev) => set("cat", ev.target.value) }, st.menuCategories.map((c) => e("option", { key: c.id, value: c.id }, c.name)))),
          e(window.Field, { label: "Type" }, e(window.Select, { value: form.type, onChange: (ev) => set("type", ev.target.value) }, e("option", { value: "RECIPE" }, "Recipe (made from ingredients)"), e("option", { value: "RESALE" }, "Resale (sold as-is)")))),

        form.type === "RESALE"
          ? e(window.Field, { label: "Linked inventory item", hint: "1 sale deducts 1 unit of this item." },
              e(window.Select, { value: form.resale_item || "", onChange: (ev) => set("resale_item", ev.target.value) }, e("option", { value: "" }, "Select item…"), st.items.map((i) => e("option", { key: i.id, value: i.id }, i.name))))
          : e("div", null,
              e("div", { className: "row between", style: { marginBottom: 8 } },
                e("div", { className: "section-title", style: { margin: 0 } }, "Recipe · ingredients per serving"),
                e("div", { className: "row", style: { gap: 6 } },
                  e(window.Select, { value: addItem, onChange: (ev) => setAddItem(ev.target.value), style: { width: 180, padding: "7px 10px", fontSize: 13 } }, st.items.map((i) => e("option", { key: i.id, value: i.id }, i.name))),
                  e(window.Btn, { variant: "soft", size: "sm", icon: "plus", onClick: addLine }, "Add"))),
              form.recipe.length === 0
                ? e("div", { style: { padding: "20px", textAlign: "center", color: "var(--ink-3)", fontSize: 13, background: "var(--surface-2)", borderRadius: "var(--r-md)" } }, "No ingredients yet — add items above.")
                : e("div", { className: "tbl-wrap" }, e("table", { className: "tbl" },
                    e("thead", null, e("tr", null, e("th", null, "Ingredient"), e("th", { className: "r" }, "Qty"), e("th", null, "Unit"), e("th", { className: "r" }, "Cost"), e("th", null, ""))),
                    e("tbody", null, form.recipe.map((r, idx) => {
                      const it = st.items.find((i) => i.id === r.item);
                      const lineCost = H.toStockUnits(st, r.item, r.qty, r.unit) * (it ? it.avg : 0);
                      return e("tr", { key: r.item },
                        e("td", null, e("span", { style: { fontWeight: 600 } }, it ? it.name : "—")),
                        e("td", { className: "r" }, e("input", { className: "input num", type: "number", value: r.qty, onChange: (ev) => set("recipe", form.recipe.map((x, i) => i === idx ? { ...x, qty: Number(ev.target.value) || 0 } : x)), style: { width: 76, padding: "6px 8px", textAlign: "right" } })),
                        e("td", null, e("select", { className: "select", value: r.unit, onChange: (ev) => set("recipe", form.recipe.map((x, i) => i === idx ? { ...x, unit: ev.target.value } : x)), style: { width: 84, padding: "6px 8px", fontSize: 13 } }, st.units.map((u) => e("option", { key: u.id, value: u.id }, u.name)))),
                        e("td", { className: "r num muted" }, H.money(lineCost)),
                        e("td", { className: "r" }, e("button", { className: "icon-btn", style: { width: 30, height: 30 }, onClick: () => set("recipe", form.recipe.filter((_, i) => i !== idx)) }, e(Icon.trash, { size: 14 }))));
                    }))))),

        e("div", { className: "row between", style: { background: "var(--char)", color: "var(--char-ink)", padding: "14px 18px", borderRadius: "var(--r-md)" } },
          e("div", null, e("div", { style: { fontSize: 12, color: "var(--char-ink-2)" } }, "Food cost"), e("div", { className: "num", style: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19 } }, H.money(cost))),
          e("div", { style: { textAlign: "center" } }, e("div", { style: { fontSize: 12, color: "var(--char-ink-2)" } }, "Margin"), e("div", { className: "num", style: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, color: margin > 50 ? "#6FD389" : "#F0B45C" } }, margin + "%")),
          e("div", { style: { textAlign: "right" } }, e("div", { style: { fontSize: 12, color: "var(--char-ink-2)" } }, "Sells for"), e("div", { className: "num", style: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19 } }, H.money(form.price))))));
  }

  window.MenuScreen = Menu;
})();
