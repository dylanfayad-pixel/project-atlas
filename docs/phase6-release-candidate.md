# Atlas Intelligence — v1.0 Release Candidate

## Product Scope

Atlas Intelligence is a browser-based quantitative
market research terminal built with React and TypeScript.

The active product provides five research workspaces:

1. Market Overview
2. Data Workspace
3. Technical Indicators
4. Market Explorer
5. Risk Intelligence

## Market Data

- Validated daily OHLCV CSV uploads.
- Manual daily OHLCV observations.
- Instrument metadata.
- Independent multi-instrument research collection.
- Up to 20 datasets per collection.
- Dataset selection and removal.
- Historical candlestick visualization.

## Quantitative Analytics

- Historical closing-price returns.
- Annualized historical volatility.
- Maximum closing-price drawdown.
- SMA 20 and SMA 50.
- EMA 12 and EMA 26.
- RSI 14.
- MACD 12/26/9.
- Rules-based market regime classification.
- Deterministic historical research insights.

## Market Explorer

- Multi-instrument comparisons.
- Shared-date alignment.
- Comparison coverage reporting.
- Historical return and risk measurements.
- Instrument search.
- Return, volatility, and drawdown filters.
- Deterministic sorting.
- Stable historical-return rankings.
- Eligibility-aware ranking suppression.
- Explicit insufficient-data states.

Screening filters do not change the underlying
comparison population or common date window.

## Data Quality and Limitations

- Instrument metadata is user-provided and unverified.
- Historical returns exclude dividends.
- Analytics are descriptive, not predictive.
- Missing observations are not fabricated.
- Insufficient history suppresses unsupported metrics.
- Volatility requires sufficient aligned returns.
- Research collections are stored in browser memory.
- Refreshing the application clears imported datasets.
- No trading recommendations are generated.

## Historical Engineering Infrastructure

The repository retains C++20 backtesting and HTTP
integration infrastructure as historical engineering work.

The active Atlas Intelligence interface does not
require the historical backtesting service.

## Latest Local Verification

- 328 frontend tests passed across 43 suites.
- Application TypeScript passed.
- API TypeScript passed.
- ESLint passed.
- Production frontend build passed.
- Markdown link validation passed.
- Git whitespace validation passed.

## Release Acceptance

The following remain required before declaring v1.0
fully released:

- Final responsive browser verification.
- Keyboard and accessibility review.
- Final GitHub Actions verification.
- Production deployment verification.
- End-to-end testing of the public website.
- Documentation consistency audit.

## v1.0 Release Candidate — Ticker Integration

The release candidate adds:

- A compact Market Overview instrument selector.
- Six-metric historical overview cards.
- Ticker-based historical data request interface.
- Validated same-origin historical-data API client.
- Provider dataset creation and independent collection storage.
- Provider provenance including source, retrieval time,
  adjustment status, and requested date range.
- Server-side market-data authorization.
- Explicit public ticker availability controls.
- Regression coverage for cancellation, provider failures,
  collection rejection, and authorization.

### Public Access Policy

Anonymous users can upload CSV files and enter manual
daily OHLCV observations.

Ticker retrieval is disabled in the public interface
until a secure browser authentication mechanism and
enforceable shared request quotas are implemented.

The server-side API requires trusted-client authorization.
Provider credentials must never be embedded in browser
JavaScript or committed to the repository.

### Verification

The latest expected automated baseline is 328 tests
across 43 suites, pending final full-suite confirmation.

Production deployment, browser accessibility, responsive
layout verification, and live provider licensing remain
separate release acceptance requirements.
