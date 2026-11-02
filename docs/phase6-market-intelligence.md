# Phase 6 — Atlas Intelligence

## Product Direction

Project Atlas is transitioning from a historical backtesting
research application into an automated quantitative market
intelligence platform.

The new product focuses on financial data exploration,
technical indicators, market regimes, screening, risk
analysis, and explainable historical research.

Historical backtesting code remains in the repository
during the migration but is not part of the new product
roadmap.

## Phase 6.1 — Automatic Market Analytics

Status: Implemented and verified locally.

### Capabilities

- Validated daily OHLCV CSV ingestion.
- Manual historical data entry.
- Automatic browser-side financial calculations.
- Historical close-price return.
- Annualized historical volatility.
- Maximum close-price drawdown.
- SMA 20 and SMA 50.
- RSI 14.
- Explicit insufficient-data states.
- No backtesting API required for these calculations.

### Architecture

Validated OHLCV data
    |
    v
Research session
    |
    v
marketAnalytics.ts
    |
    v
MarketIntelligence.tsx
    |
    v
Historical metrics and research limitations

### Verification

Latest reported local results:

- 206 frontend tests passed across 22 suites.
- Application TypeScript passed.
- API TypeScript passed.
- ESLint passed.
- Production frontend build passed.
- Git whitespace checks passed.

These results do not establish that the new interface
has been deployed publicly.

### Financial Limitations

- Historical observations do not predict future returns.
- Price returns exclude dividends and corporate-action
  adjustments unless the source data incorporates them.
- Volatility assumes 252 trading days annually.
- Drawdown uses closing prices rather than intraday lows.
- Technical indicators do not establish profitability.
- Insufficient historical data must not be represented
  as reliable evidence.

### Next Milestones

- Remove legacy backtesting navigation and workflows.
- Implement EMA and MACD.
- Add market regime classification.
- Add automated historical research summaries.
- Implement market screening and comparative rankings.
- Expand portfolio risk intelligence.
- Redesign the professional Atlas Terminal.
- Update production architecture and CI.
