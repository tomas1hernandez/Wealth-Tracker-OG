import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Plus, X, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../state/store.jsx";
import { fetchMetrics, fetchQuote, isCrypto } from "../lib/api.js";
import { fmtCompact } from "../lib/calc.js";

const CACHE_KEY = "wtog.ratiosCache";
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 h — fundamentals move slowly

// thresholds: [good, warn] — direction tells which side is healthy
const GAUGES = {
  pe: { label: "P/E", fmt: (v) => v.toFixed(1), good: (v) => v > 0 && v < 20, warn: (v) => v >= 20 && v < 35, tip: "Price ÷ earnings. Under ~20 is cheap-ish; very high means big growth is priced in. Negative = losing money." },
  pb: { label: "P/B", fmt: (v) => v.toFixed(1), good: (v) => v < 3, warn: (v) => v < 8, tip: "Price ÷ book value. Lower is cheaper vs. net assets." },
  ps: { label: "P/S", fmt: (v) => v.toFixed(1), good: (v) => v < 4, warn: (v) => v < 10, tip: "Price ÷ revenue. Useful when earnings are noisy." },
  eps: { label: "EPS", fmt: (v) => `$${v.toFixed(2)}`, good: (v) => v > 0, warn: () => false, tip: "Earnings per share, trailing 12 months." },
  roe: { label: "ROE", fmt: (v) => `${v.toFixed(1)}%`, good: (v) => v > 15, warn: (v) => v > 8, tip: "Return on equity. >15% = management creates value efficiently." },
  netMargin: { label: "Net Mgn", fmt: (v) => `${v.toFixed(1)}%`, good: (v) => v > 15, warn: (v) => v > 5, tip: "Profit kept per $1 of sales." },
  revGrowth: { label: "Rev Gr.", fmt: (v) => `${v.toFixed(1)}%`, good: (v) => v > 10, warn: (v) => v > 0, tip: "Revenue growth, year over year." },
  debtToEquity: { label: "D/E", fmt: (v) => v.toFixed(2), good: (v) => v < 1, warn: (v) => v < 2, tip: "Total debt ÷ equity. Under 1 is conservative." },
  currentRatio: { label: "Curr.", fmt: (v) => v.toFixed(2), good: (v) => v > 1.5, warn: (v) => v > 1, tip: "Short-term assets ÷ short-term liabilities. >1 can pay its bills." },
  divYield: { label: "Div %", fmt: (v) => `${v.toFixed(2)}%`, good: () => false, warn: () => false, neutral: true, tip: "Annual dividend ÷ price." },
  beta: { label: "Beta", fmt: (v) => v.toFixed(2), good: () => false, warn: () => false, neutral: true, tip: "Volatility vs. the market. 1 = moves with the S&P 500." },
};
const COLS = Object.keys(GAUGES);

