export const CATS = ["cash", "stock", "bond", "asset"];
export const CLABEL = { cash: "Cash", stock: "Stocks", bond: "Bonds", asset: "Hard Assets" };
export const CCOLOR = { cash: "#6E9FE8", stock: "#C9A86A", bond: "#8FBC9F", asset: "#CD7B5C" };

export const BOND_TYPES = [
  { id: "treasury_bond", label: "US Treasury Bond / Note", flag: "🇺🇸", short: "T-Bond", pays: "Semi-annual coupon", defaultCcy: "USD" },
  { id: "tbill", label: "US Treasury Bill (T-Bill)", flag: "🇺🇸", short: "T-Bill", pays: "At maturity (discount)", defaultCcy: "USD" },
  { id: "cetes", label: "CETES — México", flag: "🇲🇽", short: "CETES", pays: "Al vencimiento (descuento)", defaultCcy: "MXN" },
];

export const TICKERS = [
  { t: "AAPL", n: "Apple Inc." }, { t: "MSFT", n: "Microsoft" }, { t: "GOOGL", n: "Alphabet A" },
  { t: "AMZN", n: "Amazon" }, { t: "NVDA", n: "NVIDIA" }, { t: "TSLA", n: "Tesla" },
  { t: "META", n: "Meta Platforms" }, { t: "JPM", n: "JPMorgan Chase" }, { t: "V", n: "Visa" },
  { t: "WMT", n: "Walmart" }, { t: "XOM", n: "ExxonMobil" }, { t: "MA", n: "Mastercard" },
  { t: "AVGO", n: "Broadcom" }, { t: "HD", n: "Home Depot" }, { t: "CVX", n: "Chevron" },
  { t: "LLY", n: "Eli Lilly" }, { t: "JNJ", n: "Johnson & Johnson" }, { t: "ABBV", n: "AbbVie" },
  { t: "KO", n: "Coca-Cola" }, { t: "BAC", n: "Bank of America" }, { t: "PEP", n: "PepsiCo" },
  { t: "COST", n: "Costco" }, { t: "ADBE", n: "Adobe" }, { t: "CRM", n: "Salesforce" },
  { t: "NFLX", n: "Netflix" }, { t: "AMD", n: "AMD" }, { t: "INTC", n: "Intel" },
  { t: "QCOM", n: "Qualcomm" }, { t: "ORCL", n: "Oracle" }, { t: "IBM", n: "IBM" },
  { t: "CSCO", n: "Cisco" }, { t: "DIS", n: "Disney" }, { t: "NKE", n: "Nike" },
  { t: "MCD", n: "McDonald's" }, { t: "GS", n: "Goldman Sachs" }, { t: "MS", n: "Morgan Stanley" },
  { t: "MU", n: "Micron Technology" }, { t: "PYPL", n: "PayPal" }, { t: "COIN", n: "Coinbase" },
  { t: "MSTR", n: "MicroStrategy" }, { t: "PLTR", n: "Palantir" }, { t: "UBER", n: "Uber" },
  { t: "MLM", n: "Martin Marietta" }, { t: "VMC", n: "Vulcan Materials" },
  { t: "MARA", n: "Marathon Digital" }, { t: "RIOT", n: "Riot Platforms" },
  { t: "SPY", n: "S&P 500 ETF" }, { t: "QQQ", n: "Nasdaq-100 ETF" }, { t: "VTI", n: "Vanguard Total Mkt" },
  { t: "IWM", n: "Russell 2000 ETF" }, { t: "GLD", n: "Gold ETF" }, { t: "TLT", n: "20Y Treasury ETF" },
  { t: "IBIT", n: "iShares Bitcoin ETF" }, { t: "FBTC", n: "Fidelity Bitcoin ETF" },
  { t: "BTC-USD", n: "Bitcoin" }, { t: "ETH-USD", n: "Ethereum" }, { t: "SOL-USD", n: "Solana" },
  { t: "BNB-USD", n: "Binance Coin" }, { t: "XRP-USD", n: "XRP" }, { t: "ADA-USD", n: "Cardano" },
  { t: "DOGE-USD", n: "Dogecoin" }, { t: "AVAX-USD", n: "Avalanche" }, { t: "LINK-USD", n: "Chainlink" },
  { t: "LTC-USD", n: "Litecoin" }, { t: "NEAR-USD", n: "NEAR Protocol" }, { t: "MATIC-USD", n: "Polygon" },
];
