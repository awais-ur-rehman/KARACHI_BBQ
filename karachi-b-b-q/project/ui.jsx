/* ============================================================
   UI kit — shared components. Exported to window.
   ============================================================ */
(function () {
  const { useState, useEffect, useRef } = React;
  const e = React.createElement;
  const Icon = window.Icon;

  /* Badge */
  function Badge({ kind, children, dot }) {
    return e("span", { className: "badge b-" + (kind || "neutral") },
      dot && e("span", { className: "bdot" }), children);
  }

  /* Status badge for orders */
  function StatusBadge({ status }) {
    const cls = window.KBHelpers.STATUS_CLASS[status] || "b-neutral";
    const label = status.charAt(0) + status.slice(1).toLowerCase();
    return e("span", { className: "badge " + cls }, e("span", { className: "bdot" }), label);
  }

  /* Button */
  function Btn({ variant = "ghost", size, block, icon, iconRight, children, ...rest }) {
    const IC = icon && Icon[icon];
    const ICR = iconRight && Icon[iconRight];
    return e("button", { className: ["btn", "btn-" + variant, size && "btn-" + size, block && "btn-block"].filter(Boolean).join(" "), ...rest },
      IC && e(IC, { size: size === "sm" ? 15 : 17 }),
      children && e("span", null, children),
      ICR && e(ICR, { size: size === "sm" ? 15 : 17 }));
  }

  /* Icon button */
  function IconBtn({ icon, ...rest }) {
    const IC = Icon[icon];
    return e("button", { className: "icon-btn", ...rest }, e(IC, { size: 18 }));
  }

  /* Field wrapper */
  function Field({ label, hint, children, style }) {
    return e("div", { className: "field", style },
      label && e("label", null, label),
      children,
      hint && e("div", { className: "hint" }, hint));
  }

  function Input({ icon, ...rest }) {
    if (icon) {
      const IC = Icon[icon];
      return e("div", { className: "input-icon" }, e(IC, { size: 16 }), e("input", { className: "input", ...rest }));
    }
    return e("input", { className: "input", ...rest });
  }
  function Select({ children, ...rest }) { return e("select", { className: "select", ...rest }, children); }
  function Textarea(rest) { return e("textarea", { className: "textarea", rows: 3, ...rest }); }

  function Switch({ on, onClick }) {
    return e("button", { className: "switch" + (on ? " on" : ""), onClick, type: "button", "aria-pressed": on });
  }

  /* Segmented control */
  function Seg({ value, onChange, options, accent }) {
    return e("div", { className: "seg" + (accent ? " seg-accent" : "") },
      options.map((o) => e("button", { key: o.value, className: value === o.value ? "on" : "", onClick: () => onChange(o.value) }, o.label)));
  }

  /* Tabs */
  function Tabs({ value, onChange, tabs }) {
    return e("div", { className: "tabs" },
      tabs.map((t) => e("button", { key: t.value, className: "tab" + (value === t.value ? " active" : ""), onClick: () => onChange(t.value) }, t.label)));
  }

  /* Modal */
  function Modal({ title, sub, onClose, children, footer, width }) {
    useEffect(() => {
      const h = (ev) => ev.key === "Escape" && onClose && onClose();
      window.addEventListener("keydown", h);
      return () => window.removeEventListener("keydown", h);
    }, []);
    return e("div", { className: "overlay", onMouseDown: (ev) => ev.target === ev.currentTarget && onClose && onClose() },
      e("div", { className: "modal", style: width ? { maxWidth: width } : null },
        title && e("div", { className: "modal-head" },
          e("div", null,
            e("h2", null, title),
            sub && e("div", { className: "sub" }, sub)),
          onClose && e("button", { className: "icon-btn modal-x", onClick: onClose }, e(Icon.x, { size: 18 }))),
        e("div", { className: "modal-body" }, children),
        footer && e("div", { className: "modal-foot" }, footer)));
  }

  /* Confirm dialog */
  function Confirm({ title, message, confirmLabel = "Confirm", danger, onConfirm, onClose, children }) {
    return e(Modal, { title, onClose, width: 460, footer: e(React.Fragment, null,
      e(Btn, { variant: "ghost", onClick: onClose }, "Cancel"),
      e(Btn, { variant: danger ? "danger" : "primary", onClick: onConfirm }, confirmLabel)) },
      message && e("p", { style: { margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55 } }, message),
      children);
  }

  /* Stat card */
  function Stat({ label, value, prefix, suffix, sub, icon, tone = "accent" }) {
    const IC = icon && Icon[icon];
    const toneBg = { accent: "var(--accent-soft)", ok: "var(--st-completed-bg)", warn: "var(--st-pending-bg)", info: "var(--st-delivered-bg)" }[tone];
    const toneFg = { accent: "var(--accent-700)", ok: "var(--ok)", warn: "var(--warn)", info: "var(--st-delivered)" }[tone];
    return e("div", { className: "stat" },
      IC && e("div", { className: "stat-ic", style: { background: toneBg, color: toneFg } }, e(IC, { size: 18 })),
      e("div", { className: "stat-label" }, label),
      e("div", { className: "stat-val num" }, prefix && e("small", null, prefix), value, suffix && e("small", null, " " + suffix)),
      sub && e("div", { className: "stat-sub" }, sub));
  }

  /* Empty state */
  function Empty({ icon, title, children, action }) {
    const IC = icon && Icon[icon];
    return e("div", { className: "empty" },
      IC && e("div", { className: "empty-ic" }, e(IC, { size: 26 })),
      e("h3", null, title),
      children && e("p", null, children),
      action);
  }

  /* Avatar */
  function Avatar({ user, size = 32 }) {
    const initials = user.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("");
    return e("div", { className: "avatar", style: { background: user.color, width: size, height: size, fontSize: size * .4 } }, initials);
  }

  /* Qty stepper */
  function Stepper({ value, onChange, min = 0, disabled }) {
    return e("div", { className: "row", style: { gap: 0, border: "1px solid var(--line-strong)", borderRadius: "var(--r-sm)", overflow: "hidden", background: "var(--surface)" } },
      e("button", { className: "stp", disabled: disabled || value <= min, onClick: () => onChange(Math.max(min, value - 1)),
        style: stpStyle }, e(Icon.minus, { size: 15 })),
      e("span", { className: "num", style: { minWidth: 34, textAlign: "center", fontWeight: 700, fontSize: 14 } }, value),
      e("button", { className: "stp", disabled, onClick: () => onChange(value + 1), style: stpStyle }, e(Icon.plus, { size: 15 })));
  }
  const stpStyle = { width: 30, height: 32, border: "none", background: "none", display: "grid", placeItems: "center", cursor: "pointer", color: "var(--ink-2)" };

  /* Section card with header */
  function Panel({ title, sub, actions, children, pad = true, style }) {
    return e("div", { className: "card", style },
      (title || actions) && e("div", { className: "row between", style: { padding: "16px 20px", borderBottom: "1px solid var(--line)", gap: 12 } },
        e("div", { style: { minWidth: 0 } },
          title && e("div", { style: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, whiteSpace: "nowrap" } }, title),
          sub && e("div", { style: { fontSize: 12.5, color: "var(--ink-2)", marginTop: 2 } }, sub)),
        actions && e("div", { className: "row", style: { flex: "0 0 auto" } }, actions)),
      e("div", { style: pad ? { padding: 20 } : null }, children));
  }

  Object.assign(window, {
    Badge, StatusBadge, Btn, IconBtn, Field, Input, Select, Textarea,
    Switch, Seg, Tabs, Modal, Confirm, Stat, Empty, Avatar, Stepper, Panel,
  });
})();
