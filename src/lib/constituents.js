// ── Heat map universe: large-cap US names grouped Finviz-style ───
// mcap = approximate market cap in $B, used only for cell sizing.

export const SECTORS = [
  "Technology",
  "Communication Services",
  "Consumer Cyclical",
  "Consumer Defensive",
  "Healthcare",
  "Financial",
  "Industrials",
  "Energy",
  "Real Estate",
  "Utilities",
  "Basic Materials",
];

export const CONSTITUENTS = [
  // Technology
  { t: "AAPL", n: "Apple", sector: "Technology", mcap: 3400 },
  { t: "MSFT", n: "Microsoft", sector: "Technology", mcap: 3300 },
  { t: "NVDA", n: "NVIDIA", sector: "Technology", mcap: 3200 },
  { t: "AVGO", n: "Broadcom", sector: "Technology", mcap: 800 },
  { t: "ORCL", n: "Oracle", sector: "Technology", mcap: 480 },
  { t: "CRM", n: "Salesforce", sector: "Technology", mcap: 280 },
  { t: "ADBE", n: "Adobe", sector: "Technology", mcap: 230 },
  { t: "AMD", n: "AMD", sector: "Technology", mcap: 230 },
  { t: "ACN", n: "Accenture", sector: "Technology", mcap: 220 },
  { t: "CSCO", n: "Cisco", sector: "Technology", mcap: 230 },
  { t: "IBM", n: "IBM", sector: "Technology", mcap: 210 },
  { t: "TXN", n: "Texas Instr.", sector: "Technology", mcap: 180 },
  { t: "QCOM", n: "Qualcomm", sector: "Technology", mcap: 180 },
  { t: "INTC", n: "Intel", sector: "Technology", mcap: 130 },
  { t: "MU", n: "Micron", sector: "Technology", mcap: 110 },

  // Communication Services
  { t: "GOOGL", n: "Alphabet", sector: "Communication Services", mcap: 2200 },
  { t: "META", n: "Meta", sector: "Communication Services", mcap: 1500 },
  { t: "NFLX", n: "Netflix", sector: "Communication Services", mcap: 380 },
  { t: "DIS", n: "Disney", sector: "Communication Services", mcap: 200 },
  { t: "TMUS", n: "T-Mobile", sector: "Communication Services", mcap: 250 },
  { t: "VZ", n: "Verizon", sector: "Communication Services", mcap: 170 },
  { t: "CMCSA", n: "Comcast", sector: "Communication Services", mcap: 160 },

  // Consumer Cyclical
  { t: "AMZN", n: "Amazon", sector: "Consumer Cyclical", mcap: 2300 },
  { t: "TSLA", n: "Tesla", sector: "Consumer Cyclical", mcap: 1100 },
  { t: "HD", n: "Home Depot", sector: "Consumer Cyclical", mcap: 400 },
  { t: "MCD", n: "McDonald's", sector: "Consumer Cyclical", mcap: 210 },
  { t: "NKE", n: "Nike", sector: "Consumer Cyclical", mcap: 110 },
  { t: "LOW", n: "Lowe's", sector: "Consumer Cyclical", mcap: 140 },
  { t: "SBUX", n: "Starbucks", sector: "Consumer Cyclical", mcap: 110 },
  { t: "GM", n: "GM", sector: "Consumer Cyclical", mcap: 60 },

  // Consumer Defensive
  { t: "WMT", n: "Walmart", sector: "Consumer Defensive", mcap: 700 },
  { t: "COST", n: "Costco", sector: "Consumer Defensive", mcap: 420 },
  { t: "PG", n: "P&G", sector: "Consumer Defensive", mcap: 400 },
  { t: "KO", n: "Coca-Cola", sector: "Consumer Defensive", mcap: 290 },
  { t: "PEP", n: "PepsiCo", sector: "Consumer Defensive", mcap: 210 },
  { t: "PM", n: "Philip Morris", sector: "Consumer Defensive", mcap: 200 },
  { t: "MO", n: "Altria", sector: "Consumer Defensive", mcap: 100 },

  // Healthcare
  { t: "LLY", n: "Eli Lilly", sector: "Healthcare", mcap: 750 },
  { t: "JNJ", n: "J&J", sector: "Healthcare", mcap: 380 },
  { t: "UNH", n: "UnitedHealth", sector: "Healthcare", mcap: 280 },
  { t: "ABBV", n: "AbbVie", sector: "Healthcare", mcap: 330 },
  { t: "MRK", n: "Merck", sector: "Healthcare", mcap: 200 },
  { t: "PFE", n: "Pfizer", sector: "Healthcare", mcap: 140 },
  { t: "TMO", n: "Thermo Fisher", sector: "Healthcare", mcap: 200 },
  { t: "ABT", n: "Abbott", sector: "Healthcare", mcap: 230 },
  { t: "AMGN", n: "Amgen", sector: "Healthcare", mcap: 150 },

  // Financial
  { t: "BRK-B", n: "Berkshire", sector: "Financial", mcap: 1000 },
  { t: "JPM", n: "JPMorgan", sector: "Financial", mcap: 800 },
  { t: "V", n: "Visa", sector: "Financial", mcap: 650 },
  { t: "MA", n: "Mastercard", sector: "Financial", mcap: 500 },
  { t: "BAC", n: "Bank of America", sector: "Financial", mcap: 350 },
  { t: "WFC", n: "Wells Fargo", sector: "Financial", mcap: 260 },
  { t: "GS", n: "Goldman Sachs", sector: "Financial", mcap: 220 },
  { t: "MS", n: "Morgan Stanley", sector: "Financial", mcap: 220 },
  { t: "AXP", n: "Amex", sector: "Financial", mcap: 210 },
  { t: "C", n: "Citigroup", sector: "Financial", mcap: 160 },

  // Industrials
  { t: "GE", n: "GE Aerospace", sector: "Industrials", mcap: 290 },
  { t: "CAT", n: "Caterpillar", sector: "Industrials", mcap: 190 },
  { t: "RTX", n: "RTX", sector: "Industrials", mcap: 180 },
  { t: "HON", n: "Honeywell", sector: "Industrials", mcap: 150 },
  { t: "UNP", n: "Union Pacific", sector: "Industrials", mcap: 140 },
  { t: "BA", n: "Boeing", sector: "Industrials", mcap: 130 },
  { t: "DE", n: "Deere", sector: "Industrials", mcap: 130 },
  { t: "LMT", n: "Lockheed", sector: "Industrials", mcap: 110 },
  { t: "UPS", n: "UPS", sector: "Industrials", mcap: 100 },

  // Energy
  { t: "XOM", n: "ExxonMobil", sector: "Energy", mcap: 500 },
  { t: "CVX", n: "Chevron", sector: "Energy", mcap: 280 },
  { t: "COP", n: "ConocoPhillips", sector: "Energy", mcap: 130 },
  { t: "EOG", n: "EOG Resources", sector: "Energy", mcap: 70 },
  { t: "SLB", n: "SLB", sector: "Energy", mcap: 55 },

  // Real Estate
  { t: "PLD", n: "Prologis", sector: "Real Estate", mcap: 105 },
  { t: "AMT", n: "American Tower", sector: "Real Estate", mcap: 95 },
  { t: "EQIX", n: "Equinix", sector: "Real Estate", mcap: 85 },
  { t: "SPG", n: "Simon Property", sector: "Real Estate", mcap: 60 },

  // Utilities
  { t: "NEE", n: "NextEra", sector: "Utilities", mcap: 150 },
  { t: "SO", n: "Southern Co", sector: "Utilities", mcap: 95 },
  { t: "DUK", n: "Duke Energy", sector: "Utilities", mcap: 90 },

  // Basic Materials
  { t: "LIN", n: "Linde", sector: "Basic Materials", mcap: 220 },
  { t: "SHW", n: "Sherwin-Williams", sector: "Basic Materials", mcap: 90 },
  { t: "APD", n: "Air Products", sector: "Basic Materials", mcap: 65 },
  { t: "FCX", n: "Freeport", sector: "Basic Materials", mcap: 60 },
];

// Deterministic per-day pseudo changes so demo mode looks like a real
// trading day and doesn't reshuffle on every render.
export function demoChanges() {
  const day = new Date().toISOString().slice(0, 10);
  let seed = [...day].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const drift = (rand() - 0.5) * 2; // market-wide tilt
  const out = {};
  for (const c of CONSTITUENTS) {
    const r = rand() + rand() + rand(); // ~normal-ish 0..3
    out[c.t] = +(drift + (r - 1.5) * 2.2).toFixed(2);
  }
  return out;
}