export default function Ratios() {
  const { invs, settings, setSettings } = useStore();
  const [data, setData] = useState({}); // ticker -> {metrics, quote}
  const [loading, setLoading] = useState(false);
  const [addT, setAddT] = useState("");
  const [tipCol, setTipCol] = useState(null);

  const holdings = useMemo(
    () =>
      [...new Set(
        invs
          .filter((i) => i.category === "stock" && i.status === "active" && i.ticker && !isCrypto(i.ticker))
          .map((i) => i.ticker.toUpperCase())
      )],
    [invs]
  );
  const watchlist = settings.watchlist || [];
  const tickers = useMemo(() => [...new Set([...holdings, ...watchlist])], [holdings, watchlist]);

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (c && Date.now() - c.ts < CACHE_TTL) setData(c.data || {});
    } catch { /* ignore */ }
  }, []);

  const refresh = async () => {
    if (!settings.finnhubKey || !tickers.length || loading) return;
    setLoading(true);
    const next = { ...data };
    for (const t of tickers) {
      try {
        const [metrics, quote] = await Promise.all([
          fetchMetrics(t, settings.finnhubKey),
          fetchQuote(t, settings.finnhubKey),
        ]);
        next[t] = { metrics, quote };
        setData({ ...next });
      } catch { /* skip ticker */ }
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: next }));
    setLoading(false);
  };

  // auto-load once if we have a key and tickers without data
  useEffect(() => {
    if (settings.finnhubKey && tickers.length && tickers.some((t) => !data[t])) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.finnhubKey, tickers.join(",")]);

  const addWatch = () => {
    const t = addT.trim().toUpperCase();
    if (!t || tickers.includes(t)) { setAddT(""); return; }
    setSettings((s) => ({ ...s, watchlist: [...(s.watchlist || []), t] }));
    setAddT("");
  };
  const rmWatch = (t) =>
    setSettings((s) => ({ ...s, watchlist: (s.watchlist || []).filter((x) => x !== t) }));

  const cellColor = (key, v) => {
    const g = GAUGES[key];
    if (v == null || g.neutral) return "var(--text)";
    if (g.good(v)) return "var(--green)";
    if (g.warn(v)) return "#d8b35a";
    return "var(--red)";
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Key Ratios</h1>
          <p className="page-sub">Fundamentals for your holdings and watchlist — hover a column header for what it means</p>
        </div>
        <button className="btn" onClick={refresh} disabled={!settings.finnhubKey || loading || !tickers.length}>
          <RefreshCw size={13} className={loading ? "spin" : ""} />
          {loading ? "Fetching…" : "Refresh Ratios"}
        </button>
      </div>

      {!settings.finnhubKey && (
        <div className="card" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 14, borderColor: "rgba(201,168,106,0.3)" }}>
          <KeyRound size={20} color="var(--accent)" />
          <div style={{ flex: 1, fontSize: 13 }}>
            <b>Ratios need a (free) Finnhub API key.</b>{" "}
            <span className="muted">Grab one at finnhub.io and paste it in Settings — takes a minute.</span>
          </div>
          <Link to="/settings" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>Open Settings</Link>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        <input
          className="input"
          style={{ maxWidth: 220 }}
          value={addT}
          onChange={(e) => setAddT(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addWatch()}
          placeholder="Add watchlist ticker…"
        />
        <button className="btn btn-sm" onClick={addWatch}><Plus size={12} />Watch</button>
      </div>

      {tickers.length === 0 ? (
        <div className="card empty">
          <div className="empty-title">Nothing to analyze yet</div>
          <div style={{ fontSize: 13 }}>Add stock positions in Portfolio, or a watchlist ticker above.</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Price</th>
                <th>Mkt Cap</th>
                {COLS.map((k) => (
                  <th key={k} style={{ cursor: "help", position: "relative" }}
                      onMouseEnter={() => setTipCol(k)} onMouseLeave={() => setTipCol(null)}>
                    {GAUGES[k].label}
                    {tipCol === k && (
                      <div style={{ position: "absolute", top: "100%", right: 0, zIndex: 50, width: 210, background: "#10151d", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: "var(--muted)", textTransform: "none", letterSpacing: 0, fontWeight: 500, textAlign: "left", whiteSpace: "normal" }}>
                        {GAUGES[k].tip}
                      </div>
                    )}
                  </th>
                ))}
                <th>52W Range</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tickers.map((t) => {
                const d = data[t];
                const m = d?.metrics;
                const q = d?.quote;
                const inPort = holdings.includes(t);
                const rangePos =
                  m?.high52 && m?.low52 && q?.price
                    ? Math.max(0, Math.min(1, (q.price - m.low52) / (m.high52 - m.low52)))
                    : null;
                return (
                  <tr key={t}>
                    <td>
                      <b style={{ color: inPort ? "var(--accent)" : "var(--text)" }}>{t}</b>
                      {inPort && <span className="faint" style={{ fontSize: 10, marginLeft: 6 }}>held</span>}
                    </td>
                    <td>
                      {q?.price != null ? (
                        <span>
                          ${q.price.toFixed(2)}{" "}
                          <span className={q.changePct >= 0 ? "pos" : "neg"} style={{ fontSize: 11 }}>
                            {q.changePct >= 0 ? "+" : ""}{(q.changePct ?? 0).toFixed(2)}%
                          </span>
                        </span>
                      ) : "—"}
                    </td>
                    <td>{m?.marketCap != null ? `$${fmtCompact(m.marketCap * 1e6)}` : "—"}</td>
                    {COLS.map((k) => {
                      const v = m?.[k];
                      return (
                        <td key={k} style={{ color: cellColor(k, v), fontWeight: v != null ? 600 : 400 }}>
                          {v != null ? GAUGES[k].fmt(v) : "—"}
                        </td>
                      );
                    })}
                    <td style={{ minWidth: 110 }}>
                      {rangePos != null ? (
                        <div title={`Low $${m.low52.toFixed(0)} — High $${m.high52.toFixed(0)}`}>
                          <div style={{ position: "relative", height: 5, background: "var(--bg-2)", borderRadius: 3, border: "1px solid var(--border-strong)" }}>
                            <div style={{ position: "absolute", left: `${rangePos * 100}%`, top: -3, width: 3, height: 9, background: "var(--accent)", borderRadius: 2, transform: "translateX(-50%)" }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--faint)", marginTop: 3 }}>
                            <span>${m.low52.toFixed(0)}</span><span>${m.high52.toFixed(0)}</span>
                          </div>
                        </div>
                      ) : "—"}
                    </td>
                    <td>
                      {!inPort && (
                        <button className="btn btn-ghost btn-sm" title="Remove from watchlist" onClick={() => rmWatch(t)}>
                          <X size={11} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="faint" style={{ fontSize: 11.5, marginTop: 14 }}>
        Color guide: <span className="pos">green = healthy</span> · <span style={{ color: "#d8b35a" }}>amber = watch</span> ·{" "}
        <span className="neg">red = caution</span>. Thresholds are general rules of thumb — always compare within the same industry.
      </p>
    </div>
  );
}
