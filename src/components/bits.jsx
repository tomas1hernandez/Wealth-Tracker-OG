import { useEffect, useRef, useState } from "react";
import { DollarSign, TrendingUp, Landmark, Building2, Search } from "lucide-react";
import { CCOLOR, TICKERS } from "../lib/constants.js";

export function CatIcon({ cat, size = 18, color, sw = 1.7 }) {
  const c = color || CCOLOR[cat];
  if (cat === "cash") return <DollarSign size={size} color={c} strokeWidth={sw} />;
  if (cat === "stock") return <TrendingUp size={size} color={c} strokeWidth={sw} />;
  if (cat === "bond") return <Landmark size={size} color={c} strokeWidth={sw} />;
  if (cat === "asset") return <Building2 size={size} color={c} strokeWidth={sw} />;
  return null;
}

export const Lbl = ({ children }) => <label className="lbl">{children}</label>;
export const FRow = ({ children, cols }) => (
  <div className="frow" style={cols ? { gridTemplateColumns: cols } : undefined}>{children}</div>
);
export const FField = ({ label, children }) => (
  <div><Lbl>{label}</Lbl>{children}</div>
);

export function CcyPicker({ currency, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 15 }}>
      <Lbl>Currency</Lbl>
      <div className="seg" style={{ marginTop: -6 }}>
        {["USD", "MXN"].map((c) => (
          <button key={c} type="button" className={currency === c ? "on" : ""} onClick={() => onChange(c)}>
            {c === "USD" ? "🇺🇸 USD" : "🇲🇽 MXN"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TickerSearch({ ticker, onSelect }) {
  const [q, setQ] = useState(ticker || "");
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const hits =
    q.length > 0
      ? TICKERS.filter(
          (t) =>
            t.t.toUpperCase().includes(q.toUpperCase()) ||
            t.n.toLowerCase().includes(q.toLowerCase())
        ).slice(0, 9)
      : [];
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          className="input"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); onSelect({ t: e.target.value.toUpperCase(), n: "Custom" }); }}
          onFocus={() => setOpen(true)}
          placeholder="Any ticker — NYSE · NASDAQ · Crypto…"
        />
        <Search size={13} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--faint)", pointerEvents: "none" }} />
      </div>
      {open && hits.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#10151d", border: "1px solid var(--border-strong)", borderRadius: 10, zIndex: 700, maxHeight: 260, overflowY: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}>
          {hits.map((t) => (
            <div
              key={t.t}
              onMouseDown={() => { setQ(t.t); onSelect(t); setOpen(false); }}
              style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,168,106,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--accent)" }}>{t.t}</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{t.n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Row({ l, rv, c, last }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <span style={{ color: "var(--muted)", fontSize: 13 }}>{l}</span>
      <span className="num" style={{ fontWeight: 600, fontSize: 13, color: c || "var(--text)" }}>{rv}</span>
    </div>
  );
}

export function Modal({ title, onClose, children, maxWidth = 560, accent }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth, borderColor: accent ? `${accent}40` : undefined }}>
        <div className="modal-head">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
