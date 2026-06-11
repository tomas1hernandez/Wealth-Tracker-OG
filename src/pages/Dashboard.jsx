import { RefreshCw, BarChart3 } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useStore } from "../state/store.jsx";
import { CATS, CLABEL, CCOLOR } from "../lib/constants.js";
import { conv, fmtCcy, fmtPct, fmtCompact } from "../lib/calc.js";
import { CatIcon } from "../components/bits.jsx";

const TT_STYLE = { background: "#10151d", border: "1px solid var(--border-strong)", borderRadius: 10, fontSize: 13 };

export default function Dashboard() {
  const { active, sold, nwUSD, nwHistory, H, displayCcy, setDisplayCcy, exRate, refreshPrices, loadingPrices, settings } = useStore();

  const nwDsp = conv(nwUSD, "USD", displayCcy, exRate);
  const totCostU = active.reduce((s, i) => s + H.costUSD(i), 0);
  const totGLU = nwUSD - totCostU;
  const totROI = totCostU ? (totGLU / totCostU) * 100 : 0;

  const pieData = CATS.map((k) => ({
    name: CLABEL[k],
    color: CCOLOR[k],
    value: conv(active.filter((i) => i.category === k).reduce((s, i) => s + H.valUSD(i), 0), "USD", displayCcy, exRate),
  })).filter((d) => d.value > 0);

  const trend = nwHistory.map((p) => ({ date: p.date.slice(5), value: conv(p.value, "USD", displayCcy, exRate) }));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Portfolio Overview</h1>
          <p className="page-sub">Your complete financial picture</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="seg">
            {["USD", "MXN"].map((c) => (
              <button key={c} className={displayCcy === c ? "on" : ""} onClick={() => setDisplayCcy(c)}>
                {c === "USD" ? "🇺🇸 USD" : "🇲🇽 MXN"}
              </button>
            ))}
          </div>
          <button className="btn" onClick={refreshPrices} disabled={loadingPrices}>
            <RefreshCw size={13} className={loadingPrices ? "spin" : ""} />
            {loadingPrices ? "Updating…" : "Refresh Prices"}
          </button>
        </div>
      </div>

      {!settings.finnhubKey && active.some((i) => i.category === "stock") && (
        <div className="card" style={{ borderColor: "rgba(201,168,106,0.3)", background: "var(--accent-soft)", padding: "12px 18px", marginBottom: 18, fontSize: 13 }}>
          <b style={{ color: "var(--accent)" }}>Live prices off.</b>{" "}
          <span className="muted">Add a free Finnhub API key in Settings to pull live quotes, ratios and the heat map. Manual prices are used meanwhile.</span>
        </div>
      )}

      {/* Net worth hero */}
      <div className="card" style={{ padding: "30px 36px", marginBottom: 20, background: "linear-gradient(140deg, #141a25 0%, #10151d 60%)", border: "1px solid rgba(201,168,106,0.18)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -40, width: 280, height: 280, borderRadius: "50%", background: "rgba(201,168,106,0.05)", filter: "blur(50px)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <p className="lbl" style={{ marginBottom: 6 }}>Total Net Worth · Active Positions</p>
          <div className="num display" style={{ fontSize: 52, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05 }}>
            {fmtCcy(nwDsp, displayCcy)}
          </div>
          {displayCcy === "MXN" && (
            <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 4 }}>1 USD = {exRate.toFixed(2)} MXN</div>
          )}
          <div style={{ display: "flex", gap: 36, marginTop: 20, flexWrap: "wrap" }}>
            {[
              [`${totGLU >= 0 ? "+" : ""}${fmtCcy(conv(totGLU, "USD", displayCcy, exRate), displayCcy)}`, totGLU >= 0 ? "var(--green)" : "var(--red)", "Total Gain / Loss"],
              [fmtPct(totROI), totROI >= 0 ? "var(--green)" : "var(--red)", "Overall ROI"],
              [active.length, "var(--text)", "Active Positions"],
              [sold.length, "var(--muted)", "Closed"],
            ].map(([v, c, l]) => (
              <div key={l}>
                <div className="lbl" style={{ marginBottom: 2 }}>{l}</div>
                <div className="num" style={{ fontSize: 19, fontWeight: 800, color: c }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Net worth trend */}
      {trend.length > 1 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Net Worth Trend</h3>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={trend} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c9a86a" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#c9a86a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "var(--faint)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => fmtCompact(v)} tick={{ fill: "var(--faint)", fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
              <Tooltip contentStyle={TT_STYLE} formatter={(v) => [fmtCcy(v, displayCcy), "Net Worth"]} />
              <Area type="monotone" dataKey="value" stroke="#c9a86a" strokeWidth={2} fill="url(#nwGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 20 }}>
        <div className="card">
          <h3 className="card-title">Portfolio Allocation</h3>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={74} outerRadius={112} paddingAngle={3} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="var(--bg)" strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={TT_STYLE} formatter={(v) => [fmtCcy(v, displayCcy), "Value"]} />
                <Legend
                  formatter={(v, e) => {
                    const tot = pieData.reduce((s, d) => s + d.value, 0);
                    return `${v}  ·  ${tot ? ((e.payload.value / tot) * 100).toFixed(1) : 0}%`;
                  }}
                  wrapperStyle={{ color: "var(--muted)", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty" style={{ height: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 0 }}>
              <BarChart3 size={44} strokeWidth={1} />
              <div style={{ marginTop: 12, fontSize: 13 }}>Add investments to see allocation</div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">By Category</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {CATS.map((k) => {
              const catVDsp = conv(active.filter((i) => i.category === k).reduce((s, i) => s + H.valUSD(i), 0), "USD", displayCcy, exRate);
              const totDsp = conv(nwUSD, "USD", displayCcy, exRate);
              const pct = totDsp ? (catVDsp / totDsp) * 100 : 0;
              const cnt = active.filter((i) => i.category === k).length;
              return (
                <div key={k}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${CCOLOR[k]}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CatIcon cat={k} size={14} />
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{CLABEL[k]}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="num" style={{ fontWeight: 700, fontSize: 13.5 }}>{fmtCcy(catVDsp, displayCcy)}</div>
                      <div style={{ fontSize: 11, color: "var(--faint)" }}>{cnt} pos · {pct.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div style={{ height: 4, background: "var(--bg-2)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: CCOLOR[k], borderRadius: 2, transition: "width 0.6s ease", opacity: 0.9 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
