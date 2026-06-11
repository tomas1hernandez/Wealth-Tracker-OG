# Wealth Tracker OG

A personal net-worth and investment tracker with a professional dark theme.
All data stays in your browser — no server, no account.

## Features

- **Dashboard** — total net worth, gain/loss, ROI, allocation donut, category breakdown, and a net-worth trend chart (one snapshot recorded per day)
- **Portfolio** — track Cash, Stocks (incl. crypto & ETFs), Bonds (US Treasuries, T-Bills, CETES 🇲🇽) and Hard Assets with loan/mortgage amortization
- **Heat Map** — dedicated Finviz-style S&P 500 treemap: cells sized by market cap, colored by daily % change, grouped by sector; your holdings are outlined in gold
- **Key Ratios** — P/E, P/B, P/S, EPS, ROE, net margin, revenue growth, D/E, current ratio, dividend yield, beta and 52-week range for every holding + a watchlist, with health color-coding
- **History** — realized P&L, win rate, and every closed position
- **Dual currency** — USD ⇄ MXN with a live exchange rate
- **Backup/restore** — export and import your data as JSON

## Getting started

```bash
npm install
npm run dev
```

## Live market data (optional but recommended)

1. Create a free account at [finnhub.io](https://finnhub.io/register)
2. Copy your API key
3. Open **Settings** in the app and paste it

Without a key the app still works: the heat map shows demo data and stock
values use your cost basis or a manual price you set per position.

## Deployment

Pushing to `main` automatically builds and deploys to GitHub Pages via
`.github/workflows/deploy.yml`.

## Tech

Vite · React 18 · React Router · Recharts · Lucide · custom squarified-treemap renderer
