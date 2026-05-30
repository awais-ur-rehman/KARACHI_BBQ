/* ============================================================
   Order mutations — shared across Counter / Order detail.
   window.KBOrders.{deductStock, restock, printBill, settle, cancel, saveDraft, create}
   ============================================================ */
(function () {
  const H = window.KBHelpers;

  function applyConsumption(items, consumption, sign) {
    // sign +1 to add back, -1 to deduct
    return items.map((it) => {
      if (consumption[it.id]) return { ...it, qty: Math.round((it.qty + sign * consumption[it.id]) * 1000) / 1000 };
      return it;
    });
  }

  function genNumber(order, state) {
    const d = "20260530";
    if (order.category === "PARCEL") return "P-" + String(order.parcel).padStart(5, "0");
    const prefix = order.category === "GENTS_HALL" ? "G" : "F";
    const t = new Date().toTimeString().slice(0, 5).replace(":", "");
    return prefix + String(order.table).padStart(2, "0") + "-" + d + "-" + t;
  }

  const KBOrders = {
    genNumber,

    /* create or update a draft order in state, return its id */
    saveDraft(S, draft) {
      const id = draft.id || window.KB_uid("o");
      S.update((s) => {
        const exists = s.orders.find((o) => o.id === id);
        const order = {
          id,
          number: draft.number || genNumber(draft, s),
          category: draft.category,
          table: draft.table || null,
          parcel: draft.parcel || null,
          status: "DRAFT",
          created_by: exists ? exists.created_by : S.session.userId,
          created_at: exists ? exists.created_at : new Date().toISOString(),
          items: draft.items,
          discount: draft.discount || 0,
        };
        if (draft.category === "PARCEL" && !exists) s.nextParcel = (s.nextParcel || 234) + 1;
        s.orders = exists ? s.orders.map((o) => (o.id === id ? order : o)) : [order, ...s.orders];
        return s;
      });
      return id;
    },

    /* print bill: deduct stock, lock order to PRINTED */
    printBill(S, orderId) {
      let ok = true;
      S.update((s) => {
        const order = s.orders.find((o) => o.id === orderId);
        if (!order || order.status !== "DRAFT") return s;
        const cons = H.orderConsumption(s, order);
        s.items = applyConsumption(s.items, cons, -1);
        s.orders = s.orders.map((o) => o.id === orderId ? { ...o, status: "PRINTED", printed_at: new Date().toISOString() } : o);
        return s;
      });
      const order = S.state.orders.find((o) => o.id === orderId);
      S.audit("order", orderId, "PRINT", "Bill printed for " + (order ? order.number : orderId) + " — order locked, stock deducted", { status: "DRAFT" }, { status: "PRINTED" });
      return ok;
    },

    markDelivered(S, orderId) {
      S.update((s) => {
        s.orders = s.orders.map((o) => o.id === orderId ? { ...o, status: "DELIVERED", delivered_at: new Date().toISOString() } : o);
        return s;
      });
      const order = S.state.orders.find((o) => o.id === orderId);
      S.audit("order", orderId, "DELIVER", "Order " + (order ? order.number : "") + " marked delivered", null, null);
    },

    settle(S, orderId, method, bill) {
      S.update((s) => {
        s.orders = s.orders.map((o) => o.id === orderId ? { ...o, status: "COMPLETED", settled_method: method, settled_total: bill.total, discount: bill.discount, completed_at: new Date().toISOString(), delivered_at: o.delivered_at || new Date().toISOString() } : o);
        return s;
      });
      const order = S.state.orders.find((o) => o.id === orderId);
      const pm = S.state.paymentMethods.find((m) => m.id === method);
      S.audit("order", orderId, "PAYMENT", "Payment recorded — " + (pm ? pm.name : method) + " " + H.money(bill.total) + " for " + (order ? order.number : ""), null, { method: pm ? pm.name : method, total: bill.total });
    },

    cancel(S, orderId, reason, restock) {
      S.update((s) => {
        const order = s.orders.find((o) => o.id === orderId);
        if (!order) return s;
        const wasLocked = ["PRINTED", "DELIVERED"].includes(order.status);
        if (wasLocked && restock) {
          const cons = H.orderConsumption(s, order);
          s.items = applyConsumption(s.items, cons, +1);
        }
        s.orders = s.orders.map((o) => o.id === orderId ? { ...o, status: "CANCELLED", cancelled_at: new Date().toISOString(), cancelled_by: S.session.userId, cancel_reason: reason, cancel_restocked: wasLocked && restock } : o);
        return s;
      });
      const order = S.state.orders.find((o) => o.id === orderId);
      S.audit("order", orderId, "CANCEL", "Cancelled order " + (order ? order.number : "") + (restock ? " (restocked)" : "") + (reason ? " — " + reason : ""), null, { status: "CANCELLED", cancel_restocked: restock });
    },

    deleteDraft(S, orderId) {
      S.update((s) => { s.orders = s.orders.filter((o) => o.id !== orderId); return s; });
    },
  };

  window.KBOrders = KBOrders;
})();
