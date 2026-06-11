import { Clock } from "lucide-react";
import { useStore } from "../state/store.jsx";
import { CLABEL, CCOLOR } from "../lib/constants.js";
import { conv, fmtCcy, fmtPct, yearsHeld } from "../lib/calc.js";
import { CatIcon, Lbl } from "../components/bits.jsx";

export default function History() {
  const { sold, H } = useStore();
  const totalRGL = sold.reduce((s, i) => s + conv(H.glInv(i), i.currency || "USD", "USD", H.exRate), 0);
  const winners = sold.filter((i) => H.glInv(i) >= 0).length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Investment History</h1>
          <p className="page-sub">Closed positions — excluded from net worth and portfolio</p>
        </div>
      </div>

      {sold.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
          {[
            [fmtCcy(conv(totalRGL, "USD", H.displayCcy, H.exRate), H.displayCcy), totalRGL >= 0 ? "var(--green)" : "var(--red)", "Total Realized P&L"],
            [sold.length ? `${((winners / sold.length) * 100).toFixed(0)}%` : "—", winners / sold.length >= 0.5 ? "var(--green)" : "var(--red)", "Win Rate"],
            [sold.length, "var(--text)", "Positions Closed"],
          ].map(([v, c, l]) => (
            <div key={l} className="card" style={{ padding: 18 }}>
              <Lbl>{l}</Lbl>
              <div className="num" style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {sold.length === 0 ? (
        <div className="card empty">
          <Clock size={42} color="var(--faint)" strokeWidth={1.2} />
          <div className="empty-title">No closed positions yet</div>
          <div style={{ fontSize: 13 }}>Sold investments appear here</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...sold]
            .sort((a, b) => new Date(b.saleDate || 0) - new Date(a.saleDate || 0))
            .map((inv) => {
              const ccy = inv.currency || "USD";
              const g = H.glInv(inv), r = H.roiInv(inv), ar = H.annROI(inv), yrs = yearsHeld(inv);
              const $i = (n) => H.$d(n, ccy);
              return (
                <div key={inv.id} className="card" style={{ padding: 20, borderColor: g >= 0 ? "rgba(46,189,133,0.18)" : "rgba(229,72,77,0.18)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${CCOLOR[inv.category]}12`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${CCOLOR[inv.category]}25` }}>
                        <CatIcon cat={inv.category} size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14.5, display: "flex", gap: 6, alignItems: "center" }}>
                          {inv.name || inv.ticker || "Investment"}
                          {inv.ticker && (
                            <span className="tag" style={{ background: `${CCOLOR.stock}14`, color: CCOLOR.stock }}>{inv.ticker}</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>
                          {CLABEL[inv.category]} · Cost: {$i(H.costInv(inv))} · Sold {inv.saleDate || "—"}
                          {yrs != null && <span style={{ marginLeft: 8 }}>· Held {yrs >= 1 ? `${yrs.toFixed(1)} yrs` : `${(yrs * 12).toFixed(0)} mo`}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className={`num ${g >= 0 ? "pos" : "neg"}`} style={{ fontWeight: 800, fontSize: 17 }}>{g >= 0 ? "+" : ""}{$i(g)}</div>
                      <div className="num" style={{ fontSize: 11, color: "var(--muted)" }}>{fmtPct(r)} total{ar != null ? ` · ${fmtPct(ar)}/yr` : ""}</div>
                      <div className="num" style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>Proceeds: {$i(H.valInv(inv))}</div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
