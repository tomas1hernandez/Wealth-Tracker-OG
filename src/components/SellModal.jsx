import { useState } from "react";
import { fmtCcy } from "../lib/calc.js";
import { Lbl, Modal } from "./bits.jsx";

export default function SellModal({ inv, H, onConfirm, onClose }) {
  const [sp, setSp] = useState("");
  const [sd, setSd] = useState(new Date().toISOString().slice(0, 10));
  const ccy = inv.currency || "USD";
  const totalSale = sp ? (inv.category === "stock" ? +sp * (inv.shares || 0) : +sp) : 0;
  const g = totalSale - H.costInv(inv);
  return (
    <Modal title="Mark as Sold" onClose={onClose} maxWidth={430}>
      <p style={{ margin: "0 0 4px", color: "var(--muted)", fontSize: 13 }}>{inv.name || inv.ticker || "Investment"}</p>
      <p style={{ margin: "0 0 20px", color: "var(--faint)", fontSize: 11.5 }}>
        This moves the position to History and removes it from your portfolio and net worth.
      </p>
      <div style={{ marginBottom: 14 }}>
        <Lbl>{inv.category === "stock" ? `Sale Price per Share (${ccy})` : `Total Sale Proceeds (${ccy})`}</Lbl>
        <input type="number" step="any" className="input" value={sp} onChange={(e) => setSp(e.target.value)} placeholder={inv.category === "stock" ? "195.00" : "350000"} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Lbl>Sale Date</Lbl>
        <input type="date" className="input" value={sd} onChange={(e) => setSd(e.target.value)} />
      </div>
      {sp && (
        <div style={{ background: g >= 0 ? "var(--green-soft)" : "var(--red-soft)", border: `1px solid ${g >= 0 ? "rgba(46,189,133,0.25)" : "rgba(229,72,77,0.25)"}`, borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span className="muted">Proceeds</span><b className="num">{fmtCcy(totalSale, ccy)}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="muted">Realized G/L</span>
            <b className={`num ${g >= 0 ? "pos" : "neg"}`}>{g >= 0 ? "+" : ""}{fmtCcy(g, ccy)}</b>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" style={{ flex: 2 }} disabled={!sp} onClick={() => sp && onConfirm(+sp, sd)}>
          Confirm Sale
        </button>
      </div>
    </Modal>
  );
}
