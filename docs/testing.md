# Project Atlas — Testing and CI

## Current Verification — Phase 5.5

Latest reported local results:

| Suite | Result |
|---|---|
| C++ CTest | 28/28 passed |
| Python HTTP integration | 8/8 passed |
| Frontend Vitest | 180/180 passed |
| Frontend TypeScript | Passed |
| API TypeScript | Passed |
| ESLint | Passed |
| Production build | Passed |

Run backend verification from the repository root:

```bash
ctest --test-dir build --output-on-failure
python3 services/backtest/test_server.py
```

Run frontend verification:

```bash
cd frontend
npm run test
npx tsc --noEmit -p tsconfig.app.json
npx tsc --noEmit -p tsconfig.api.json
npm run lint
npm run build
```

GitHub Actions runs C++ Debug and Release builds,
frontend checks, and Python HTTP integration tests.

These are local verification results. CI status must
be verified after publishing.

Historical milestone test counts below are retained
for reproducibility and should not be interpreted as
the current test baseline.

See [Phase 5.5 local backtesting](phase5-local-backtesting.md).

## Automated Test Suites

Phase 1 originally registered seven CTest suites.

| Test | Coverage |
|---|---|
| atlas_startup | Application initialization |
| market_bar_validation | OHLCV validity and non-finite prices |
| csv_reader | Valid CSV loading and capacity hints |
| csv_error_handling | File, header, numeric and OHLCV errors; CRLF |
| date_validation | Calendar dates and leap years |
| csv_chronology | Ordering, duplicates and invalid dates |
| csv_column_validation | Missing/extra columns and numeric extremes |

The CSV column suite includes malformed prices, overflow,
NaN, negative volume, and unsigned volume overflow.

Temporary test directories are created using mkdtemp
and cleaned up using RAII. This helper is Linux/POSIX-specific.

## Debug Verification

    cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
    cmake --build build --parallel 2
    ctest --test-dir build --parallel 2 --output-on-failure

## Release Verification

    cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
    cmake --build build-release --parallel 2
    ctest --test-dir build-release --parallel 2 --output-on-failure

The Phase 2 milestone previously passed 17 CTest suites. Phase 3 now registers 20 suites, verified locally in Debug and Release.

## Continuous Integration

GitHub Actions uses Ubuntu 24.04 and a Debug/Release
build matrix.

Each job configures CMake, builds the project,
and runs the registered CTest suites.

The workflow uses actions/checkout@v4. A previous
Node.js runtime deprecation warning remains a
maintenance item.

A successful local build does not establish CI success.
The final GitHub workflow must be verified after pushing.

## Remaining Limitations

The current suite is not exhaustive.

Additional future testing may include:

- Fuzz testing
- Sanitizers
- Extremely long CSV fields
- Resource exhaustion
- Cross-platform compatibility
- Large-scale adversarial inputs
- Additional performance regression coverage

Passing tests does not imply production readiness.

---

## Phase 2 — Automated Test Coverage

Phase 2 expanded the project to 12 CTest suites.

Five Phase 2 suites extend the seven Phase 1 suites.

| Test | Coverage |
|---|---|
| historical_replay | Sequential delivery, indices, empty input, missing callback |
| strategy_signals | Buy-and-Hold signals and reset behavior |
| backtest_runner | Signal collection, repeatability, empty input |
| sma_crossover | Bullish/bearish crossovers, reset, invalid periods |
| signal_exporter | CSV schema, empty export, invalid output path |

### Signal Exporter Test Isolation

The exporter regression test creates a unique temporary
directory using `mkdtemp`.

RAII cleanup removes the directory when the test exits,
including when assertions throw exceptions.

This implementation is POSIX-specific and currently
targets the Linux development and CI environments.

### Local Verification

Debug:

```bash
cmake --build build --parallel 2
ctest --test-dir build --parallel 2 \
  --output-on-failure
```

Release:

```bash
cmake --build build-release --parallel 2
ctest --test-dir build-release --parallel 2 \
  --output-on-failure
```

All 12 suites passed locally in both configurations.

### Current Testing Limitations

The historical Phase 2 tests alone did not establish:

- Complete prevention of look-ahead bias
- Correctness of order fills or portfolio accounting
- Transaction-cost or slippage behavior
- Financial return calculations
- Production trading readiness

These require additional implementation and testing.

## Current Portfolio and Frontend Verification

The most recently reported local results are:

| Area | Result |
|---|---|
| C++ Debug | 17/17 CTest suites passed |
| C++ Release | 17/17 CTest suites passed |
| Frontend | 10/10 Vitest tests passed |
| Frontend lint | Passed |
| Frontend production build | Passed |
| Portfolio JSON integration | Passed |

These results are historical local verification results.
They must be rerun after subsequent changes.

### Additional C++ Coverage

The expanded suite includes:

- `portfolio_simulator`
- `portfolio_robustness`
- `performance_metrics`
- `portfolio_json_exporter`
- `portfolio_json_integration`

The integration test executes the portfolio demonstration,
parses its JSON output, and checks known synthetic results.

### Frontend Coverage

The frontend tests validate the portfolio JSON parser,
including malformed trades, non-finite numbers, invalid
schema versions, and inconsistent equity summaries.

### Continuous Integration

The workflow in `.github/workflows/ci.yml` includes:

- C++ Debug build and tests.
- C++ Release build and tests.
- Frontend tests, ESLint, and production build.

The updated workflow must pass on GitHub before the
milestone is considered published and verified.

### Remaining Testing Limitations

The current tests do not establish production readiness.

Further work includes broader accounting invariants,
larger datasets, randomized testing, security testing,
and realistic execution-model verification.


