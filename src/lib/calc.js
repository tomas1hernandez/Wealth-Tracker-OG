// ── Domain math: loans, bonds, holding periods, currency ─────────

export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmtCcy = (n, ccy = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: ccy === "MXN" ? "MXN" : "USD",
    maximumFractionDigits: 2,
  }).format(n ?? 0);

export const fmtPct = (n, d = 2) => `${(n ?? 0) >= 0 ? "+" : ""}${(n ?? 0).toFixed(d)}%`;

export const fmtCompact = (n) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n ?? 0);

export const conv = (amt, from, to, rate) => {
  if (from === to || !rate) return amt || 0;
  return from === "USD" ? (amt || 0) * rate : (amt || 0) / rate;
};

const MONTH_MS = 30.4375 * 24 * 3600 * 1000;

export function loanCalc({ amount = 0, rate = 0, termMonths = 1, startDate } = {}) {
  if (!amount || !termMonths)
    return { pmt: 0, totalInterest: 0, totalPaid: 0, remainingBalance: amount || 0, monthsPaid: 0 };
  const r = rate / 100 / 12;
  const pmt = r ? (amount * r) / (1 - Math.pow(1 + r, -termMonths)) : amount / termMonths;
  const totalInterest = Math.max(0, pmt * termMonths - amount);
  let monthsPaid = 0;
  if (startDate) {
    const s = new Date(startDate);
    if (!isNaN(s.getTime()))
      monthsPaid = Math.min(termMonths, Math.max(0, Math.floor((Date.now() - s.getTime()) / MONTH_MS)));
  }
  let bal = amount;
  for (let i = 0; i < monthsPaid; i++) {
    const int = bal * r;
    bal = Math.max(0, bal - (pmt - int));
  }
  return { pmt, totalInterest, totalPaid: pmt * termMonths, remainingBalance: bal, monthsPaid };
}

export function bondCalc(inv) {
  const fv = inv.faceValue || 0;
  const now = new Date();
  const pDate = inv.purchaseDate ? new Date(inv.purchaseDate) : null;
  const mDate = inv.maturityDate ? new Date(inv.maturityDate) : null;
  if (inv.bondType === "treasury_bond") {
    const semipmt = (fv * (inv.coupon || 0)) / 100 / 2;
    const moHeld = pDate ? Math.max(0, (now - pDate) / MONTH_MS) : 0;
    const periods = Math.floor(moHeld / 6);
    const totalPeriods =
      pDate && mDate ? Math.max(0, Math.floor((mDate - pDate) / MONTH_MS / 6)) : null;
    return {
      payType: "coupon",
      pmtAmt: semipmt,
      periods,
      totalPeriods,
      earned: periods * semipmt,
      totalExpected: totalPeriods != null ? totalPeriods * semipmt : null,
    };
  }
  if (inv.bondType === "tbill" || inv.bondType === "cetes") {
    const pp = inv.purchasePrice || fv;
    const discount = Math.max(0, fv - pp);
    const totalMs = pDate && mDate ? Math.max(1, mDate - pDate) : null;
    const heldMs = pDate ? Math.max(0, now - pDate) : 0;
    const pct = totalMs ? Math.min(1, heldMs / totalMs) : 0;
    return { payType: "maturity", discount, earned: discount * pct, totalExpected: discount, pct };
  }
  return null;
}

export function yearsHeld(inv) {
  if (!inv.purchaseDate) return null;
  const s = new Date(inv.purchaseDate);
  const e = inv.status === "sold" && inv.saleDate ? new Date(inv.saleDate) : new Date();
  return Math.max(0, (e - s) / (365.25 * 24 * 3600 * 1000));
}

// ── Valuation helpers (price = live quote → manual override → cost) ──
export function valInv(inv, prices) {
  if (inv.status === "sold")
    return inv.category === "stock" ? (inv.salePrice || 0) * (inv.shares || 0) : inv.salePrice || 0;
  if (inv.category === "stock") {
    const live = prices?.[inv.ticker?.toUpperCase()]?.price;
    const p = live ?? inv.manualPrice ?? inv.costPerShare ?? 0;
    return p * (inv.shares || 0);
  }
  if (inv.category === "bond") {
    if (inv.bondType === "tbill" || inv.bondType === "cetes") {
      const bc = bondCalc(inv);
      return (inv.purchasePrice || inv.faceValue || 0) + (bc?.earned || 0);
    }
    return inv.currentValue || inv.faceValue || 0;
  }
  if (inv.category === "asset") {
    const mv = inv.currentValue || inv.purchasePrice || 0;
    const rem = inv.hasLoan && inv.loan ? loanCalc(inv.loan).remainingBalance : 0;
    return mv - rem;
  }
  return inv.amount || 0;
}

export function costInv(inv) {
  if (inv.category === "stock") return (inv.costPerShare || 0) * (inv.shares || 0);
  if (inv.category === "bond")
    return inv.bondType === "tbill" || inv.bondType === "cetes"
      ? inv.purchasePrice || inv.faceValue || 0
      : inv.faceValue || 0;
  if (inv.category === "asset")
    return inv.hasLoan && inv.loan?.amount
      ? Math.max(0, (inv.purchasePrice || 0) - (inv.loan.amount || 0))
      : inv.purchasePrice || 0;
  return inv.amount || 0;
}

export const glInv = (inv, prices) => valInv(inv, prices) - costInv(inv);
export const roiInv = (inv, prices) => {
  const c = costInv(inv);
  return c ? (glInv(inv, prices) / c) * 100 : 0;
};
export const annROI = (inv, prices) => {
  const y = yearsHeld(inv);
  if (!y || y < 0.05) return null;
  return (Math.pow(1 + roiInv(inv, prices) / 100, 1 / y) - 1) * 100;
};
