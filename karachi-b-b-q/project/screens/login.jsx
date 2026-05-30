/* ============================================================
   Login screen — password (admin/inventory) or PIN (sales)
   ============================================================ */
(function () {
  const { useState } = React;
  const e = React.createElement;
  const Icon = window.Icon;
  const { ROLE_LABEL } = window.KBHelpers;

  function Login({ onLogin }) {
    const S = window.useStore();
    const [mode, setMode] = useState("password"); // password | pin
    const [username, setUsername] = useState("owner");
    const [password, setPassword] = useState("");
    const [pin, setPin] = useState("");
    const [err, setErr] = useState("");

    const pinUsers = S.state.users.filter((u) => u.active && u.role === "SALES_MANAGER" && u.pin);

    function submitPassword() {
      const u = S.state.users.find((x) => x.username === username.trim() && x.active);
      if (!u) return setErr("No active user with that username.");
      // demo: password is anything 4+ chars, or just accept
      if (password.length < 1) return setErr("Enter your password.");
      S.audit("user", u.id, "LOGIN", u.full_name + " signed in (password)", null, null, u.id);
      onLogin(u.id);
    }
    function pressPin(d) {
      setErr("");
      if (d === "del") return setPin((p) => p.slice(0, -1));
      const np = (pin + d).slice(0, 4);
      setPin(np);
      if (np.length === 4) {
        const u = pinUsers.find((x) => x.pin === np);
        setTimeout(() => {
          if (u) { S.audit("user", u.id, "LOGIN", u.full_name + " signed in (PIN)", null, null, u.id); onLogin(u.id); }
          else { setErr("Incorrect PIN. Try again."); setPin(""); }
        }, 120);
      }
    }

    return e("div", { style: { minHeight: "100%", display: "grid", gridTemplateColumns: "1.05fr .95fr" } },
      /* Left brand panel */
      e("div", { style: { background: "linear-gradient(155deg, #1B1714 0%, #2A211A 55%, #3a2419 100%)", color: "var(--char-ink)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 60px", position: "relative", overflow: "hidden" } },
        e("div", { style: { position: "absolute", inset: 0, background: "radial-gradient(circle at 78% 18%, rgba(214,69,31,.34), transparent 46%), radial-gradient(circle at 12% 88%, rgba(180,51,15,.2), transparent 42%)" } }),
        e("div", { className: "row", style: { gap: 14, position: "relative" } },
          e("div", { className: "side-logo", style: { width: 50, height: 50, borderRadius: 13 } }, e(Icon.flame, { size: 28, color: "#fff", sw: 2 })),
          e("div", { style: { lineHeight: 1.1 } },
            e("div", { style: { fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap" } }, "Karachi B.B.Q"),
            e("div", { style: { fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--char-ink-2)", marginTop: 6 } }, "Inventory & Sales"))),
        e("div", { style: { position: "relative" } },
          e("h1", { style: { fontSize: 40, lineHeight: 1.08, maxWidth: 460, color: "#fff" } }, "Run the counter, kitchen and stock from one screen."),
          e("p", { style: { fontSize: 15.5, color: "var(--char-ink-2)", maxWidth: 420, marginTop: 18, lineHeight: 1.6 } }, "Take orders fast, print thermal bills, and every recipe automatically draws down inventory. Built to work even when the internet drops."),
          e("div", { className: "row", style: { gap: 22, marginTop: 32 } },
            [["Offline-first", "db"], ["Auto stock deduction", "boxes"], ["Thermal printing", "print"]].map(([t, ic]) =>
              e("div", { key: t, className: "row", style: { gap: 8, fontSize: 13, color: "var(--char-ink-2)" } },
                e(Icon[ic], { size: 16 }), t)))),
        e("div", { style: { position: "relative", fontSize: 12.5, color: "#7d6c59" } }, "Boat Basin · Block 5, Clifton, Karachi · Est. 1998")),
      /* Right login panel */
      e("div", { style: { display: "grid", placeItems: "center", padding: 40 } },
        e("div", { style: { width: "100%", maxWidth: 380 } },
          e("h2", { style: { fontSize: 26 } }, "Welcome back"),
          e("p", { className: "muted", style: { fontSize: 14, marginTop: 6, marginBottom: 26 } }, "Sign in to continue to your shift."),
          e("div", { className: "seg", style: { width: "100%", marginBottom: 24 } },
            e("button", { className: mode === "password" ? "on" : "", style: { flex: 1 }, onClick: () => { setMode("password"); setErr(""); } }, "Manager login"),
            e("button", { className: mode === "pin" ? "on" : "", style: { flex: 1 }, onClick: () => { setMode("pin"); setErr(""); } }, "Counter PIN")),

          mode === "password"
            ? e("div", { style: { display: "flex", flexDirection: "column", gap: 16 } },
                e(window.Field, { label: "Username" }, e(window.Input, { icon: "users", value: username, onChange: (ev) => setUsername(ev.target.value), placeholder: "owner" })),
                e(window.Field, { label: "Password" }, e(window.Input, { icon: "lock", type: "password", value: password, onChange: (ev) => setPassword(ev.target.value), placeholder: "••••••••", onKeyDown: (ev) => ev.key === "Enter" && submitPassword() })),
                err && e("div", { className: "row", style: { gap: 7, color: "var(--danger)", fontSize: 13, fontWeight: 600 } }, e(Icon.alert, { size: 15 }), err),
                e(window.Btn, { variant: "primary", size: "lg", block: true, onClick: submitPassword, iconRight: "chevR" }, "Sign in"),
                e("div", { style: { fontSize: 12, color: "var(--ink-3)", textAlign: "center", lineHeight: 1.6 } }, "Demo: owner / inventory · any password"))
            : e("div", null,
                e("div", { className: "row", style: { justifyContent: "center", gap: 12, marginBottom: 22 } },
                  [0, 1, 2, 3].map((i) => e("div", { key: i, style: { width: 16, height: 16, borderRadius: 99, border: "2px solid " + (pin.length > i ? "var(--accent)" : "var(--line-strong)"), background: pin.length > i ? "var(--accent)" : "transparent", transition: ".15s" } }))),
                err && e("div", { className: "row", style: { gap: 7, color: "var(--danger)", fontSize: 13, fontWeight: 600, justifyContent: "center", marginBottom: 14 } }, e(Icon.alert, { size: 15 }), err),
                e("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 } },
                  ["1","2","3","4","5","6","7","8","9","","0","del"].map((d, i) =>
                    d === "" ? e("div", { key: i }) :
                    e("button", { key: i, onClick: () => pressPin(d), style: { height: 62, borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 22, fontFamily: "var(--font-display)", fontWeight: 600, cursor: "pointer", color: "var(--ink)", display: "grid", placeItems: "center" } },
                      d === "del" ? e(Icon.chevL, { size: 20 }) : d))),
                e("div", { style: { fontSize: 12, color: "var(--ink-3)", textAlign: "center", lineHeight: 1.7, marginTop: 18 } },
                  "Demo PINs — Bilal: 1357 · Fahad: 9753")))));
  }

  window.LoginScreen = Login;
})();
