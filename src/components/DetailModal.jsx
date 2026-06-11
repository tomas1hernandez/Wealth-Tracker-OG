import { Landmark } from "lucide-react";
import { CLABEL, CCOLOR, BOND_TYPES } from "../lib/constants.js";
import { loanCalc, bondCalc, yearsHeld, fmtCcy, fmtPct } from "../lib/calc.js";
import { CatIcon, Row, Lbl, Modal } from "./bits.jsx";

export default function DetailModal({ inv, H, onClose }) {
  const ccy = inv.currency || "USD";
  const v = H.valInv(inv), g = H.glInv(inv), r = H.roiInv(inv), ar = H.annROI(inv);
  const lc = inv.category === "asset" && inv.hasLoan ? loanCalc(inv.loan) : null;
  const bc = inv.category === "bond" ? bondCalc(inv) : null;
  const yrs = yearsHeld(inv);
  const $i = (n) => H.$d(n, ccy);
  const $b = (n) => fmtCcy(n, ccy);
  const linkedChildren = H.invs.filter((i) => i.parentAssetId === inv.id && i.status === "active");
  const live = H.prices[inv.ticker?.toUpperCase()];

  return (
    <Modal onClose={onClose} maxWidth={530} accent={CCOLOR[inv.category]}
      title={
        <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: `${CCOLOR[inv.category]}14`, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1px solid ${CCOLOR[inv.category]}30` }}>
            <CatIcon cat={inv.category} size={20} />
          </span>
          <span>
            {inv.name || inv.ticker || "Investment"}
            <span style={{ display: "block", fontSize: 11, color: "var(--faint)", fontFamily: "var(--font-body)", fontWeight: 500, marginTop: 2 }}>
              {CLABEL[inv.category]}{inv.bondType && ` · ${BOND_TYPES.find((b) => b.id === inv.bondType)?.short || ""}`} · {ccy} · {inv.status === "active" ? "Active" : "Closed"}
            </span>
          </span>
        </span>
      }
    >
      <div style={{ background: g >= 0 ? "var(--green-soft)" : "var(--red-soft)", border: `1px solid ${g >= 0 ? "rgba(46,189,133,0.22)" : "rgba(229,72,77,0.22)"}`, borderRadius: 12, padding: 20, marginBottom: 20, textAlign: "center" }}>
        <div className="lbl" style={{ marginBottom: 4 }}>{inv.category === "asset" ? "Net Equity" : "Current Value"}</div>
        <div className="num" style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{$i(v)}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 22, marginTop: 12, flexWrap: "wrap" }}>
          <Stat l="Total G/L" v={`${g >= 0 ? "+" : ""}${$i(g)}`} c={g >= 0 ? "var(--green)" : "var(--red)"} />
          <Stat l="Total ROI" v={fmtPct(r)} c={g >= 0 ? "var(--green)" : "var(--red)"} />
          {ar != null && <Stat l="Annual ROI" v={`${fmtPct(ar)}/yr`} c={ar >= 0 ? "var(--green)" : "var(--red)"} />}
          {yrs != null && <Stat l="Held" v={yrs >= 1 ? `${yrs.toFixed(1)} yrs` : `${(yrs * 12).toFixed(0)} mo`} />}
        </div>
      </div>

      {inv.category === "stock" && (
        <div>
          {inv.ticker && <Row l="Ticker" rv={inv.ticker} />}
          <Row l="Shares" rv={Number(inv.shares || 0).toLocaleString(undefined, { maximumFractionDigits: 8 })} />
          <Row l="Cost per Share" rv={$b(inv.costPerShare)} />
          <Row l="Total Cost Basis" rv={$i(H.costInv(inv))} />
          {live?.price != null && <Row l="Live Market Price" rv={$b(live.price)} c="var(--accent)" />}
          {live === null && <Row l="Live Price" rv="N/A — using cost basis" c="var(--red)" />}
          <Row l="Market Value" rv={$i(v)} last />
        </div>
      )}

      {inv.category === "bond" && (
        <div>
          <Row l="Bond Type" rv={BOND_TYPES.find((b) => b.id === inv.bondType)?.label || "—"} />
          <Row l="Face Value (Par)" rv={$b(inv.faceValue)} />
          {inv.bondType === "treasury_bond" && <Row l="Coupon Rate" rv={`${inv.coupon || 0}%`} />}
          {(inv.bondType === "tbill" || inv.bondType === "cetes") && <Row l="Purchase Price" rv={$b(inv.purchasePrice || inv.faceValue)} />}
          {inv.purchaseDate && <Row l="Purchase Date" rv={inv.purchaseDate} />}
          {inv.maturityDate && <Row l="Maturity Date" rv={inv.maturityDate} />}
          {bc && (
            <div style={{ marginTop: 16, background: "rgba(143,188,159,0.06)", border: "1px solid rgba(143,188,159,0.2)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "var(--bond)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Interest Income</div>
              {bc.payType === "coupon" && (
                <div>
                  <Row l="Payment Frequency" rv="Every 6 months" />
                  <Row l="Amount per Payment" rv={$b(bc.pmtAmt)} c="var(--accent)" />
                  <Row l="Payments Completed" rv={`${bc.periods}${bc.totalPeriods != null ? ` / ${bc.totalPeriods}` : ""}`} />
                  <Row l="Interest Earned to Date" rv={$b(bc.earned)} c="var(--green)" />
                  {bc.totalExpected != null && <Row l="Total Expected Interest" rv={$b(bc.totalExpected)} c="var(--accent)" last />}
                </div>
              )}
              {bc.payType === "maturity" && (
                <div>
                  <Row l="Discount (gain at maturity)" rv={$b(bc.discount)} c="var(--accent)" />
                  <Row l="Accrued to Date" rv={`${$b(bc.earned)} (${(bc.pct * 100).toFixed(1)}% elapsed)`} c="var(--green)" />
                  <Row l="Total Interest at Maturity" rv={$b(bc.totalExpected)} c="var(--accent)" last />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {inv.category === "asset" && (
        <div>
          {inv.assetType && <Row l="Asset Type" rv={inv.assetType} />}
          <Row l="Acquisition Price" rv={$i(inv.purchasePrice)} />
          <Row l="Current Market Value" rv={$i(inv.currentValue || inv.purchasePrice)} />
          <Row l="Price Appreciation"
            rv={$i((inv.currentValue || inv.purchasePrice || 0) - (inv.purchasePrice || 0))}
            c={(inv.currentValue || inv.purchasePrice || 0) >= (inv.purchasePrice || 0) ? "var(--green)" : "var(--red)"} />
          {linkedChildren.length > 0 && (
            <div style={{ marginTop: 12, background: "var(--green-soft)", border: "1px solid rgba(46,189,133,0.2)", borderRadius: 9, padding: "10px 14px" }}>
              <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 700, marginBottom: 6 }}>Linked Assets</div>
              {linkedChildren.map((c) => (
                <div key={c.id} style={{ fontSize: 12, color: "var(--muted)", paddingLeft: 6, marginBottom: 3 }}>
                  ↳ {c.name || "Unnamed"} — {$i(H.valInv(c))}
                </div>
              ))}
            </div>
          )}
          {lc && (
            <div style={{ marginTop: 16, background: "rgba(205,123,92,0.06)", border: "1px solid rgba(205,123,92,0.22)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "var(--asset)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 6 }}>
                <Landmark size={13} />Loan Details
              </div>
              <Row l="Original Loan" rv={$i(inv.loan?.amount)} />
              <Row l="Down Payment (invested capital)" rv={$i(Math.max(0, (inv.purchasePrice || 0) - (inv.loan?.amount || 0)))} c="var(--accent)" />
              <Row l="Interest Rate" rv={`${inv.loan?.rate || 0}% p.a.`} />
              <Row l="Term" rv={`${inv.loan?.termMonths} months (${(inv.loan?.termMonths / 12).toFixed(1)} yrs)`} />
              <Row l="Monthly Payment" rv={$i(lc.pmt)} />
              <Row l="Total Interest Cost" rv={$i(lc.totalInterest)} c="var(--red)" />
              <Row l="Total Loan Cost (P + I)" rv={$i(lc.totalPaid)} />
              <Row l="Payments Made" rv={inv.loan?.startDate ? `${lc.monthsPaid} / ${inv.loan?.termMonths} months` : "Not yet started (0 payments)"} />
              <Row l="Remaining Balance" rv={$i(lc.remainingBalance)} c="var(--red)" />
              <Row l="Net Equity (Market − Balance)" rv={$i(v)} c="var(--green)" last />
            </div>
          )}
        </div>
      )}

      {inv.category === "cash" && (
        <div>
          {inv.institution && <Row l="Institution" rv={inv.institution} />}
          <Row l="Balance" rv={$i(inv.amount)} last />
        </div>
      )}

      {inv.purchaseDate && inv.category !== "bond" && <Row l="Purchase Date" rv={inv.purchaseDate} />}

      {inv.status === "sold" && (
        <div>
          <div className="divider" />
          <Row l={`Sale Price${inv.category === "stock" ? " per Share" : ""}`} rv={$b(inv.salePrice)} />
          {inv.saleDate && <Row l="Sale Date" rv={inv.saleDate} />}
          <Row l="Total Proceeds" rv={$i(v)} c="var(--accent)" />
          <Row l="Realized G/L" rv={`${g >= 0 ? "+" : ""}${$i(g)}`} c={g >= 0 ? "var(--green)" : "var(--red)"} last />
        </div>
      )}

      {inv.notes && (
        <div style={{ marginTop: 16, background: "var(--bg-2)", borderRadius: 9, padding: 12 }}>
          <Lbl>Notes</Lbl>
          <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{inv.notes}</div>
        </div>
      )}
    </Modal>
  );
}

function Stat({ l, v, c }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--faint)" }}>{l}</div>
      <div className="num" style={{ fontWeight: 700, fontSize: 15, color: c || "var(--text)" }}>{v}</div>
    </div>
  );
}
