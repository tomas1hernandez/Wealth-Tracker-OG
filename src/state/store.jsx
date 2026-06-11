import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { conv, valInv, costInv, glInv, roiInv, annROI, fmtCcy, uid } from "../lib/calc.js";
import { fetchQuote, fetchExchangeRate } from "../lib/api.js";

const LS = {
  invs: "wtog.invs",
  settings: "wtog.settings",
  history: "wtog.nwHistory",
};

const load = (k, fallback) => {
  try {
    const r = localStorage.getItem(k);
    return r ? JSON.parse(r) : fallback;
  } catch {
    return fallback;
  }
};
const save = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota */ }
};

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [invs, setInvs] = useState(() => load(LS.invs, []));
  const [settings, setSettings] = useState(() => load(LS.settings, { finnhubKey: "", watchlist: [] }));
  const [nwHistory, setNwHistory] = useState(() => load(LS.history, []));
  const [prices, setPrices] = useState({});
  const [pricesFetched, setPricesFetched] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceError, setPriceError] = useState(null);
  const [exRate, setExRate] = useState(17.5);
  const [displayCcy, setDisplayCcy] = useState("USD");

  useEffect(() => save(LS.invs, invs), [invs]);
  useEffect(() => save(LS.settings, settings), [settings]);
  useEffect(() => save(LS.history, nwHistory), [nwHistory]);
  useEffect(() => { fetchExchangeRate().then(setExRate); }, []);

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
    if (!settings.finnhubKey) { setPricesFetched(true); return; }
    if (!activeTickers.length) { setPricesFetched(true); return; }
    setLoadingPrices(true);
    setPriceError(null);
    try {
      const results = await Promise.allSettled(
        activeTickers.map((t) => fetchQuote(t, settings.finnhubKey))
      );
      setPrices((prev) => {
        const merged = { ...prev };
        results.forEach((r, i) => {
          const t = activeTickers[i];
          if (r.status === "fulfilled" && r.value) merged[t] = r.value;
          else if (!(t in merged)) merged[t] = null;
        });
        return merged;
      });
    } catch (e) {
      setPriceError(String(e.message || e));
    }
    setPricesFetched(true);
    setLoadingPrices(false);
  };

  const tickerKey = activeTickers.join(",");
  const didInit = useRef(false);
  useEffect(() => {
    // refresh on load and whenever the holding set or API key changes
    refreshPrices();
    didInit.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickerKey, settings.finnhubKey]);

  // ── Derived helpers bound to current prices / fx ──
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

  // Record one net-worth snapshot per day (after prices have arrived)
  useEffect(() => {
    if (!pricesFetched || !active.length) return;
    const today = new Date().toISOString().slice(0, 10);
    setNwHistory((prev) => {
      const rest = prev.filter((p) => p.date !== today);
      return [...rest, { date: today, value: +nwUSD.toFixed(2) }].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nwUSD, pricesFetched]);

  const api = {
    invs, active, sold, nwUSD, nwHistory,
    prices, pricesFetched, loadingPrices, priceError,
    exRate, displayCcy, setDisplayCcy,
    settings, setSettings,
    H,
    refreshPrices,
    addInv: (inv) => setInvs((p) => [...p, { ...inv, id: uid() }]),
    updateInv: (id, inv) => setInvs((p) => p.map((i) => (i.id === id ? { ...inv, id } : i))),
    deleteInv: (id) => setInvs((p) => p.filter((i) => i.id !== id)),
    sellInv: (id, salePrice, saleDate) =>
      setInvs((p) => p.map((i) => (i.id === id ? { ...i, status: "sold", salePrice, saleDate } : i))),
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
