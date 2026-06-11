import { useState } from "react";
import { Landmark } from "lucide-react";
import { CATS, CLABEL, CCOLOR, BOND_TYPES } from "../lib/constants.js";
import { loanCalc, fmtCcy } from "../lib/calc.js";
import { CatIcon, Lbl, FRow, FField, CcyPicker, TickerSearch, Modal } from "./bits.jsx";

export default function FormModal({ initial, onSave, onClose, allAssets }) {
  const [cat, setCat] = useState(initial?.category || "cash");
  const [f, setF] = useState({ status: "active", currency: "USD", ...initial });
  const [loan, setLoan] = useState(initial?.loan || { amount: "", rate: "", termMonths: "", startDate: "" });
  const [sharesStr, setSharesStr] = useState(initial?.shares != null ? String(initial.shares) : "");
  const [costStr, setCostStr] = useState(initial?.costPerShare != null ? String(initial.costPerShare) : "");
  const [totalStr, setTotalStr] = useState("");
  const [priceMode, setPriceMode] = useState("per_share");
  const [bondType, setBondType] = useState(initial?.bondType || "treasury_bond");

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setL = (k, v) => setLoan((p) => ({ ...p, [k]: v }));

  const handleTotalStr = (v) => {
    setTotalStr(v);
    const tot = parseFloat(v), sh = parseFloat(sharesStr);
    if (!isNaN(tot) && !isNaN(sh) && sh > 0) {
      const cpp = +(tot / sh).toFixed(8);
      setCostStr(String(cpp)); set("costPerShare", cpp);
    }
  };
  const handleSharesStr = (v) => {
    setSharesStr(v);
    const sh = parseFloat(v);
    if (!isNaN(sh) && sh >= 0) {
      set("shares", sh);
      if (priceMode === "total") {
        const tot = parseFloat(totalStr);
        if (!isNaN(tot) && sh > 0) {
          const cpp = +(tot / sh).toFixed(8);
          setCostStr(String(cpp)); set("costPerShare", cpp);
        }
      }
    }
  };
  const handleBondType = (bt) => {
    setBondType(bt); set("bondType", bt);
    const def = BOND_TYPES.find((b) => b.id === bt);
    if (def) set("currency", def.defaultCcy);
  };

  const loanPreview = f.hasLoan && loan.amount && loan.termMonths ? loanCalc(loan) : null;
  const downPayment = f.purchasePrice && loan.amount ? Math.max(0, +f.purchasePrice - +loan.amount) : null;
  const ccy = f.currency || "USD";

  const handleSave = () =>
    onSave({
      ...f,
      category: cat,
      status: "active",
      bondType: cat === "bond" ? bondType : undefined,
      shares: cat === "stock" ? parseFloat(sharesStr) || 0 : f.shares,
      costPerShare: cat === "stock" ? parseFloat(costStr) || 0 : f.costPerShare,
      loan: cat === "asset" && f.hasLoan ? loan : null,
    });

  return (
    <Modal title={initial?.id ? "Edit Investment" : "New Investment"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 22 }}>
        {CATS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setCat(k)}
            style={{
              border: `1px solid ${cat === k ? CCOLOR[k] : "var(--border)"}`,
              borderRadius: 10, cursor: "pointer", padding: "12px 4px",
              fontWeight: 600, fontSize: 11.5, fontFamily: "var(--font-body)",
              background: cat === k ? `${CCOLOR[k]}1c` : "var(--bg-2)",
              color: cat === k ? CCOLOR[k] : "var(--muted)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.15s",
            }}
          >
            <CatIcon cat={k} size={18} color={cat === k ? CCOLOR[k] : "var(--faint)"} />
            {CLABEL[k]}
          </button>
        ))}
      </div>

      {cat === "cash" && (
        <div>
          <CcyPicker currency={ccy} onChange={(c) => set("currency", c)} />
          <FRow>
            <FField label="Name / Description">
              <input className="input" value={f.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Chase Savings" />
            </FField>
            <FField label={`Amount (${ccy})`}>
              <input type="number" className="input" value={f.amount || ""} onChange={(e) => set("amount", +e.target.value)} placeholder="25000" />
            </FField>
          </FRow>
          <div style={{ marginBottom: 15 }}>
            <FField label="Institution (optional)">
              <input className="input" value={f.institution || ""} onChange={(e) => set("institution", e.target.value)} placeholder="Chase, BBVA, Fidelity…" />
            </FField>
          </div>
        </div>
      )}

      {cat === "stock" && (
        <div>
          <div style={{ marginBottom: 15 }}>
            <Lbl>Ticker Symbol</Lbl>
            <TickerSearch ticker={f.ticker || ""} onSelect={(t) => { set("ticker", t.t); if (t.n && t.n !== "Custom" && !f.name) set("name", t.n); }} />
          </div>
          <div style={{ marginBottom: 15 }}>
            <FField label="Company / Asset Name">
              <input className="input" value={f.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="Auto-filled or enter manually" />
            </FField>
          </div>
          <FRow>
            <FField label="Shares (fractional ok)">
              <input type="number" step="any" className="input" value={sharesStr} onChange={(e) => handleSharesStr(e.target.value)} placeholder="0.091646" />
            </FField>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span className="lbl" style={{ marginBottom: 0 }}>Price Input</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {[["per_share", "Per Share"], ["total", "Total Paid"]].map(([md, lb]) => (
                    <button key={md} type="button" onClick={() => setPriceMode(md)}
                      style={{ border: "none", cursor: "pointer", padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: "var(--font-body)", background: priceMode === md ? "var(--accent-soft)" : "var(--bg-2)", color: priceMode === md ? "var(--accent)" : "var(--muted)" }}>
                      {lb}
                    </button>
                  ))}
                </div>
              </div>
              {priceMode === "per_share" ? (
                <input type="number" step="any" className="input" value={costStr}
                  onChange={(e) => { setCostStr(e.target.value); const n = parseFloat(e.target.value); if (!isNaN(n)) set("costPerShare", n); }}
                  placeholder="Cost per share ($)" />
              ) : (
                <input type="number" step="any" className="input" value={totalStr} onChange={(e) => handleTotalStr(e.target.value)} placeholder="Total amount paid ($)" />
              )}
              {priceMode === "total" && costStr && (
                <div style={{ fontSize: 10, color: "var(--faint)", marginTop: 3 }}>${parseFloat(costStr).toFixed(6)}/share</div>
              )}
            </div>
          </FRow>
          <FRow>
            <FField label="Purchase Date (optional)">
              <input type="date" className="input" value={f.purchaseDate || ""} onChange={(e) => set("purchaseDate", e.target.value)} />
            </FField>
            <FField label="Manual Current Price (optional)">
              <input type="number" step="any" className="input" value={f.manualPrice || ""} onChange={(e) => set("manualPrice", e.target.value === "" ? undefined : +e.target.value)} placeholder="Used when no API key" />
            </FField>
          </FRow>
        </div>
      )}

      {cat === "bond" && (
        <div>
          <div style={{ marginBottom: 18 }}>
            <Lbl>Bond Type</Lbl>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {BOND_TYPES.map((bt) => (
                <button key={bt.id} type="button" onClick={() => handleBondType(bt.id)}
                  style={{ border: `1px solid ${bondType === bt.id ? "var(--bond)" : "var(--border)"}`, borderRadius: 10, cursor: "pointer", padding: "11px 16px", textAlign: "left", background: bondType === bt.id ? "rgba(143,188,159,0.08)" : "var(--bg-2)", color: "var(--text)", fontFamily: "var(--font-body)" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{bt.flag} {bt.label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Payment: {bt.pays} · {bt.defaultCcy}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 15 }}>
            <FField label="Bond Name / Description">
              <input className="input" value={f.name || ""} onChange={(e) => set("name", e.target.value)}
                placeholder={bondType === "cetes" ? "e.g. CETES 28 días" : "e.g. US Treasury 10-Year Note"} />
            </FField>
          </div>
          {bondType === "treasury_bond" && (
            <div>
              <FRow>
                <FField label="Face Value / Par (USD)">
                  <input type="number" className="input" value={f.faceValue || ""} onChange={(e) => set("faceValue", +e.target.value)} placeholder="10000" />
                </FField>
                <FField label="Annual Coupon Rate (%)">
                  <input type="number" step="0.001" className="input" value={f.coupon || ""} onChange={(e) => set("coupon", +e.target.value)} placeholder="4.625" />
                </FField>
              </FRow>
              <FRow>
                <FField label="Purchase Date">
                  <input type="date" className="input" value={f.purchaseDate || ""} onChange={(e) => set("purchaseDate", e.target.value)} />
                </FField>
                <FField label="Maturity Date">
                  <input type="date" className="input" value={f.maturityDate || ""} onChange={(e) => set("maturityDate", e.target.value)} />
                </FField>
              </FRow>
              <div style={{ marginBottom: 15 }}>
                <FField label="Current Market Value (optional)">
                  <input type="number" className="input" value={f.currentValue || ""} onChange={(e) => set("currentValue", +e.target.value)} placeholder="Leave blank to use face value" />
                </FField>
              </div>
            </div>
          )}
          {(bondType === "tbill" || bondType === "cetes") && (
            <div>
              <FRow>
                <FField label={`Face Value / Par (${bondType === "cetes" ? "MXN" : "USD"})`}>
                  <input type="number" className="input" value={f.faceValue || ""} onChange={(e) => set("faceValue", +e.target.value)} placeholder={bondType === "cetes" ? "100000" : "10000"} />
                </FField>
                <FField label={`Purchase Price — below par`}>
                  <input type="number" step="0.01" className="input" value={f.purchasePrice || ""} onChange={(e) => set("purchasePrice", +e.target.value)} placeholder={bondType === "cetes" ? "97800" : "9820"} />
                </FField>
              </FRow>
              {f.faceValue && f.purchasePrice ? (
                <div style={{ background: "rgba(143,188,159,0.07)", border: "1px solid rgba(143,188,159,0.2)", borderRadius: 9, padding: "10px 14px", marginBottom: 15, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                  <span className="muted">Discount (gain at maturity)</span>
                  <span style={{ color: "var(--bond)", fontWeight: 700 }}>
                    {fmtCcy(Math.max(0, +f.faceValue - +f.purchasePrice), bondType === "cetes" ? "MXN" : "USD")}
                  </span>
                </div>
              ) : null}
              <FRow>
                <FField label="Purchase Date">
                  <input type="date" className="input" value={f.purchaseDate || ""} onChange={(e) => set("purchaseDate", e.target.value)} />
                </FField>
                <FField label="Maturity Date">
                  <input type="date" className="input" value={f.maturityDate || ""} onChange={(e) => set("maturityDate", e.target.value)} />
                </FField>
              </FRow>
            </div>
          )}
        </div>
      )}

      {cat === "asset" && (
        <div>
          <CcyPicker currency={ccy} onChange={(c) => set("currency", c)} />
          <FRow>
            <FField label="Asset Name">
              <input className="input" value={f.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Office Building — Downtown" />
            </FField>
            <FField label="Asset Type">
              <select className="select" value={f.assetType || ""} onChange={(e) => set("assetType", e.target.value)}>
                <option value="">Select type…</option>
                {["Real Estate", "Land", "Commercial Property", "Equipment", "Vehicle", "Business", "Other"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FField>
          </FRow>
          <FRow>
            <FField label={`Acquisition Price (${ccy})`}>
              <input type="number" className="input" value={f.purchasePrice || ""} onChange={(e) => set("purchasePrice", +e.target.value)} placeholder="2000000" />
            </FField>
            <FField label={`Current Market Value (${ccy})`}>
              <input type="number" className="input" value={f.currentValue || ""} onChange={(e) => set("currentValue", +e.target.value)} placeholder="2400000" />
            </FField>
          </FRow>
          {allAssets.filter((a) => !a.parentAssetId && a.id !== initial?.id).length > 0 && (
            <div style={{ marginBottom: 15 }}>
              <FField label="Link to Parent Asset (optional)">
                <select className="select" value={f.parentAssetId || ""} onChange={(e) => set("parentAssetId", e.target.value || undefined)}>
                  <option value="">Stand-alone (no parent)</option>
                  {allAssets.filter((a) => !a.parentAssetId && a.id !== initial?.id).map((a) => (
                    <option key={a.id} value={a.id}>{a.name || "Unnamed"}</option>
                  ))}
                </select>
              </FField>
            </div>
          )}
          <div style={{ marginBottom: 15 }}>
            <FField label="Purchase Date (optional)">
              <input type="date" className="input" value={f.purchaseDate || ""} onChange={(e) => set("purchaseDate", e.target.value)} />
            </FField>
          </div>
          <div style={{ background: "rgba(205,123,92,0.06)", border: "1px solid rgba(205,123,92,0.2)", borderRadius: 12, padding: 18, marginBottom: 15 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: f.hasLoan ? 18 : 0 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <Landmark size={14} color="var(--asset)" />Financing / Loan
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Mortgage, business loan, or any financing</div>
              </div>
              <button type="button" className={`btn btn-sm ${f.hasLoan ? "" : "btn-ghost"}`} onClick={() => set("hasLoan", !f.hasLoan)}>
                {f.hasLoan ? "On" : "Off"}
              </button>
            </div>
            {f.hasLoan && (
              <div>
                <FRow>
                  <FField label={`Loan Amount (${ccy})`}>
                    <input type="number" className="input" value={loan.amount || ""} onChange={(e) => setL("amount", +e.target.value)} placeholder="1000000" />
                  </FField>
                  <FField label="Down Payment — auto">
                    <input type="number" readOnly className="input" style={{ opacity: 0.5, cursor: "not-allowed" }} value={downPayment != null ? Math.round(downPayment) : ""} />
                  </FField>
                </FRow>
                <FRow>
                  <FField label="Annual Interest Rate (%)">
                    <input type="number" step="0.01" className="input" value={loan.rate || ""} onChange={(e) => setL("rate", +e.target.value)} placeholder="0 for interest-free" />
                  </FField>
                  <FField label="Term (months)">
                    <input type="number" className="input" value={loan.termMonths || ""} onChange={(e) => setL("termMonths", +e.target.value)} placeholder="24" />
                  </FField>
                </FRow>
                <div style={{ marginBottom: 15 }}>
                  <FField label="Loan Start Date — blank if not yet started">
                    <input type="date" className="input" value={loan.startDate || ""} onChange={(e) => setL("startDate", e.target.value)} />
                  </FField>
                </div>
                {loanPreview && (
                  <div style={{ background: "var(--bg-2)", borderRadius: 9, padding: 14, fontSize: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      ["Monthly Pmt", fmtCcy(loanPreview.pmt, ccy), "var(--text)"],
                      ["Total Interest", fmtCcy(loanPreview.totalInterest, ccy), "var(--red)"],
                      ["Total Cost", fmtCcy(loanPreview.totalPaid, ccy), "var(--muted)"],
                    ].map(([l, v, c]) => (
                      <div key={l}>
                        <div style={{ color: "var(--faint)", fontSize: 10, marginBottom: 2 }}>{l}</div>
                        <div className="num" style={{ fontWeight: 700, color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 22 }}>
        <FField label="Notes (optional)">
          <input className="input" value={f.notes || ""} onChange={(e) => set("notes", e.target.value)} placeholder="Any relevant details…" />
        </FField>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>
          {initial?.id ? "Update Investment" : "Save Investment"}
        </button>
      </div>
    </Modal>
  );
}
