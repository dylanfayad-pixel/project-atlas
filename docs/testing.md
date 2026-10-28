# Project Atlas — Testing and CI

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

GitHub Actions verification for the Phase 3 release
remains pending until the milestone is pushed.
