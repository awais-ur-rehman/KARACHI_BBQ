/* ============================================================
   App — router + shell wiring + Tweaks
   ============================================================ */
(function () {
  const { useState, useEffect } = React;
  const e = React.createElement;
  const H = window.KBHelpers;

  /* Tweak defaults */
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "accent": "#D6451F",
    "fontPair": "grotesque"
  }/*EDITMODE-END*/;

  const ACCENTS = {
    "#D6451F": { a700: "#A8330F", soft: "#FBEAE1" },   // ember
    "#C0392B": { a700: "#962017", soft: "#F8E2DE" },   // chili red
    "#B5791E": { a700: "#8A5C12", soft: "#F8EBCF" },   // tandoor gold
    "#2F7A53": { a700: "#1F5B3C", soft: "#DBEFE3" },   // mint herb
    "#7B4FA3": { a700: "#5C3880", soft: "#EEE4F6" },   // jamun
  };
  const FONTS = {
    grotesque: { display: '"Bricolage Grotesque", sans-serif', body: '"Hanken Grotesk", sans-serif' },
    editorial: { display: '"Fraunces", serif', body: '"Hanken Grotesk", sans-serif' },
    modern: { display: '"Space Grotesk", sans-serif', body: '"Inter", sans-serif' },
    classic: { display: '"DM Serif Display", serif', body: '"DM Sans", sans-serif' },
  };

  const TITLES = {
    dashboard: ["Dashboard", null], counter: ["New Order", "Counter"], orders: ["Orders", null],
    order: ["Order", null], bill: ["Bill", null], menu: ["Menu & Dishes", null], items: ["Inventory Items", null],
    item: ["Item", null], categories: ["Categories", null], grn: ["Goods Received", null], vendors: ["Vendors", null],
    stockcount: ["Stock Count", null], reports: ["Reports", null], audit: ["Audit Log", null], users: ["Users & Roles", null], settings: ["Settings", null],
  };
  /* role access guard */
  const ACCESS = {
    SALES_MANAGER: ["dashboard", "counter", "orders", "order", "bill"],
    INVENTORY_MANAGER: ["dashboard", "menu", "items", "item", "categories", "grn", "vendors", "stockcount"],
    SUPER_ADMIN: null, // all
  };

  function Shell({ route, go }) {
    const S = window.useStore();
    const user = S.currentUser();
    const [collapsed, setCollapsed] = useState(false);
    const [lang, setLang] = useState("en");
    const st = S.state;
    const lowCount = H.lowStockItems(st).length;
    const liveCount = st.orders.filter((o) => ["DRAFT", "PRINTED", "DELIVERED"].includes(o.status)).length;

    const [title, sub] = TITLES[route.name] || ["", null];
    const fullBleed = route.name === "counter" && route.params && (route.params.id || route.params.cat || S._wsActive);

    function render() {
      const P = {
        dashboard: window.DashboardScreen, counter: window.CounterScreen, orders: window.OrdersScreen,
        order: window.OrderDetailScreen, bill: window.OrderDetailScreen, menu: window.MenuScreen,
        items: window.ItemsScreen, item: window.ItemEditorScreen, categories: window.CategoriesScreen,
        grn: window.GRNScreen, vendors: window.VendorsScreen, stockcount: window.StockCountScreen,
        reports: window.ReportsScreen, audit: window.AuditScreen, users: window.UsersScreen, settings: window.SettingsScreen,
      }[route.name];
      if (!P) return e(window.Empty, { icon: "alert", title: "Screen not found" });
      // access guard
      const allowed = ACCESS[user.role];
      if (allowed && !allowed.includes(route.name)) {
        return e("div", { className: "page" }, e(window.Empty, { icon: "lock", title: "No access", children: "Your role (" + H.ROLE_LABEL[user.role] + ") can't open this screen. Switch role from the top-right.", action: e(window.Btn, { variant: "ghost", onClick: () => go("dashboard") }, "Go to dashboard") }));
      }
      return e(P, { route, go });
    }

    const isCounterWorkspace = route.name === "counter";

    return e("div", { className: "app" + (collapsed ? " collapsed" : "") },
      e(window.Sidebar, { route, go, collapsed, setCollapsed, role: user.role, lowCount, liveCount }),
      e("div", { className: "main" },
        e(window.Topbar, { title, sub, lang, setLang, user, users: st.users, switchRole: (id) => { S.setSession({ userId: id }); go("dashboard"); }, onLogout: () => { S.setSession(null); } }),
        isCounterWorkspace
          ? e("div", { className: "content", style: { overflow: "hidden", padding: 0 } }, render())
          : e("div", { className: "content" }, render())));
  }

  function App() {
    const S = window.useStore();
    const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
    const [route, setRoute] = useState({ name: "dashboard", params: {} });

    // apply tweaks to :root
    useEffect(() => {
      const r = document.documentElement;
      const acc = ACCENTS[t.accent] || ACCENTS["#D6451F"];
      r.style.setProperty("--accent", t.accent);
      r.style.setProperty("--accent-700", acc.a700);
      r.style.setProperty("--accent-soft", acc.soft);
      const f = FONTS[t.fontPair] || FONTS.grotesque;
      r.style.setProperty("--font-display", f.display);
      r.style.setProperty("--font-body", f.body);
    }, [t.accent, t.fontPair]);

    function go(name, params) { setRoute({ name, params: params || {} }); document.querySelector(".content") && (document.querySelector(".content").scrollTop = 0); }

    if (!S.session) return e(React.Fragment, null,
      e(window.LoginScreen, { onLogin: (id) => { S.setSession({ userId: id }); setRoute({ name: "dashboard", params: {} }); } }),
      e(TweaksUI, { t, setTweak }));

    return e(React.Fragment, null,
      e(Shell, { route, go }),
      e(TweaksUI, { t, setTweak }));
  }

  function TweaksUI({ t, setTweak }) {
    return e(window.TweaksPanel, null,
      e(window.TweakSection, { label: "Brand accent" }),
      e(window.TweakColor, { label: "Accent colour", value: t.accent, options: Object.keys(window.__KB_ACCENTS || {}).length ? Object.keys(window.__KB_ACCENTS) : ["#D6451F", "#C0392B", "#B5791E", "#2F7A53", "#7B4FA3"], onChange: (v) => setTweak("accent", v) }),
      e(window.TweakSection, { label: "Typography" }),
      e(window.TweakSelect, { label: "Font pairing", value: t.fontPair, options: [
        { value: "grotesque", label: "Bricolage + Hanken (default)" },
        { value: "editorial", label: "Fraunces + Hanken" },
        { value: "modern", label: "Space Grotesk + Inter" },
        { value: "classic", label: "DM Serif + DM Sans" },
      ], onChange: (v) => setTweak("fontPair", v) }));
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(e(window.StoreProvider, null, e(App)));
})();
