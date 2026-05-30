/* ============================================================
   Stock count / adjustment
   ============================================================ */
(function () {
  const { useState } = React;
  const e = React.createElement;
  const Icon = window.Icon;
  const H = window.KBHelpers;

  const REASONS = ["Wastage / spoilage", "Spillage", "Theft / loss", "Trim / preparation", "Counting correction", "Other"];

  function StockCount({ go }) {
    const S = window.useStore();
    const st = S.state;
    const [tab, setTab] = useState("history");
    const [counting, setCounting] = useState(false);

    if (counting) return e(CountForm, { st, S, back: () => setCounting(false) });

    return e("div", { className: "page page-wide" },
      e("div", { className: "page-head" },
        e("div", null, e("h1", null, "Stock count"), e("div", { className: "sub" }, "Reconcile physical stock against the system. Differences post as adjustments.")),
        e("div", { className: "page-head-actions" }, e(window.Btn, { variant: "primary", icon: "clipboard", onClick: () => setCounting(true) }, "Start count"))),

      st.stockCounts.length === 0 ? e(window.Empty, { icon: "clipboard", title: "No counts yet" }) :
      e("div", { style: { display: "grid", gap: 16 } },
        st.stockCounts.slice().sort((a, b) => new Date(b.at) - new Date(a.at)).map((c) => {
          const by = st.users.find((u) => u.id === c.by);
          return e(window.Panel, { key: c.id, title: H.fmtDateTime(c.at), sub: (by ? by.full_name : "") + (c.note ? " · " + c.note : ""), pad: false },
            e("table", { className: "tbl" },
              e("thead", null, e("tr", null, e("th", null, "Item"), e("th", { className: "r" }, "System"), e("th", { className: "r" }, "Counted"), e("th", { className: "r" }, "Difference"), e("th", null, "Reason"))),
              e("tbody", null, c.lines.map((l) => {
                const it = st.items.find((x) => x.id === l.item); const diff = l.counted - l.system;
                return e("tr", { key: l.item },
                  e("td", null, e("span", { style: { fontWeight: 600 } }, it ? it.name : "—")),
                  e("td", { className: "r num muted" }, H.fmtQty(l.system)),
                  e("td", { className: "r num", style: { fontWeight: 600 } }, H.fmtQty(l.counted)),
                  e("td", { className: "r num", style: { fontWeight: 700, color: diff < 0 ? "var(--danger)" : diff > 0 ? "var(--ok)" : "var(--ink-3)" } }, (diff > 0 ? "+" : "") + H.fmtQty(diff)),
                  e("td", null, e("span", { className: "pill" }, l.reason)));
              }))));
        })));
  }

  function CountForm({ st, S, back }) {
    const [counts, setCounts] = useState({}); // itemId -> {counted, reason}
    const [q, setQ] = useState("");
    let items = st.items.filter((i) => i.active);
    if (q) items = items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));

    const changed = Object.entries(counts).filter(([id, c]) => c.counted !== "" && Number(c.counted) !== st.items.find((i) => i.id === id).qty);

    function post() {
      if (!changed.length) return S.toast("No differences to post", "warn");
      const lines = changed.map(([id, c]) => ({ item: id, system: st.items.find((i) => i.id === id).qty, counted: Number(c.counted), reason: c.reason || "Counting correction" }));
      S.update((s) => {
        s.items = s.items.map((it) => { const ln = lines.find((l) => l.item === it.id); return ln ? { ...it, qty: ln.counted } : it; });
        s.stockCounts = [{ id: window.KB_uid("sc"), at: new Date().toISOString(), by: S.session.userId, note: "Manual count", lines }, ...s.stockCounts];
        return s;
      });
      lines.forEach((l) => { const it = st.items.find((i) => i.id === l.item); S.audit("item", l.item, "ADJUSTMENT", "Stock adjustment: " + it.name + " " + H.fmtQty(l.system) + " → " + H.fmtQty(l.counted) + " " + it.unit + " (" + l.reason + ")", { qty: l.system }, { qty: l.counted }); });
      S.toast(changed.length + " adjustments posted", "ok");
      back();
    }

    return e("div", { className: "page", style: { maxWidth: 980 } },
      e("div", { className: "row", style: { gap: 12, marginBottom: 18 } },
        e("button", { className: "icon-btn", onClick: back }, e(Icon.chevL, { size: 18 })),
        e("div", { style: { flex: 1 } }, e("h1", { style: { fontSize: 23 } }, "Physical stock count"), e("div", { className: "sub", style: { color: "var(--ink-2)", fontSize: 13, marginTop: 2 } }, "Enter counted quantities. Leave blank to skip an item.")),
        e("div", { className: "row", style: { gap: 10 } },
          changed.length > 0 && e("span", { className: "pill" }, changed.length + " differences"),
          e(window.Btn, { variant: "ghost", onClick: back }, "Cancel"),
          e(window.Btn, { variant: "primary", icon: "check", onClick: post }, "Post adjustments"))),

      e("div", { className: "input-icon", style: { width: 260, marginBottom: 14 } }, e(Icon.search, { size: 16 }), e("input", { className: "input", placeholder: "Find item…", value: q, onChange: (ev) => setQ(ev.target.value) })),

      e("div", { className: "tbl-wrap" },
        e("table", { className: "tbl" },
          e("thead", null, e("tr", null, e("th", null, "Item"), e("th", { className: "r" }, "System qty"), e("th", { style: { width: 150 } }, "Counted"), e("th", { className: "r" }, "Difference"), e("th", { style: { width: 200 } }, "Reason"))),
          e("tbody", null, items.map((it) => {
            const c = counts[it.id] || { counted: "", reason: "" };
            const diff = c.counted === "" ? null : Number(c.counted) - it.qty;
            return e("tr", { key: it.id },
              e("td", null, e("div", { style: { fontWeight: 600 } }, it.name), e("div", { style: { fontSize: 11.5, color: "var(--ink-3)" } }, "Unit: " + it.unit)),
              e("td", { className: "r num muted" }, H.fmtQty(it.qty)),
              e("td", null, e("input", { className: "input num", type: "number", placeholder: H.fmtQty(it.qty), value: c.counted, onChange: (ev) => setCounts((m) => ({ ...m, [it.id]: { ...c, counted: ev.target.value } })), style: { textAlign: "right", padding: "7px 10px" } })),
              e("td", { className: "r num", style: { fontWeight: 700, color: diff == null ? "var(--ink-3)" : diff < 0 ? "var(--danger)" : diff > 0 ? "var(--ok)" : "var(--ink-3)" } }, diff == null ? "—" : (diff > 0 ? "+" : "") + H.fmtQty(diff)),
              e("td", null, diff != null && diff !== 0 ? e("select", { className: "select", value: c.reason, onChange: (ev) => setCounts((m) => ({ ...m, [it.id]: { ...c, reason: ev.target.value } })), style: { padding: "7px 10px", fontSize: 13 } }, e("option", { value: "" }, "Select reason…"), REASONS.map((r) => e("option", { key: r, value: r }, r))) : e("span", { className: "muted-2", style: { fontSize: 12 } }, "—")));
              })))));
  }

  window.StockCountScreen = StockCount;
})();
