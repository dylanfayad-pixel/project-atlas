# Project Atlas — Phase 5.2 Integrated Trading Workspace

## Status

Implemented and verified locally.

Public deployment and GitHub Actions verification
remain pending for this milestone.

## Purpose

Phase 5.2 connects browser-imported historical market
data to a shared research session across Atlas Terminal.

The objective is to prevent imported data from being
confused with unrelated synthetic demonstration results.

## Implemented Features

### Historical Market Visualization

- TradingView Lightweight Charts v5.
- Interactive daily OHLCV candlesticks.
- Separate trading-volume histogram.
- Responsive chart resizing.
- Dark-theme financial chart presentation.

### Shared Research Session

Application-level React state stores the active dataset.

Research Setup, Overview, Strategies, Market Data,
and Backtests consume the same active session.

The selected dataset remains available when users
navigate between workspaces.

### Instrument Metadata

Users may enter:

- Instrument ticker.
- Exchange label.

The values are normalized and validated.

Instrument metadata is user-provided and unverified.
It does not authenticate the uploaded price history.

### Dataset Replacement

Uploading a new valid CSV creates a new dataset identity.

Previously entered instrument metadata is reset.

Invalid CSV uploads preserve the previously valid dataset.

### Demonstration Separation

The existing synthetic demonstration views remain
available when no uploaded dataset is active.

When an uploaded dataset is selected:

- Overview shows dataset information.
- Strategies shows configuration, not computed signals.
- Market Data shows uploaded OHLCV candles.
- Backtests reports that no backtest has executed.

The application must not associate synthetic
performance results with uploaded market data.

## Architecture

The active ResearchSession is owned by App.tsx.

ResearchSetup publishes validated datasets to App.

InstrumentEditor validates and saves user-provided
instrument metadata.

SessionIdentity displays active instrument and
dataset provenance across workspaces.

WorkspaceContent selects the appropriate views
based on the active research session.

CandlestickChart renders validated daily OHLCV data.

The C++ engine is not invoked from the browser.

## Testing

Local Phase 5.2 verification:

- 67 Vitest tests passed.
- TypeScript passed.
- ESLint passed.
- Vite production build passed.
- Git whitespace validation passed.

The test suite includes:

- CSV and JSON validation.
- Research-session model tests.
- Instrument metadata validation.
- Instrument editor interaction tests.
- Application navigation and dataset replacement tests.
- Prevention of unrelated synthetic results.

The financial chart itself still requires separate
visual and browser-level verification.

## Known Limitations

- Uploaded data is stored in browser memory only.
- Refreshing the page resets the active session.
- Imported data is not persisted on a server.
- CSV timestamps currently support daily dates.
- Intraday timestamps are not yet supported.
- User-entered symbols and exchanges are unverified.
- No market-data provider is connected.
- No user-selected C++ backtest execution is available.
- No real brokerage orders are supported.
- Strategy parameters are not yet editable through
  the complete research workflow.
- No automatic strategy optimization is implemented.
- Corporate actions and trading calendars are not
  comprehensively validated.
- Historical results do not guarantee future returns.

## Next Milestone

Phase 5.3 will introduce additional market-data sources:

1. Manual OHLCV entry.
2. Ticker-based historical data retrieval.
3. Explicit market metadata and date-range selection.
4. Data provenance and validation improvements.

Subsequent milestones will connect interactive
configuration to the C++ engine and implement
out-of-sample strategy comparison.

## Research Disclaimer

Project Atlas is educational quantitative research
software, not a brokerage, investment adviser,
or production trading system.
