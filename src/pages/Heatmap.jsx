import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useStore } from "../state/store.jsx";
import { CONSTITUENTS, demoChanges } from "../lib/constituents.js";
import { squarify, changeColor } from "../lib/treemap.js";
import { fetchQuotes } from "../lib/api.js";
import { fmtPct } from "../lib/calc.js";

const CACHE_KEY = "wtog.heatmapCache";
const CACHE_TTL = 15 * 60 * 1000; // 15 min
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Heatmap() {
  const { marketLive, invs } = useStore();
  const [changes, setChanges] = useState(null); // { TICKER: pct }
  const [mode, setMode] = useState("demo"); // demo | live
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [hover, setHover] = useState(null); // {item, mx, my}
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 1200, h: 720 });

  const owned = useMemo(
    () => new Set(invs.filter((i) => i.category === "stock" && i.status === "active" && i.ticker).map((i) => i.ticker.toUpperCase())),
    [invs]
  );

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: Math.max(560, Math.min(820, r.width * 0.62)) });
    });
    if (wrapRef.current) obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  // initial data: cached live → else demo
  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (c && Date.now() - c.ts < CACHE_TTL) {
        setChanges(c.changes);
        setMode("live");
        return;
      }
    } catch { /* ignore */ }
    setChanges(demoChanges());
    setMode("demo");
  }, []);

  const applyQuotes = (quotes) => {
    const ch = {};
    for (const c of CONSTITUENTS) {
      const q = quotes[c.t.toUpperCase()];
      if (q) ch[c.t] = q.changePct;
    }
    if (Object.keys(ch).length) {
      setChanges((prev) => {
        const merged = { ...prev, ...ch };
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), changes: merged }));
        return merged;
      });
      setMode("live");
    }
    return Object.keys(ch).length;
  };

  const loadLive = async () => {
    if (!marketLive || loading) return;
    setLoading(true);
    const symbols = CONSTITUENTS.map((c) => c.t);
    try {
      setProgress({ text: `Loading ${symbols.length} quotes…` });
      const quotes = await fetchQuotes(symbols);
      applyQuotes(quotes);
      // anything the upstream per-minute limit rejected: retry once after it resets
      const missing = symbols.filter((t) => !quotes[t.toUpperCase()]);
      if (missing.length && missing.length < symbols.length) {
        setProgress({ text: `${symbols.length - missing.length}/${symbols.length} loaded — fetching the rest in ~1 min` });
        await sleep(65_000);
        applyQuotes(await fetchQuotes(missing));
      }
    } catch { /* keep current data */ }
    setLoading(false);
    setProgress(null);
  };

  // layout: sectors first, then stocks inside each sector
  const cells = useMemo(() => {
    if (!changes) return { sectors: [], stocks: [] };
    const PAD = 2, HEADER = 17;
    const bySector = {};
    for (const c of CONSTITUENTS) (bySector[c.sector] ||= []).push(c);
    const sectorItems = Object.entries(bySector).map(([sector, list]) => ({
      sector,
      list,
      value: list.reduce((s, c) => s + c.mcap, 0),
    }));
    const sectorRects = squarify(sectorItems, 0, 0, size.w, size.h);
    const stocks = [];
    for (const sr of sectorRects) {
      const innerX = sr.x + PAD, innerY = sr.y + HEADER + PAD;
      const innerW = sr.w - PAD * 2, innerH = sr.h - HEADER - PAD * 2;
      if (innerW < 8 || innerH < 8) continue;
      const placed = squarify(sr.list.map((c) => ({ ...c, value: c.mcap })), innerX, innerY, innerW, innerH);
      stocks.push(...placed);
    }
    return { sectors: sectorRects, stocks };
  }, [changes, size]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Market Heat Map</h1>
          <p className="page-sub">
            S&amp;P 500 large caps · sized by market cap · colored by daily change
            {mode === "demo" && <span style={{ color: "var(--accent)" }}> · DEMO DATA — {marketLive ? "click Load Live Data for real quotes" : "live market data not configured on the server yet"}</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {progress && (
            <span className="muted" style={{ fontSize: 12 }}>
              {progress.text}
            </span>
          )}
          <button className="btn" onClick={loadLive} disabled={!marketLive || loading}>
            <RefreshCw size={13} className={loading ? "spin" : ""} />
            {loading ? "Fetching…" : mode === "live" ? "Refresh Live Data" : "Load Live Data"}
          </button>
        </div>
      </div>

      {/* color legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 11, color: "var(--muted)" }}>
        {[-3, -2, -1, 0, 1, 2, 3].map((p) => (
          <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 26, height: 14, borderRadius: 3, background: changeColor(p), display: "inline-block" }} />
            <span className="num">{p > 0 ? `+${p}%` : `${p}%`}</span>
          </span>
        ))}
        <span style={{ marginLeft: 14, display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 14, height: 14, border: "2px solid var(--accent)", borderRadius: 3, display: "inline-block" }} />
          your holding
        </span>
      </div>

      <div ref={wrapRef} style={{ position: "relative", width: "100%", height: size.h, background: "#262931", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-strong)" }}>
        {cells.sectors.map((s) => (
          <div key={s.sector} style={{ position: "absolute", left: s.x, top: s.y, width: s.w, height: s.h, outline: "1px solid #16181d" }}>
            <div style={{ height: 17, lineHeight: "17px", padding: "0 6px", fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "#9aa3b2", background: "#1b1e25", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {s.sector}
            </div>
          </div>
        ))}
        {cells.stocks.map((c) => {
          const pct = changes?.[c.t] ?? 0;
          const fontT = Math.max(8, Math.min(26, Math.min(c.w, c.h) * 0.28));
          const showPct = c.h > 30 && c.w > 44;
          const isOwned = owned.has(c.t.toUpperCase());
          return (
            <div
              key={c.t}
              onMouseEnter={(e) => setHover({ item: c, pct, mx: e.clientX, my: e.clientY })}
              onMouseMove={(e) => setHover({ item: c, pct, mx: e.clientX, my: e.clientY })}
              onMouseLeave={() => setHover(null)}
              style={{
                position: "absolute", left: c.x, top: c.y, width: Math.max(0, c.w - 1), height: Math.max(0, c.h - 1),
                background: changeColor(pct),
                outline: isOwned ? "2px solid var(--accent)" : "1px solid rgba(0,0,0,0.35)",
                outlineOffset: isOwned ? -2 : -1,
                zIndex: isOwned ? 2 : 1,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: "default", overflow: "hidden", transition: "filter 0.1s",
                filter: hover?.item?.t === c.t ? "brightness(1.25)" : "none",
              }}
            >
              {c.w > 24 && c.h > 14 && (
                <span style={{ color: "white", fontWeight: 800, fontSize: fontT, lineHeight: 1.05, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
                  {c.t}
                </span>
              )}
              {showPct && (
                <span className="num" style={{ color: "rgba(255,255,255,0.85)", fontSize: Math.max(8, fontT * 0.55), fontWeight: 600 }}>
                  {fmtPct(pct)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {hover && (
        <div style={{ position: "fixed", left: Math.min(hover.mx + 14, window.innerWidth - 230), top: hover.my + 14, zIndex: 3000, background: "#10151d", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "10px 14px", pointerEvents: "none", boxShadow: "0 12px 32px rgba(0,0,0,0.5)", width: 210 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b>{hover.item.t}</b>
            <span className={`num ${hover.pct >= 0 ? "pos" : "neg"}`} style={{ fontWeight: 700 }}>{fmtPct(hover.pct)}</span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{hover.item.n}</div>
          <div className="faint" style={{ fontSize: 11, marginTop: 4 }}>
            {hover.item.sector} · ~${hover.item.mcap >= 1000 ? `${(hover.item.mcap / 1000).toFixed(1)}T` : `${hover.item.mcap}B`} mkt cap
            {owned.has(hover.item.t.toUpperCase()) && <span style={{ color: "var(--accent)" }}> · in your portfolio</span>}
          </div>
        </div>
      )}
    </div>
  );
}
