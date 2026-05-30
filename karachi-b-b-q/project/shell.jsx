/* ============================================================
   App shell — sidebar (role-filtered) + topbar + role switcher.
   ============================================================ */
(function () {
  const { useState } = React;
  const e = React.createElement;
  const Icon = window.Icon;
  const { ROLE_LABEL } = window.KBHelpers;

  /* Nav config: groups -> items. Each item lists roles allowed. */
  const NAV = [
    { group: "Operations", items: [
      { id: "dashboard", label: "Dashboard", icon: "dashboard", roles: ["SUPER_ADMIN", "INVENTORY_MANAGER", "SALES_MANAGER"] },
      { id: "counter", label: "New Order", icon: "counter", roles: ["SUPER_ADMIN", "SALES_MANAGER"] },
      { id: "orders", label: "Orders", icon: "orders", roles: ["SUPER_ADMIN", "SALES_MANAGER"], badge: "live" },
    ]},
    { group: "Catalog", items: [
      { id: "menu", label: "Menu & Dishes", icon: "chef", roles: ["SUPER_ADMIN", "INVENTORY_MANAGER"] },
      { id: "items", label: "Inventory Items", icon: "boxes", roles: ["SUPER_ADMIN", "INVENTORY_MANAGER"], badge: "low" },
      { id: "categories", label: "Categories", icon: "tag", roles: ["SUPER_ADMIN", "INVENTORY_MANAGER"] },
    ]},
    { group: "Stock", items: [
      { id: "grn", label: "Goods Received", icon: "truck", roles: ["SUPER_ADMIN", "INVENTORY_MANAGER"] },
      { id: "vendors", label: "Vendors", icon: "wallet", roles: ["SUPER_ADMIN", "INVENTORY_MANAGER"] },
      { id: "stockcount", label: "Stock Count", icon: "clipboard", roles: ["SUPER_ADMIN", "INVENTORY_MANAGER"] },
    ]},
    { group: "Insights", items: [
      { id: "reports", label: "Reports", icon: "chart", roles: ["SUPER_ADMIN"] },
      { id: "audit", label: "Audit Log", icon: "history", roles: ["SUPER_ADMIN"] },
    ]},
    { group: "System", items: [
      { id: "users", label: "Users & Roles", icon: "users", roles: ["SUPER_ADMIN"] },
      { id: "settings", label: "Settings", icon: "settings", roles: ["SUPER_ADMIN"] },
    ]},
  ];

  function Sidebar({ route, go, collapsed, setCollapsed, role, lowCount, liveCount }) {
    return e("aside", { className: "side" },
      e("div", { className: "side-brand", onClick: () => setCollapsed(!collapsed) },
        e("div", { className: "side-logo" }, e(Icon.flame, { size: 22, color: "#fff", sw: 2 })),
        e("div", { className: "side-brand-text" },
          e("b", null, "Karachi B.B.Q"),
          e("span", null, "POS · Clifton"))),
      e("nav", { className: "side-nav" },
        NAV.map((g) => {
          const items = g.items.filter((it) => it.roles.includes(role));
          if (!items.length) return null;
          return e(React.Fragment, { key: g.group },
            !collapsed && e("div", { className: "side-group" }, g.group),
            items.map((it) => {
              let badge = null;
              if (it.badge === "low" && lowCount) badge = lowCount;
              if (it.badge === "live" && liveCount) badge = liveCount;
              return e("button", { key: it.id, className: "nav-item" + (route.name === it.id ? " active" : ""), onClick: () => go(it.id), title: it.label },
                e(Icon[it.icon], { size: 19 }),
                e("span", null, it.label),
                badge != null && e("span", { className: "nav-badge num" }, badge));
            }));
        })),
      e("div", { className: "side-foot" },
        e("div", { className: "side-offline" },
          e("span", { className: "dot-ok" }),
          !collapsed && e("span", null, "Offline-ready · Synced 02:30"))));
  }

  function Topbar({ title, sub, lang, setLang, user, users, switchRole, onLogout }) {
    const [menu, setMenu] = useState(false);
    return e("header", { className: "topbar" },
      e("div", { className: "topbar-title" },
        e("b", null, title),
        sub && e("span", null, sub)),
      e("div", { className: "topbar-spacer" }),
      e("div", { className: "lang-toggle" },
        e("button", { className: lang === "en" ? "on" : "", onClick: () => setLang("en") }, "EN"),
        e("button", { className: lang === "ur" ? "on" : "", onClick: () => setLang("ur") }, "اردو")),
      e(window.IconBtn, { icon: "bell" }),
      e("div", { style: { position: "relative" } },
        e("button", { className: "user-chip", onClick: () => setMenu(!menu) },
          e(window.Avatar, { user }),
          e("div", { className: "user-chip-text" },
            e("b", null, user.full_name),
            e("span", null, ROLE_LABEL[user.role])),
          e(Icon.chevD, { size: 15, style: { color: "var(--ink-3)", marginRight: 4 } })),
        menu && e(RoleMenu, { users, current: user, onPick: (id) => { switchRole(id); setMenu(false); }, onClose: () => setMenu(false), onLogout })));
  }

  function RoleMenu({ users, current, onPick, onClose, onLogout }) {
    return e(React.Fragment, null,
      e("div", { style: { position: "fixed", inset: 0, zIndex: 40 }, onClick: onClose }),
      e("div", { style: { position: "absolute", top: "calc(100% + 8px)", right: 0, width: 268, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", boxShadow: "var(--sh-pop)", zIndex: 50, overflow: "hidden", padding: 6 } },
        e("div", { style: { fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 700, padding: "8px 10px 4px" } }, "Switch demo role"),
        users.filter((u) => u.active).map((u) =>
          e("button", { key: u.id, onClick: () => onPick(u.id), className: "row", style: { width: "100%", textAlign: "left", border: "none", background: u.id === current.id ? "var(--surface-3)" : "none", padding: "9px 10px", borderRadius: 8, cursor: "pointer", gap: 10 } },
            e(window.Avatar, { user: u, size: 30 }),
            e("div", { style: { lineHeight: 1.2, flex: 1 } },
              e("div", { style: { fontSize: 13, fontWeight: 700 } }, u.full_name),
              e("div", { style: { fontSize: 11.5, color: "var(--ink-2)" } }, ROLE_LABEL[u.role])),
            u.id === current.id && e(Icon.check, { size: 16, style: { color: "var(--accent)" } }))),
        e("hr", { className: "divider", style: { margin: "6px 4px" } }),
        e("button", { onClick: onLogout, className: "row", style: { width: "100%", textAlign: "left", border: "none", background: "none", padding: "9px 10px", borderRadius: 8, cursor: "pointer", gap: 10, color: "var(--danger)", fontWeight: 600, fontSize: 13 } },
          e(Icon.logout, { size: 16 }), "Sign out")));
  }

  window.Sidebar = Sidebar;
  window.Topbar = Topbar;
  window.NAV = NAV;
})();
