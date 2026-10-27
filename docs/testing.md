# Project Atlas — Testing and CI

## Automated Test Suites

Project Atlas currently registers seven CTest suites.

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

The latest reported local verification passed all 17 CTest suites in both Debug and Release. These results must be reverified after changes.

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

The project now registers 12 CTest suites.

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

The existing tests do not establish:

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
