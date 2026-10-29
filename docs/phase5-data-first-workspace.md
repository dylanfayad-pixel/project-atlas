# Project Atlas — Phase 5.3 Data-First Research Workspace

**Creator:** Dylan Fayad

**Status:** Implemented locally; release verification pending.

## Overview

Phase 5.3 introduces a data-first research experience
for Atlas Terminal.

The application starts without synthetic performance
results. Visitors must explicitly activate Demo Mode
to view demonstration data.

## Implemented capabilities

- Empty research workspace on initial application load.
- Explicit Launch Demo and Exit Demo controls.
- Strict daily OHLCV CSV import.
- Manual daily OHLCV observation entry.
- Interactive candlestick visualization.
- Shared research-session state.
- User-supplied instrument metadata.
- Separation of real-data research and synthetic results.
- Session-isolation regression tests.
- Delayed-response regression coverage.

## Historical market-data API foundation

The repository includes a serverless historical-data
API and a Massive provider adapter.

Implemented components include:

- Request and response validation.
- Provider error mapping.
- Bounded upstream response reading.
- Provider request timeouts.
- API-key header handling.
- Aggregate normalization.
- Rejection of explicitly paginated responses.
- Mocked HTTP integration tests.

The production API currently uses an unconfigured
provider and does not retrieve live historical data.

The provider adapter has not been verified against
a live provider account.

## Verification

The latest reported local verification passed:

- 157 Vitest tests across 16 test files.
- Frontend TypeScript.
- Backend TypeScript.
- ESLint.
- Vite production build.
- Git whitespace checks.

These are local verification results.

C++ Debug and Release testing and GitHub Actions
verification must be completed before release.

## Known limitations

- Imported data is not submitted to the C++ backtester.
- No public user-selected backtesting API exists.
- No live market-data provider is enabled.
- No automatic strategy selection is implemented.
- Research sessions are not persisted across reloads.
- Demonstration performance is synthetic.
- The application is not a brokerage trading service.
- Provider licensing, access controls, and public
  request quotas require further implementation.

## Attribution

Project Atlas was created and developed by Dylan Fayad.

Copyright (c) 2026 Dylan Fayad.
All rights reserved unless otherwise licensed.
