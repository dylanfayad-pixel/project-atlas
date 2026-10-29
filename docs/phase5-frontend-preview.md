# Phase 5 — Atlas Terminal Frontend Modernization

## Phase 5.1: Initial Research Setup Preview

This milestone introduces a data-first research workflow
to the existing Atlas Terminal frontend.

### Implemented

- Research Setup as the initial navigation destination.
- Browser-local historical OHLCV CSV imports.
- Strict daily-date and OHLCV validation.
- Validation errors for malformed input.
- Dataset metadata and observation previews.
- Preservation of the existing research dashboard.
- Thirteen new OHLCV parser regression tests.

### Data Contract

Required CSV columns:

timestamp,open,high,low,close,volume

Timestamps use YYYY-MM-DD.

Prices must be positive and finite.
OHLC relationships must be consistent.
Volume must be a nonnegative safe integer.
Timestamps must be strictly increasing.

### Current Limitations

- CSV import supports daily-date observations only.
- Uploaded data remains local to the browser.
- Imported datasets are not yet passed to the C++ engine.
- Existing dashboard results use synthetic fixtures.
- No live market feed or brokerage integration exists.
- No real-money trading is supported.
- Market calendars and corporate actions are not
  validated by the initial importer.

### Verification

The Phase 5.1 preview passed:

- TypeScript type checking.
- 41 frontend tests.
- ESLint.
- Vite production build.
- Git whitespace validation.

### Next Development Priorities

1. Add instrument and market metadata.
2. Add timeframe and historical-period configuration.
3. Implement strategy and execution settings.
4. Connect validated datasets to the C++ backtester.
5. Add interactive trading charts and trade inspection.
6. Expand automated browser and accessibility testing.

This deployment is a research preview, not a
production trading service.
