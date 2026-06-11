// ── Market data: Finnhub (quotes + fundamentals) and FX rates ────
// A free key from https://finnhub.io powers live quotes, ratios and the
// heat map. Crypto tickers (BTC-USD style) are routed to Binance symbols.

const FINNHUB = "https://finnhub.io/api/v1";

export const isCrypto = (t) => /-USD$/i.test(t || "");

function finnhubSymbol(ticker) {
  const t = (ticker || "").toUpperCase();
  if (isCrypto(t)) return `BINANCE:${t.replace("-USD", "")}USDT`;
  return t;
}

export async function fetchQuote(ticker, key) {
  const res = await fetch(`${FINNHUB}/quote?symbol=${encodeURIComponent(finnhubSymbol(ticker))}&token=${key}`);
  if (!res.ok) throw new Error(`quote ${ticker}: HTTP ${res.status}`);
  const d = await res.json();
  if (!d || !d.c) return null;
  return { price: d.c, change: d.d ?? 0, changePct: d.dp ?? 0, prevClose: d.pc, ts: Date.now() };
}

// Fetch many quotes politely (free tier = 60 calls/min)
export async function fetchQuotes(tickers, key, onProgress) {
  const out = {};
  let done = 0;
  for (const batch of chunk(tickers, 25)) {
    const results = await Promise.allSettled(batch.map((t) => fetchQuote(t, key)));
    results.forEach((r, i) => {
      out[batch[i].toUpperCase()] = r.status === "fulfilled" ? r.value : null;
    });
    done += batch.length;
    onProgress?.(done, tickers.length);
    if (done < tickers.length) await sleep(28_000); // stay under 60/min
  }
  return out;
}

export async function fetchMetrics(ticker, key) {
  const res = await fetch(`${FINNHUB}/stock/metric?symbol=${encodeURIComponent(ticker.toUpperCase())}&metric=all&token=${key}`);
  if (!res.ok) throw new Error(`metric ${ticker}: HTTP ${res.status}`);
  const d = await res.json();
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

// USD→MXN via frankfurter.app (free, no key)
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
