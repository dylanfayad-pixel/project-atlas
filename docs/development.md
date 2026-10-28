# Project Atlas — Development Guide

## Environment

Primary development environment:

- Kali Linux ARM64 virtual machine
- GCC 15.2.0
- C++20
- CMake 3.20+
- Python 3 for synthetic dataset generation

Mac Terminal connects to Kali using SSH.
VS Code Remote SSH is optional and not required.

## Build and Test

Debug:

    cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
    cmake --build build --parallel 2
    ctest --test-dir build --output-on-failure

Release:

    cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
    cmake --build build-release --parallel 2
    ctest --test-dir build-release --output-on-failure

## Generate Benchmark Data

Run from the repository root:

    python3 scripts/generate_benchmark_data.py \
        --rows 100000 \
        --output data/benchmark_100k.csv

The generated dataset contains synthetic consecutive
calendar-day records, not real exchange trading sessions.

Generated benchmark data is excluded from Git.

## Performance Benchmarks

Run from the repository root:

    ./build-release/benchmark_csv
    ./build-release/benchmark_large_csv
    ./build-release/benchmark_capacity

Measure peak RSS:

    /usr/bin/time -v ./build-release/benchmark_large_csv

Capacity comparison:

    /usr/bin/time -f "Peak RSS: %M KiB" \
        ./build-release/benchmark_capacity_memory reserved

    /usr/bin/time -f "Peak RSS: %M KiB" \
        ./build-release/benchmark_capacity_memory unreserved

## CPU Profiling

Profiling is optional.

Configure:

    cmake -S . -B build-profile \
        -DCMAKE_BUILD_TYPE=Release \
        -DATLAS_BUILD_PROFILING=ON \
        -DCMAKE_CXX_FLAGS="-pg -g -fno-omit-frame-pointer" \
        -DCMAKE_EXE_LINKER_FLAGS="-pg"

Build:

    cmake --build build-profile --target profile_csv

Run:

    ./build-profile/profile_csv

Generate a GNU gprof report:

    gprof ./build-profile/profile_csv gmon.out

Instrumented profiling results must not be compared
directly against ordinary Release benchmark timings.

## Fixed-Size Splitter Experiment

The original vector splitter was compared with the
fixed-size array implementation using the same
100,000-record synthetic dataset.

The measured median ingestion-time reduction was 40.05%.

See performance.md for detailed methodology and caveats.

## Contribution Checklist

1. Make a controlled source change.
2. Run Debug and Release correctness tests.
3. Measure performance changes against a baseline.
4. Update all affected repository documentation.
5. Check generated files and secrets are excluded.
6. Review staged changes before committing.
7. Push and verify both GitHub Actions jobs.

## Optional CSV Splitting Microbenchmark

The isolated CSV splitting experiment is disabled
by default to keep normal builds focused.

Enable it using:

```bash
cmake -S . -B build-release \
  -DCMAKE_BUILD_TYPE=Release \
  -DATLAS_BUILD_MICROBENCHMARKS=ON

cmake --build build-release --parallel 2

./build-release/benchmark_split
```

The experiment compares dynamic vector field storage
against fixed-size array field storage.

It is a microbenchmark, not a complete CSV ingestion test.

Results should not be interpreted as end-to-end
market-data processing throughput.

---

## Phase 2 — Strategy Signal Demonstration

### Build

From the repository root:

```bash
cmake -S . -B build-release \
  -DCMAKE_BUILD_TYPE=Release

cmake --build build-release --parallel 2
```

### Run the Demonstration

```bash
./build-release/atlas_backtest_demo
```

The demonstration uses 12 synthetic price records.

It evaluates a 3-period and 5-period moving-average
crossover strategy.

Expected signals:

- BUY at index 7 (Day 8)
- SELL at index 10 (Day 11)
- HOLD at all other indices

### Exported Results

The executable writes:

    atlas_signals.csv

Inspect the output:

```bash
cat atlas_signals.csv
```

CSV schema:

    index,timestamp,signal

The generated file is excluded from Git.

### Run the Phase 2 Tests

```bash
ctest --test-dir build-release \
  --output-on-failure
```

### Development Guidelines

Strategies should receive market bars sequentially.

Avoid passing the full historical dataset directly
to strategy implementations when preventing look-ahead
bias is a design goal.

Reset strategy state before each independent run.

Treat trading signals separately from executed orders.

Do not calculate or report financial returns until
execution and portfolio accounting are implemented.

## Atlas Terminal Development

The frontend is located in `frontend/`.

### Install Dependencies

```bash
cd frontend
npm ci
```

### Start the Development Server

```bash
npm run dev
```

Open the local URL printed by Vite.

### Frontend Verification

```bash
npm run test
npm run lint
npm run build
```

### Portfolio Demonstration

From the repository root:

```bash
cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
cmake --build build-release --parallel 2

./build-release/atlas_portfolio_demo
./build-release/atlas_strategy_comparison
```

### JSON Integration Verification

```bash
python3 scripts/verify_portfolio_json.py   --executable build-release/atlas_portfolio_demo
```

