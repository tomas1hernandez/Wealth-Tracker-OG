import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { conv, valInv, costInv, glInv, roiInv, annROI, fmtCcy, uid } from "../lib/calc.js";
import { fetchQuotes, fetchMarketStatus, fetchExchangeRate } from "../lib/api.js";

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [loaded, setLoaded] = useState(false);
  const [invs, setInvs] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [nwHistory, setNwHistory] = useState([]);
  const [prices, setPrices] = useState({});
  const [pricesFetched, setPricesFetched] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [marketLive, setMarketLive] = useState(false);
  const [exRate, setExRate] = useState(17.5);
  const [displayCcy, setDisplayCcy] = useState("USD");
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error

  // ── initial load: server data + market status + fx ──
  useEffect(() => {
    fetchExchangeRate().then(setExRate);
    fetchMarketStatus().then((s) => setMarketLive(s.live)).catch(() => setMarketLive(false));
    fetch("/api/data", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then(({ data }) => {
        if (data) {
          setInvs(Array.isArray(data.invs) ? data.invs : []);
          setWatchlist(Array.isArray(data.watchlist) ? data.watchlist : []);
          setNwHistory(Array.isArray(data.nwHistory) ? data.nwHistory : []);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // ── debounced server save ──
  const saveTimer = useRef(null);
  const skipNextSave = useRef(true); // don't save right after the initial load
  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    setSaveState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/data", {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invs, watchlist, nwHistory }),
        });
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 1200);
    return () => clearTimeout(saveTimer.current);
  }, [invs, watchlist, nwHistory, loaded]);

  const activeTickers = useMemo(
    () =>
      [...new Set(
        invs
          .filter((i) => i.category === "stock" && i.status === "active" && i.ticker)
          .map((i) => i.ticker.toUpperCase())
      )],
    [invs]
  );

  const refreshPrices = async () => {
    if (!marketLive || !activeTickers.length) { setPricesFetched(true); return; }
    setLoadingPrices(true);
    let quotes = {};
    try { quotes = await fetchQuotes(activeTickers); } catch { /* keep previous prices */ }
    setPrices((prev) => {
      const merged = { ...prev };
      for (const t of activeTickers) {
        if (quotes[t]) merged[t] = quotes[t];
        else if (!(t in merged)) merged[t] = null;
      }
      return merged;
    });
    setPricesFetched(true);
    setLoadingPrices(false);
  };

  const tickerKey = activeTickers.join(",");
  useEffect(() => {
    if (loaded) refreshPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickerKey, marketLive, loaded]);

  // ── derived helpers bound to current prices / fx ──
  const H = useMemo(() => {
    const $d = (n, ccy = "USD") => fmtCcy(conv(n, ccy, displayCcy, exRate), displayCcy);
    return {
      valInv: (i) => valInv(i, prices),
      costInv,
      glInv: (i) => glInv(i, prices),
      roiInv: (i) => roiInv(i, prices),
      annROI: (i) => annROI(i, prices),
      valUSD: (i) => conv(valInv(i, prices), i.currency || "USD", "USD", exRate),
      costUSD: (i) => conv(costInv(i), i.currency || "USD", "USD", exRate),
      $d,
      displayCcy,
      exRate,
      prices,
      pricesFetched,
      loadingPrices,
      invs,
    };
  }, [prices, exRate, displayCcy, pricesFetched, loadingPrices, invs]);

  const active = useMemo(() => invs.filter((i) => i.status === "active"), [invs]);
  const sold = useMemo(() => invs.filter((i) => i.status === "sold"), [invs]);
  const nwUSD = useMemo(() => active.reduce((s, i) => s + H.valUSD(i), 0), [active, H]);

  // record one net-worth snapshot per day (after prices have arrived)
  useEffect(() => {
    if (!pricesFetched || !active.length) return;
    const today = new Date().toISOString().slice(0, 10);
    setNwHistory((prev) => {
      const existing = prev.find((p) => p.date === today);
      if (existing && Math.abs(existing.value - nwUSD) < 0.01) return prev;
      const rest = prev.filter((p) => p.date !== today);
      return [...rest, { date: today, value: +nwUSD.toFixed(2) }].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nwUSD, pricesFetched]);

  const api = {
    loaded, invs, active, sold, nwUSD, nwHistory,
    prices, pricesFetched, loadingPrices,
    marketLive, saveState,
    exRate, displayCcy, setDisplayCcy,
    watchlist, setWatchlist,
    H,
    refreshPrices,
    addInv: (inv) => setInvs((p) => [...p, { ...inv, id: uid() }]),
    updateInv: (id, inv) => setInvs((p) => p.map((i) => (i.id === id ? { ...inv, id } : i))),
    deleteInv: (id) => setInvs((p) => p.filter((i) => i.id !== id)),
    sellInv: (id, salePrice, saleDate) =>
      setInvs((p) => p.map((i) => (i.id === id ? { ...i, status: "sold", salePrice, saleDate } : i))),
    importData: (d) => {
      if (Array.isArray(d.invs)) setInvs(d.invs);
      if (Array.isArray(d.watchlist)) setWatchlist(d.watchlist);
      if (Array.isArray(d.nwHistory)) setNwHistory(d.nwHistory);
    },
    wipeData: () => { setInvs([]); setWatchlist([]); setNwHistory([]); },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
