/* ============================================================
   Audit Log + Users & Roles + Settings
   ============================================================ */
(function () {
  const { useState } = React;
  const e = React.createElement;
  const Icon = window.Icon;
  const H = window.KBHelpers;

  const ACTION_META = {
    PRINT: { ic: "print", c: "b-printed" }, PAYMENT: { ic: "cash", c: "b-completed" },
    CANCEL: { ic: "x", c: "b-cancelled" }, RECEIPT: { ic: "truck", c: "b-delivered" },
    UPDATE: { ic: "edit", c: "b-neutral" }, CREATE: { ic: "plus", c: "b-accent" },
    ADJUSTMENT: { ic: "scale", c: "b-pending" }, SETTINGS_CHANGE: { ic: "settings", c: "b-neutral" },
    LOGIN: { ic: "logout", c: "b-ok" }, LOGIN_FAILED: { ic: "alert", c: "b-cancelled" },
    DELIVER: { ic: "check", c: "b-delivered" },
  };

  /* ---------- AUDIT ---------- */
  function Audit({ go }) {
    const S = window.useStore();
    const st = S.state;
    const [entity, setEntity] = useState("ALL");
    const [q, setQ] = useState("");

    let rows = st.audit;
    if (entity !== "ALL") rows = rows.filter((a) => a.entity === entity);
    if (q) rows = rows.filter((a) => a.summary.toLowerCase().includes(q.toLowerCase()));
    const entities = ["ALL", "order", "item", "dish", "purchase", "vendor", "user", "settings"];

    return e("div", { className: "page page-wide" },
      e("div", { className: "page-head" },
        e("div", null, e("h1", null, "Audit log"), e("div", { className: "sub" }, "Every state change is recorded. Append-only · " + st.audit.length + " events.")),
        e("div", { className: "page-head-actions" }, e(window.Btn, { variant: "dark", icon: "download" }, "Export"))),

      e("div", { className: "row between", style: { marginBottom: 16, flexWrap: "wrap", gap: 12 } },
        e("div", { className: "row", style: { gap: 7, flexWrap: "wrap" } },
          entities.map((en) => e("button", { key: en, onClick: () => setEntity(en), style: { padding: "7px 13px", borderRadius: 99, border: "1px solid " + (entity === en ? "var(--char)" : "var(--line)"), background: entity === en ? "var(--char)" : "var(--surface)", color: entity === en ? "var(--char-ink)" : "var(--ink-2)", fontWeight: 700, fontSize: 12.5, cursor: "pointer", textTransform: "capitalize" } }, en === "ALL" ? "All" : en))),
        e("div", { className: "input-icon", style: { width: 240 } }, e(Icon.search, { size: 16 }), e("input", { className: "input", placeholder: "Search events…", value: q, onChange: (ev) => setQ(ev.target.value) }))),

      e("div", { className: "card", style: { padding: 0 } },
        rows.map((a, i) => {
          const actor = st.users.find((u) => u.id === a.actor);
          const m = ACTION_META[a.action] || { ic: "history", c: "b-neutral" };
          return e("div", { key: a.id, className: "row", style: { gap: 14, padding: "14px 20px", borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none", alignItems: "flex-start" } },
            e("div", { style: { width: 36, height: 36, borderRadius: 9, flex: "0 0 auto", display: "grid", placeItems: "center", background: "var(--surface-3)", color: "var(--ink-2)" } }, e(Icon[m.ic], { size: 17 })),
            e("div", { style: { flex: 1, minWidth: 0 } },
              e("div", { className: "row", style: { gap: 8, flexWrap: "wrap" } },
                e("span", { style: { fontWeight: 600, fontSize: 13.5 } }, a.summary),
                e("span", { className: "badge " + m.c, style: { fontSize: 10.5 } }, a.action.replace("_", " "))),
              e("div", { className: "row", style: { gap: 8, marginTop: 4, fontSize: 12, color: "var(--ink-3)" } },
                actor && e("span", { className: "row", style: { gap: 5 } }, e(window.Avatar, { user: actor, size: 18 }), actor.full_name),
                e("span", null, "·"), e("span", null, H.fmtDateTime(a.at)), e("span", null, "·"), e("span", { className: "num" }, "#" + a.seq))),
            (a.before || a.after) && e("div", { className: "muted-2 num", style: { fontSize: 11, textAlign: "right", maxWidth: 160 } },
              a.before && e("div", null, "was: " + JSON.stringify(a.before).replace(/[{}"]/g, "").slice(0, 28)),
              a.after && e("div", { style: { color: "var(--ink-2)" } }, "now: " + JSON.stringify(a.after).replace(/[{}"]/g, "").slice(0, 28))));
        })));
  }

  /* ---------- USERS ---------- */
  function Users({ go }) {
    const S = window.useStore();
    const st = S.state;
    const [modal, setModal] = useState(null);

    return e("div", { className: "page", style: { maxWidth: 1000 } },
      e("div", { className: "page-head" },
        e("div", null, e("h1", null, "Users & roles"), e("div", { className: "sub" }, st.users.filter((u) => u.active).length + " active users")),
        e("div", { className: "page-head-actions" }, e(window.Btn, { variant: "primary", icon: "plus", onClick: () => setModal({ kind: "new" }) }, "Add user"))),

      e("div", { className: "grid g3", style: { marginBottom: 22 } },
        [["SUPER_ADMIN", "Super Admin", "Full access — owner. Dashboards, reports, cancellations, settings, user management."],
         ["INVENTORY_MANAGER", "Inventory Manager", "Items, recipes, vendors, goods received, stock counts and adjustments."],
         ["SALES_MANAGER", "Sales Manager", "Counter only — take orders, print bills, record payments. Cannot cancel printed bills."]].map(([r, t, d]) =>
          e("div", { key: r, className: "card", style: { padding: 16 } },
            e("div", { className: "row", style: { gap: 9, marginBottom: 8 } }, e("div", { style: { width: 30, height: 30, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent-700)", display: "grid", placeItems: "center" } }, e(Icon[r === "SUPER_ADMIN" ? "settings" : r === "INVENTORY_MANAGER" ? "boxes" : "counter"], { size: 16 })), e("div", { style: { fontWeight: 700, fontSize: 14 } }, t)),
            e("div", { style: { fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 } }, d),
            e("div", { className: "muted-2", style: { fontSize: 11.5, marginTop: 10 } }, st.users.filter((u) => u.role === r).length + " users"))),
      ),

      e("div", { className: "tbl-wrap" },
        e("table", { className: "tbl" },
          e("thead", null, e("tr", null, e("th", null, "User"), e("th", null, "Username"), e("th", null, "Role"), e("th", null, "Auth"), e("th", null, "Last login"), e("th", null, "Status"), e("th", { className: "r" }, ""))),
          e("tbody", null, st.users.map((u) =>
            e("tr", { key: u.id },
              e("td", null, e("div", { className: "row", style: { gap: 10 } }, e(window.Avatar, { user: u, size: 32 }), e("span", { style: { fontWeight: 600 } }, u.full_name))),
              e("td", { className: "muted num" }, u.username),
              e("td", null, e("span", { className: "pill" }, H.ROLE_LABEL[u.role])),
              e("td", { className: "muted" }, u.pin ? "PIN" : "Password"),
              e("td", { className: "muted", style: { fontSize: 13 } }, u.last_login_at ? H.timeAgo(u.last_login_at) : "Never"),
              e("td", null, e("span", { className: "badge " + (u.active ? "b-ok" : "b-neutral") }, u.active ? "Active" : "Disabled")),
              e("td", { className: "r" }, e("button", { className: "icon-btn", style: { width: 32, height: 32 }, onClick: () => setModal({ kind: "edit", editing: u }) }, e(Icon.edit, { size: 15 })))))))),

      modal && e(UserModal, { editing: modal.editing, S, onClose: () => setModal(null) }));
  }

  function UserModal({ editing, S, onClose }) {
    const [f, setF] = useState(editing ? { ...editing } : { full_name: "", username: "", role: "SALES_MANAGER", active: true, pin: "", color: "#3F7A4E" });
    const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
    function save() {
      if (!f.full_name.trim() || !f.username.trim()) return S.toast("Name and username required", "warn");
      S.update((s) => {
        if (editing) s.users = s.users.map((u) => u.id === f.id ? { ...f } : u);
        else s.users = [...s.users, { ...f, id: window.KB_uid("u"), last_login_at: null }];
        return s;
      });
      S.toast(editing ? "User updated" : "User added", "ok"); onClose();
    }
    const colors = ["#B23121", "#2F6E9E", "#3F7A4E", "#C2680E", "#6E6153", "#7B4FA3"];
    return e(window.Modal, { title: editing ? "Edit user" : "Add user", onClose, width: 480,
      footer: e(React.Fragment, null, e(window.Btn, { variant: "ghost", onClick: onClose }, "Cancel"), e(window.Btn, { variant: "primary", icon: "save", onClick: save }, "Save user")) },
      e("div", { style: { display: "grid", gap: 14 } },
        e("div", { className: "grid g2" },
          e(window.Field, { label: "Full name" }, e(window.Input, { value: f.full_name, onChange: (ev) => set("full_name", ev.target.value) })),
          e(window.Field, { label: "Username" }, e(window.Input, { value: f.username, onChange: (ev) => set("username", ev.target.value) }))),
        e(window.Field, { label: "Role" }, e(window.Select, { value: f.role, onChange: (ev) => set("role", ev.target.value) }, Object.entries(H.ROLE_LABEL).map(([k, v]) => e("option", { key: k, value: k }, v)))),
        e(window.Field, { label: f.role === "SALES_MANAGER" ? "Counter PIN (4 digits)" : "Password", hint: f.role === "SALES_MANAGER" ? "Used for fast counter login." : "Set a temporary password." },
          e(window.Input, { value: f.pin || "", maxLength: f.role === "SALES_MANAGER" ? 4 : 40, onChange: (ev) => set("pin", ev.target.value), placeholder: f.role === "SALES_MANAGER" ? "0000" : "••••••••" })),
        e(window.Field, { label: "Avatar colour" }, e("div", { className: "row", style: { gap: 8 } }, colors.map((c) => e("button", { key: c, onClick: () => set("color", c), style: { width: 30, height: 30, borderRadius: 99, background: c, border: f.color === c ? "3px solid var(--ink)" : "2px solid var(--line)", cursor: "pointer" } })))),
        e("label", { className: "row between", style: { background: "var(--surface-2)", padding: "12px 14px", borderRadius: "var(--r-md)", cursor: "pointer" } },
          e("div", { style: { fontWeight: 700, fontSize: 13.5 } }, "Active"), e(window.Switch, { on: f.active, onClick: () => set("active", !f.active) }))));
  }

  /* ---------- SETTINGS ---------- */
  function Settings({ go }) {
    const S = window.useStore();
    const st = S.state;
    const [tab, setTab] = useState("restaurant");
    const tabs = [{ value: "restaurant", label: "Restaurant" }, { value: "charges", label: "Taxes & charges" }, { value: "payments", label: "Payment methods" }, { value: "printer", label: "Printer" }, { value: "backup", label: "Backup & data" }];

    return e("div", { className: "page", style: { maxWidth: 940 } },
      e("div", { className: "page-head" }, e("div", null, e("h1", null, "Settings"), e("div", { className: "sub" }, "System configuration · Super Admin only"))),
      e("div", { className: "tabs", style: { marginBottom: 22 } },
        tabs.map((t) => e("button", { key: t.value, className: "tab" + (tab === t.value ? " active" : ""), onClick: () => setTab(t.value) }, t.label))),

      tab === "restaurant" && e(window.Panel, { title: "Restaurant details" },
        e("div", { style: { display: "grid", gap: 14 } },
          e("div", { className: "grid g2" },
            e(window.Field, { label: "Restaurant name" }, e(window.Input, { defaultValue: st.settings.restaurant_name })),
            e(window.Field, { label: "Tagline" }, e(window.Input, { defaultValue: st.settings.tagline }))),
          e(window.Field, { label: "Address" }, e(window.Input, { defaultValue: st.settings.address })),
          e("div", { className: "grid g3" },
            e(window.Field, { label: "Phone" }, e(window.Input, { defaultValue: st.settings.phone })),
            e(window.Field, { label: "Tax number" }, e(window.Input, { defaultValue: st.settings.tax_number })),
            e(window.Field, { label: "Currency" }, e(window.Select, { defaultValue: "PKR" }, e("option", null, "PKR")))),
          e("div", { className: "row", style: { marginTop: 4 } }, e(window.Btn, { variant: "primary", icon: "save", onClick: () => S.toast("Settings saved", "ok") }, "Save changes")))),

      tab === "charges" && e("div", { style: { display: "grid", gap: 16 } },
        e("div", { className: "locked-banner" }, e(Icon.alert, { size: 17 }), "Charge rates can differ by payment method. Cash carries 16% GST; card / digital carry 5%."),
        st.charges.map((c) => e(window.Panel, { key: c.id, title: c.name, sub: "Applies to: " + c.applies.map((a) => H.CATEGORY_LABEL[a]).join(", ") },
          e("div", { className: "tbl-wrap" }, e("table", { className: "tbl" },
            e("thead", null, e("tr", null, e("th", null, "Payment method"), e("th", { className: "r" }, "Rate (%)"), e("th", null, ""))),
            e("tbody", null, st.paymentMethods.filter((m) => m.active).map((m) => {
              let r = st.chargeRates.find((x) => x.charge === c.id && x.pm === m.id);
              if (!r) r = st.chargeRates.find((x) => x.charge === c.id && x.pm === null);
              return e("tr", { key: m.id },
                e("td", null, e("span", { style: { fontWeight: 600 } }, m.name)),
                e("td", { className: "r" }, e("input", { className: "input num", type: "number", defaultValue: r ? r.rate : 0, style: { width: 90, textAlign: "right", padding: "6px 10px", marginLeft: "auto" } })),
                e("td", { className: "r muted-2", style: { fontSize: 12 } }, r && r.pm === null ? "default" : "override"));
            }))))))),

      tab === "payments" && e(window.Panel, { title: "Payment methods", sub: "Methods available at settlement", pad: false },
        e("table", { className: "tbl" },
          e("thead", null, e("tr", null, e("th", null, "Method"), e("th", null, "Status"), e("th", { className: "r" }, "Enabled"))),
          e("tbody", null, st.paymentMethods.map((m) =>
            e("tr", { key: m.id },
              e("td", null, e("div", { className: "row", style: { gap: 9 } }, e("div", { style: { width: 30, height: 30, borderRadius: 8, background: "var(--surface-3)", display: "grid", placeItems: "center", color: "var(--ink-2)" } }, e(Icon[m.id === "pm-cash" ? "cash" : m.id === "pm-card" ? "card" : "wallet"], { size: 15 })), e("span", { style: { fontWeight: 600 } }, m.name))),
              e("td", null, e("span", { className: "badge " + (m.active ? "b-ok" : "b-neutral") }, m.active ? "Active" : "Off")),
              e("td", { className: "r" }, e("div", { style: { display: "inline-flex" } }, e(window.Switch, { on: m.active, onClick: () => { S.update((s) => { s.paymentMethods = s.paymentMethods.map((x) => x.id === m.id ? { ...x, active: !x.active } : x); return s; }); } })))))))),

      tab === "printer" && e(window.Panel, { title: "Thermal printer" },
        e("div", { style: { display: "grid", gap: 14 } },
          e("div", { className: "grid g2" },
            e(window.Field, { label: "Connection" }, e(window.Select, { defaultValue: "network" }, e("option", { value: "network" }, "Network (IP)"), e("option", { value: "usb" }, "USB"))),
            e(window.Field, { label: "Paper width" }, e(window.Select, { defaultValue: "80mm" }, e("option", null, "80mm"), e("option", null, "58mm")))),
          e("div", { className: "grid g2" },
            e(window.Field, { label: "Printer IP" }, e(window.Input, { defaultValue: st.settings.printer.ip })),
            e(window.Field, { label: "Port" }, e(window.Input, { defaultValue: st.settings.printer.port }))),
          e("div", { className: "row", style: { gap: 10, marginTop: 4 } },
            e(window.Btn, { variant: "ghost", icon: "print", onClick: () => S.toast("Test page sent", "ok") }, "Print test page"),
            e(window.Btn, { variant: "primary", icon: "save", onClick: () => S.toast("Printer saved", "ok") }, "Save")))),

      tab === "backup" && e("div", { style: { display: "grid", gap: 16 } },
        e(window.Panel, { title: "Automatic backup", sub: "Database snapshots run nightly while offline-capable" },
          e("div", { className: "grid g3" },
            e(window.Field, { label: "Schedule" }, e(window.Select, { defaultValue: "nightly" }, e("option", null, "nightly"), e("option", null, "every 6 hours"))),
            e(window.Field, { label: "Time" }, e(window.Input, { type: "time", defaultValue: st.settings.backup_time })),
            e(window.Field, { label: "Retention (days)" }, e(window.Input, { type: "number", defaultValue: st.settings.backup_retention }))),
          e("div", { className: "row", style: { gap: 10, marginTop: 14 } },
            e(window.Btn, { variant: "primary", icon: "db", onClick: () => S.toast("Backup started…", "ok") }, "Back up now"),
            e(window.Btn, { variant: "danger-ghost", icon: "rotate", onClick: () => S.resetData() }, "Reset demo data"))),
        e(window.Panel, { title: "Recent backups", pad: false },
          e("table", { className: "tbl" },
            e("thead", null, e("tr", null, e("th", null, "File"), e("th", null, "Type"), e("th", { className: "r" }, "Size"), e("th", null, "Finished"), e("th", null, "Status"))),
            e("tbody", null, st.backups.map((b) =>
              e("tr", { key: b.id },
                e("td", { className: "num", style: { fontWeight: 600 } }, b.file),
                e("td", null, e("span", { className: "pill" }, b.type === "MANUAL" ? "Manual" : "Scheduled")),
                e("td", { className: "r num muted" }, (b.size / 1e6).toFixed(1) + " MB"),
                e("td", { className: "muted", style: { fontSize: 13 } }, H.fmtDateTime(b.finished)),
                e("td", null, e("span", { className: "badge b-ok" }, "Success")))))))) );
  }

  window.AuditScreen = Audit;
  window.UsersScreen = Users;
  window.SettingsScreen = Settings;
})();
