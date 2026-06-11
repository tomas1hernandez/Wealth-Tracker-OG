// ── Market data via our own backend (/api/market/*) ─────────────
// The Finnhub key lives server-side as a Worker secret; the browser
// only ever talks to our backend, which proxies and caches.

export const isCrypto = (t) => /-USD$/i.test(t || "");

async function apiGet(path) {
  const res = await fetch(path, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

export async function fetchMarketStatus() {
  return apiGet("/api/market/status");
}

export async function fetchQuote(ticker) {
  const d = await apiGet(`/api/market/quote?symbol=${encodeURIComponent(ticker)}`);
  if (!d || !d.c) return null;
  return { price: d.c, change: d.d ?? 0, changePct: d.dp ?? 0, prevClose: d.pc, ts: Date.now() };
}

// Fetch many quotes politely (Finnhub free tier = 60 calls/min; the
// worker caches each symbol for 60 s so retries are cheap)
export async function fetchQuotes(tickers, onProgress) {
  const out = {};
  let done = 0;
  for (const batch of chunk(tickers, 25)) {
    const results = await Promise.allSettled(batch.map((t) => fetchQuote(t)));
    results.forEach((r, i) => {
      out[batch[i].toUpperCase()] = r.status === "fulfilled" ? r.value : null;
    });
    done += batch.length;
    onProgress?.(done, tickers.length);
    if (done < tickers.length) await sleep(28_000);
  }
  return out;
}

export async function fetchMetrics(ticker) {
  const d = await apiGet(`/api/market/metrics?symbol=${encodeURIComponent(ticker.toUpperCase())}`);
  const m = d?.metric || {};
  return {
    pe: m.peTTM ?? m.peBasicExclExtraTTM ?? null,
    pb: m.pbQuarterly ?? m.pb ?? null,
    ps: m.psTTM ?? null,
    eps: m.epsTTM ?? m.epsBasicExclExtraItemsTTM ?? null,
    roe: m.roeTTM ?? null,
    roa: m.roaTTM ?? null,
    grossMargin: m.grossMarginTTM ?? null,
    netMargin: m.netProfitMarginTTM ?? null,
    debtToEquity: m["totalDebt/totalEquityQuarterly"] ?? null,
    currentRatio: m.currentRatioQuarterly ?? null,
    divYield: m.dividendYieldIndicatedAnnual ?? null,
    beta: m.beta ?? null,
    revGrowth: m.revenueGrowthTTMYoy ?? null,
    high52: m["52WeekHigh"] ?? null,
    low52: m["52WeekLow"] ?? null,
    marketCap: m.marketCapitalization ?? null, // in $M
    ts: Date.now(),
  };
}

// USD→MXN via frankfurter.app (free, no key, public data)
export async function fetchExchangeRate() {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=MXN");
    const d = await res.json();
    if (d?.rates?.MXN) return d.rates.MXN;
  } catch { /* fall through */ }
  return 17.5;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};