## Phase 3 — Execution Cost Verification

Phase 3 adds three CTest suites:

| Test | Coverage |
|---|---|
| `execution_costs` | Commissions, slippage, accounting and invalid configurations |
| `portfolio_json_v2` | Versioned cost serialization and validation |
| `portfolio_json_v2_integration` | Real C++ JSON generation and frontend fixture reconciliation |

The project now registers **20 CTest suites**.

All 20 passed locally in both Debug and Release during
Phase 3 release preparation.

The frontend also passed 15 Vitest tests, TypeScript
checking, ESLint, and a Vite production build.

The JSON v2 integration test runs the demonstration in
a temporary directory and verifies the generated output
against the committed frontend fixture.

These tests are not a substitute for production financial
validation, adversarial testing, or live-market execution.

Phase 3 GitHub Actions verification completed successfully.


## Phase 4 — Risk Analytics Verification

Phase 4 introduces the `risk_analytics` CTest suite.

The Phase 4.1 milestone registered 21 CTest suites.

All 21 passed locally in Debug and Release during
the Phase 4.1 implementation review.

The risk analytics tests cover:

- Periodic return sampling.
- Annualized sample volatility.
- Sharpe ratio and periodic risk-free rate.
- Downside deviation and Sortino ratio.
- Nonzero downside targets.
- Flat portfolios and insufficient observations.
- Portfolio depletion.
- Invalid configuration and non-finite observations.
- Selected extreme numerical inputs.

The risk analytics module is not yet exposed through
the frontend JSON contract.

The 21-suite count describes the current local Phase 4
working tree. The published Phase 3 milestone contains
20 CTest suites until the Phase 4 changes are committed.

GitHub Actions verification for Phase 4.1 remains pending.


## Phase 4.2 — Entry Risk Control Verification

The current Phase 4.2 working tree registers
23 CTest suites.

The new dedicated suites are:

- `position_sizing`
- `exposure_limits`

They verify configurable entry allocation,
commission-aware budgets, entry exposure,
slippage, residual cash, invalid configuration,
and market-driven exposure changes.

The tests also cover selected financial
boundary cases and equity reconciliation.

All 23 suites passed locally in Debug and Release
during Phase 4.2 verification.

Phase 4.2 GitHub Actions verification is pending.

Historical Phase 4.1 results remain 21 suites.

---

## Phase 4.3 — Drawdown Safeguard Verification

The Phase 4.3 working tree registers 24 CTest suites.

The new `drawdown_controls` suite verifies:

- Threshold detection and boundary behavior.
- Next-bar liquidation without look-ahead.
- Permanent BUY restrictions.
- Optional liquidation and ordinary strategy exits.
- Commission and adverse slippage accounting.
- Final-bar breaches.
- Market-gap losses.
- Rejected liquidation when proceeds cannot cover fees.
- Invalid configuration rejection.
- Default behavior compatibility.

All 24 CTest suites passed locally in Debug and Release.

The frontend's 15 Vitest tests, TypeScript checks,
ESLint, and production build also passed locally.

GitHub Actions verification for Phase 4.3 is pending.

## Phase 4.4 — Risk Reporting Verification

Phase 4.4 adds three CTest suites:

| Test | Purpose |
|---|---|
| `risk_events` | Drawdown and liquidation event behavior |
| `portfolio_json_v3` | Schema v3 serialization and rejection tests |
| `portfolio_json_v3_integration` | C++ generation and Python JSON validation |

The current working tree registers 27 CTest suites.

The latest reported local verification passed:

| Verification | Result |
|---|---|
| C++ Debug | 27/27 |
| C++ Release | 27/27 |
| Frontend Vitest | 28/28 |
| TypeScript | Passed |
| ESLint | Passed |
| Frontend production build | Passed |

The frontend tests include 13 JSON v3 cases
using a fixture generated by the C++ engine.

These tests do not establish production trading
readiness or statistical significance.

GitHub Actions verification for Phase 4.4
remains pending.

See [Phase 4.4 risk reporting](phase4-risk-reporting.md).

## Phase 5.2 — Frontend Integration Verification

The latest local frontend verification passed:

| Check | Result |
|---|---|
| Vitest | 67 tests passed |
| TypeScript | Passed |
| ESLint | Passed |
| Vite production build | Passed |
| Git whitespace validation | Passed |

### New regression coverage

- Strict daily OHLCV CSV parsing.
- Research-session initialization and dataset metadata.
- Instrument symbol and exchange validation.
- Instrument editor interactions.
- Dataset persistence across workspace navigation.
- Instrument metadata persistence and replacement.
- Preservation of valid data after invalid uploads.
- Prevention of unrelated synthetic backtest results.

Application integration tests use React Testing Library
and jsdom. Financial chart components are mocked in
application tests; those tests do not establish visual
chart correctness.

The latest established C++ baseline is 27 CTest
suites from Phase 4.4. Run both Debug and Release
suites again during release verification.

GitHub Actions verification for Phase 5.2 remains
pending until the release is pushed.

See [Phase 5.2 engineering documentation](
phase5-integrated-workspace.md).

## Phase 5.3 — Verification

Latest reported local results:

| Check | Result |
|---|---|
| Vitest | 157/157 passed |
| Frontend TypeScript | Passed |
| Backend TypeScript | Passed |
| ESLint | Passed |
| Production build | Passed |
| Whitespace | Passed |

The suite covers empty initial sessions,
explicit Demo Mode, source switching,
session isolation, delayed responses,
manual data validation, and provider adapters.

C++ release verification and new GitHub Actions
results remain pending.

See [Phase 5.3 documentation](
phase5-data-first-workspace.md).
