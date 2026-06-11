import { useState } from "react";
import { Info, Edit2, Trash2, CheckCircle } from "lucide-react";
import { CLABEL, CCOLOR, BOND_TYPES } from "../lib/constants.js";
import { loanCalc, fmtPct } from "../lib/calc.js";
import { CatIcon } from "./bits.jsx";

export default function InvCard({ inv, H, onEdit, onSell, onDetail, onDel }) {
  const ccy = inv.currency || "USD";
  const v = H.valInv(inv), g = H.glInv(inv), r = H.roiInv(inv), ar = H.annROI(inv);
  const $i = (n) => H.$d(n, ccy);
  const ticker = inv.ticker?.toUpperCase();
  const live = inv.category === "stock" ? H.prices[ticker] : null;
  const priceNA = H.pricesFetched && inv.category === "stock" && live === null && !inv.manualPrice;
  const lc = inv.category === "asset" && inv.hasLoan ? loanCalc(inv.loan) : null;
  const [hov, setHov] = useState(false);
  const col = CCOLOR[inv.category];

  return (
    <div
      className="card"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ borderColor: hov ? `${col}55` : "var(--border)", transition: "all 0.18s", transform: hov ? "translateY(-2px)" : "none", position: "relative", overflow: "hidden", padding: 20 }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: col }} />
      <div style={{ paddingLeft: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${col}12`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${col}28` }}>
              <CatIcon cat={inv.category} size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {inv.name || (inv.category === "stock" ? inv.ticker : "Unnamed")}
                {ticker && inv.category === "stock" && (
                  <span className="tag" style={{ background: `${col}16`, color: col, border: `1px solid ${col}30` }}>{ticker}</span>
                )}
                {ccy === "MXN" && <span className="tag" style={{ background: "var(--green-soft)", color: "var(--green)" }}>MXN</span>}
              </div>
              <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>
                {inv.purchaseDate || CLABEL[inv.category]}
                {inv.bondType && (
                  <span style={{ marginLeft: 6, color: "var(--bond)" }}>
                    {BOND_TYPES.find((b) => b.id === inv.bondType)?.short}
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className="tag tag-active">Active</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div style={{ background: "var(--bg-2)", borderRadius: 9, padding: "10px 12px", border: "1px solid var(--border)" }}>
            <div className="lbl" style={{ marginBottom: 3, fontSize: 9 }}>{inv.category === "asset" ? "Net Equity" : "Current Value"}</div>
            <div className="num" style={{ fontWeight: 800, fontSize: 16 }}>{$i(v)}</div>
            {live?.price != null && (
              <div className="num" style={{ fontSize: 9.5, color: "var(--accent)", marginTop: 2 }}>
                {H.loadingPrices ? "updating…" : `$${live.price.toFixed(2)} · ${fmtPct(live.changePct)} today`}
              </div>
            )}
            {priceNA && <div style={{ fontSize: 9.5, color: "var(--red)", marginTop: 2 }}>No live price — using cost</div>}
          </div>
          <div style={{ background: "var(--bg-2)", borderRadius: 9, padding: "10px 12px", border: "1px solid var(--border)" }}>
            <div className="lbl" style={{ marginBottom: 3, fontSize: 9 }}>{inv.category === "asset" && inv.hasLoan ? "Down Payment" : "Cost Basis"}</div>
            <div className="num" style={{ fontWeight: 800, fontSize: 16 }}>{$i(H.costInv(inv))}</div>
            {inv.category === "stock" && inv.shares ? (
              <div style={{ fontSize: 9.5, color: "var(--faint)", marginTop: 2 }}>
                {Number(inv.shares).toLocaleString(undefined, { maximumFractionDigits: 8 })} sh @ {$i(inv.costPerShare)}
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ background: g >= 0 ? "var(--green-soft)" : "var(--red-soft)", border: `1px solid ${g >= 0 ? "rgba(46,189,133,0.18)" : "rgba(229,72,77,0.18)"}`, borderRadius: 9, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="lbl" style={{ marginBottom: 2, fontSize: 9 }}>Unrealized G/L</div>
            <div className={`num ${g >= 0 ? "pos" : "neg"}`} style={{ fontWeight: 800, fontSize: 14 }}>{g >= 0 ? "+" : ""}{$i(g)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className={`num ${g >= 0 ? "pos" : "neg"}`} style={{ fontWeight: 700, fontSize: 13 }}>{fmtPct(r)}</div>
            {ar != null && <div className="num" style={{ color: "var(--muted)", fontSize: 10 }}>{fmtPct(ar)}/yr</div>}
          </div>
        </div>

        {lc && (
          <div style={{ background: "rgba(205,123,92,0.06)", border: "1px solid rgba(205,123,92,0.2)", borderRadius: 8, padding: "7px 12px", marginBottom: 10, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span className="muted">{inv.loan?.rate}% · {lc.monthsPaid}/{inv.loan?.termMonths} mo paid</span>
            <span className="num" style={{ color: "var(--asset)", fontWeight: 700 }}>Bal: {$i(lc.remainingBalance)}</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={onDetail}><Info size={11} />Details</button>
          <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={onEdit}><Edit2 size={11} />Edit</button>
          {inv.category !== "cash" && (
            <button className="btn btn-sm" style={{ flex: 1, color: "var(--accent)", borderColor: "rgba(201,168,106,0.3)" }} onClick={onSell}>
              <CheckCircle size={11} />Sell
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={onDel}><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  );
}
