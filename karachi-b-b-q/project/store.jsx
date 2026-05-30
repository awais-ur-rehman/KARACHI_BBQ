/* ============================================================
   Store — global app state, persistence, business logic.
   Exposes window.useStore() hook + window.KBHelpers.
   ============================================================ */
(function () {
  const { useState, useEffect, useRef, createContext, useContext, useCallback } = React;
  const LS_KEY = "kbbq_state_v1";

  /* ---------- helpers ---------- */
  const money = (n) => "₨" + Math.round(n).toLocaleString("en-PK");
  const money0 = (n) => Math.round(n).toLocaleString("en-PK");
  const fmtQty = (n) => (Number.isInteger(n) ? n : n.toFixed(n < 1 ? 3 : 2)).toString().replace(/\.?0+$/, (m) => m.includes(".") ? "" : m);
  function timeAgo(iso) {
    const d = new Date(iso), now = new Date("2026-05-30T21:30:00");
    const s = Math.round((now - d) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  }
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const fmtDateTime = (iso) => fmtDate(iso) + " · " + fmtTime(iso);

  const CATEGORY_LABEL = { GENTS_HALL: "Gents Hall", FAMILY_HALL: "Family Hall", PARCEL: "Parcel" };
  const ROLE_LABEL = { SUPER_ADMIN: "Super Admin", INVENTORY_MANAGER: "Inventory Manager", SALES_MANAGER: "Sales Manager" };
  const STATUS_CLASS = { DRAFT: "b-draft", PRINTED: "b-printed", DELIVERED: "b-delivered", COMPLETED: "b-completed", CANCELLED: "b-cancelled" };

  /* convert a recipe-line qty (in its unit) to stock-unit qty for the item */
  function toStockUnits(seed, itemId, qty, unit) {
    const item = seed.items.find((i) => i.id === itemId);
    if (!item) return qty;
    const u = seed.units.find((x) => x.id === unit);
    const su = seed.units.find((x) => x.id === item.unit);
    if (!u || !su || u.family !== su.family) return qty; // assume same unit
    return (qty * u.factor) / su.factor;
  }

  /* compute the items a dish consumes, in stock units, scaled by order qty */
  function dishConsumption(state, dishId, orderQty) {
    const d = state.dishes.find((x) => x.id === dishId);
    const out = {};
    if (!d) return out;
    if (d.type === "RESALE" && d.resale_item) {
      out[d.resale_item] = orderQty;
    } else if (d.recipe) {
      d.recipe.forEach((r) => {
        out[r.item] = (out[r.item] || 0) + toStockUnits(state, r.item, r.qty, r.unit) * orderQty;
      });
    }
    return out;
  }

  /* full consumption for an order */
  function orderConsumption(state, order) {
    const total = {};
    order.items.forEach((li) => {
      const c = dishConsumption(state, li.dish, li.qty);
      Object.entries(c).forEach(([k, v]) => (total[k] = (total[k] || 0) + v));
    });
    return total;
  }

  /* BILL calc: subtotal, discount, charges (depend on category + payment method) */
  function calcBill(state, order, opts = {}) {
    const discount = opts.discount != null ? opts.discount : order.discount || 0;
    const pmId = opts.method || order.settled_method || null;
    const subtotal = order.items.reduce((s, li) => s + li.price * li.qty, 0);
    const afterDisc = Math.max(0, subtotal - discount);
    const charges = [];
    state.charges
      .filter((c) => c.active && c.applies.includes(order.category))
      .sort((a, b) => a.sort - b.sort)
      .forEach((c) => {
        // find rate for this payment method, else default (pm null)
        let rate = state.chargeRates.find((r) => r.charge === c.id && r.pm === pmId);
        if (!rate) rate = state.chargeRates.find((r) => r.charge === c.id && r.pm === null);
        const pct = rate ? rate.rate : 0;
        const base = c.base === "SUBTOTAL_AFTER_DISCOUNT" ? afterDisc : subtotal;
        const amount = (base * pct) / 100;
        charges.push({ id: c.id, name: c.name, pct, amount });
      });
    const chargeTotal = charges.reduce((s, c) => s + c.amount, 0);
    const total = afterDisc + chargeTotal;
    return { subtotal, discount, afterDisc, charges, chargeTotal, total };
  }

  function lowStockItems(state) {
    return state.items.filter((i) => i.active && i.qty <= i.reorder);
  }

  /* ---------- initial state ---------- */
  function freshState() {
    const seed = JSON.parse(JSON.stringify(window.KB_SEED));
    return { ...seed, _auditSeq: 142 };
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return freshState();
  }

  /* ---------- Context ---------- */
  const Ctx = createContext(null);

  function StoreProvider({ children }) {
    const [state, setState] = useState(loadState);
    const [session, setSession] = useState(null); // { userId }
    const [toasts, setToasts] = useState([]);
    const toastId = useRef(0);

    useEffect(() => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
    }, [state]);

    const toast = useCallback((msg, kind = "ok") => {
      const id = ++toastId.current;
      setToasts((t) => [...t, { id, msg, kind }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
    }, []);

    const update = useCallback((fn) => setState((s) => fn({ ...s }) || s), []);

    /* push audit event */
    const audit = useCallback((entity, entity_id, action, summary, before, after, actorId) => {
      setState((s) => {
        const seq = (s._auditSeq || 0) + 1;
        const ev = { id: window.KB_uid("a"), seq, entity, entity_id, action, actor: actorId || (session && session.userId) || "u-admin", at: new Date().toISOString(), summary, before: before || null, after: after || null };
        return { ...s, _auditSeq: seq, audit: [ev, ...s.audit] };
      });
    }, [session]);

    const api = {
      state, setState, update, toast, audit,
      session, setSession,
      currentUser: () => state.users.find((u) => u.id === (session && session.userId)),
      resetData: () => { setState(freshState()); toast("Demo data reset", "ok"); },
    };

    return React.createElement(Ctx.Provider, { value: api },
      children,
      React.createElement(ToastHost, { toasts })
    );
  }

  function ToastHost({ toasts }) {
    if (!toasts.length) return null;
    return React.createElement("div", { className: "toast-wrap" },
      toasts.map((t) =>
        React.createElement("div", { key: t.id, className: "toast " + t.kind },
          React.createElement(window.Icon[t.kind === "warn" ? "warn" : "check"], { size: 16 }),
          React.createElement("span", null, t.msg))
      ));
  }

  window.StoreProvider = StoreProvider;
  window.useStore = () => useContext(Ctx);
  window.KBHelpers = {
    money, money0, fmtQty, timeAgo, fmtTime, fmtDate, fmtDateTime,
    CATEGORY_LABEL, ROLE_LABEL, STATUS_CLASS,
    calcBill, orderConsumption, dishConsumption, lowStockItems, toStockUnits,
  };
})();