The verification script runs the C++ executable in a
temporary directory and checks its generated JSON.

The frontend currently uses a checked-in static
demonstration fixture rather than a live API.

### Development Standards

- Keep C++20 and TypeScript strict checking enabled.
- Add meaningful comments for important logic.
- Add regression tests for behavior changes.
- Run Debug and Release C++ tests.
- Run frontend tests, lint, and production builds.
- Keep documentation synchronized with implementation.
- Avoid committing generated binaries or local datasets.

---

## Phase 3 — Cost-Aware Portfolio Development

Phase 3 extends the original portfolio demonstration
with configurable execution costs.

### Generate Cost-Aware Results

From the repository root:

```bash
./build-release/atlas_portfolio_demo --cost-demo
```

The command generates:

`atlas_portfolio_v2.json`

The frontend uses the versioned fixture:

`frontend/public/data/demo_portfolio_v2.json`

### Verify JSON Integration

```bash
python3 scripts/verify_portfolio_json_v2.py \
  --executable build-release/atlas_portfolio_demo
```

The verifier runs the real C++ demonstration,
parses its JSON output, checks financial invariants,
and compares it with the frontend fixture.

### Run C++ Regression Tests

```bash
ctest --test-dir build --output-on-failure
ctest --test-dir build-release --output-on-failure
```

Phase 3 currently registers 20 CTest suites.

### Run Frontend Checks

```bash
cd frontend
npm run test
npx tsc --noEmit -p tsconfig.app.json
npm run lint
npm run build
```

### Mac Terminal and Kali Development

The project is developed inside Kali Linux running
through VirtualBox on macOS.

The Mac connects to Kali using SSH:

```bash
ssh -p 2222 arisxe@localhost
```

Vite can be started inside Kali using:

```bash
cd ~/projects/project-atlas/frontend
npm run dev -- --host 0.0.0.0
```

If necessary, create an SSH tunnel from a separate
Mac Terminal window:

```bash
ssh -N -L 5173:127.0.0.1:5173 -p 2222 arisxe@localhost
```

Then open `http://127.0.0.1:5173/` on the Mac.

### Engineering Standards

- Keep C++20 and strict TypeScript checking.
- Validate financial arithmetic and JSON contracts.
- Preserve schema v1 compatibility.
- Keep generated root-level JSON files out of Git.
- Commit intentional frontend fixtures.
- Run Debug and Release regression tests.
- Keep learning notes and documentation synchronized.
- Verify GitHub Actions after publishing.

### Important Limitations

The simulator uses synthetic data and simplified
execution assumptions.

The frontend does not yet submit live backtest
requests to the C++ engine.

No real orders are executed.

---

## Phase 4.1 — Risk Analytics Development

The risk analytics module extends Atlas with
return-variability and downside-risk calculations.

Source files:

- `include/atlas/risk_analytics.hpp`
- `src/risk_analytics.cpp`
- `tests/test_risk_analytics.cpp`

The module operates on existing portfolio results.
It does not change execution or accounting behavior.

### Run Risk Analytics Tests

```bash
ctest --test-dir build \
  -R '^risk_analytics$' --output-on-failure

ctest --test-dir build-release \
  -R '^risk_analytics$' --output-on-failure
```

### Run Complete C++ Verification

```bash
ctest --test-dir build --output-on-failure
ctest --test-dir build-release --output-on-failure
```

The completed Phase 4.1 milestone registered 21 CTest suites.

### Statistical Assumptions

- Returns use consecutive closing-equity observations.
- The first observation is the baseline.
- Volatility uses sample standard deviation.
- Downside deviation uses all return observations.
- Annualization assumes equally spaced observations.
- Risk-free and downside target rates are per observation.
- Undefined statistics are represented using `std::optional`.

See [risk analytics](risk-analytics.md).

### Current Integration Boundary

Risk analytics is currently available through C++.

It is not yet exported through the versioned
portfolio JSON contract or displayed by Atlas Terminal.

Do not claim that the website already provides
Sharpe or Sortino analytics.

---

## Phase 4.2 — Entry Risk Controls

The C++ portfolio simulator supports configurable
maximum entry allocation and entry exposure.

Both limits default to 1.0.

### Run Dedicated Tests

```bash
ctest --test-dir build \
  -R 'position_sizing|exposure_limits' \
  --output-on-failure

ctest --test-dir build-release \
  -R 'position_sizing|exposure_limits' \
  --output-on-failure
```

### Run Complete Verification

```bash
ctest --test-dir build --output-on-failure
ctest --test-dir build-release --output-on-failure
```

Phase 4.2 registers 23 CTest suites.

### Execution Policy

- BUY signals execute at the next bar's open.
- Allocation budgets include commission.
- Exposure calculations account for adverse slippage.
- The smaller permitted BUY quantity is selected.
- SELL adds net proceeds to existing cash.
- Market movement does not trigger automatic rebalancing.

### Limitations

These controls are currently C++ configuration options.

They are not yet exposed through Atlas Terminal.

Continuous exposure enforcement, drawdown safeguards,
and live brokerage integration are not implemented.

See [risk controls](phase4-risk-controls.md).
