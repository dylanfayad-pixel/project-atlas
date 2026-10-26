# Project Atlas

**C++20 quantitative trading infrastructure project — Phase 0 and Phase 1 complete; Phase 2 next.**

Project Atlas is an educational, performance-oriented systems engineering project. Its long-term goal is a reproducible historical trading and backtesting platform. **Today it implements market-data ingestion and validation, not a working trading or backtesting engine.** The `atlas` executable currently prints a startup message; the CSV ingestion API is exercised by tests and benchmarks.

## Status

| Phase | Status | Deliverable |
|---|---|---|
| 0 — Foundation | Complete | Linux/C++20/CMake, GitHub, tests and Debug/Release CI |
| 1 — Market data | Complete | Validated OHLCV ingestion, tests, benchmarks; capacity and fixed-size splitter optimizations evaluated; Phase 1 release verification pending |
| 2 — Backtesting | Not started | Strategy replay and simulation |
| 3 — Execution | Not started | Order fills, fees and slippage |
| 4 — Portfolio and risk | Not started | Positions, P&L and risk metrics |
| 5 — Advanced performance | Not started | Profiling and systems optimizations |
| 6 — Portfolio release | Not started | Final polish and demonstrable end-to-end system |

## Implemented features

- `atlas::MarketBar` OHLCV model (`std::string` date, `double` prices, unsigned 64-bit volume).
- Strict six-column CSV reader using `std::from_chars` for numeric conversion.
- Validates positive finite OHLC prices, price relationships, and nonempty timestamps; zero volume is permitted.
- Validates `YYYY-MM-DD` calendar dates including leap days and strictly increasing daily dates (no duplicates).
- Supports LF and CRLF line endings; reports file/row errors via exceptions.
- Reusable static `atlas_core` library, seven CTest suites, Debug/Release GitHub Actions matrix.
- Deterministic sample CSV, reproducible 100,000-row dataset generator, four established benchmark executables plus profiling experiments.

## Architecture

```text
Synthetic or user-provided OHLCV CSV
        |  CsvReader::read(filepath, capacity_hint = 0)
        v
CSV schema and numeric conversion
        v
Date and OHLCV validation + strict chronology
        v
std::vector<atlas::MarketBar>  (in memory)
        |
        +--> tests and standalone benchmarks
        +--> future backtesting engine (not implemented)
```

The `atlas` startup executable does **not** yet accept a CSV path or backtest arguments. See [architecture](docs/architecture.md) for module boundaries and limitations.

## Repository map

```text
.github/workflows/ci.yml        Debug/Release build and tests
include/atlas/                  Public C++ headers
src/main.cpp                    Startup executable
src/csv_reader.cpp              CSV ingestion implementation
tests/                          Seven automated CTest suites
benchmarks/                     Small-file, large-file, capacity and memory benchmarks
scripts/generate_benchmark_data.py  Synthetic 100k-row generator
data/sample_ohlcv.csv           Tracked synthetic five-row fixture
docs/architecture.md            Architecture and boundaries
docs/testing.md                 Test matrix and CI
docs/performance.md             Measured benchmarks and caveats
docs/development.md             Development and reproducibility
```

## Requirements and quick start

Linux (tested in an ARM64 Kali VM); C++20-capable compiler, CMake >= 3.20, Python 3 for generating the large dataset. Git and GitHub CLI are useful for contributors, but not needed to compile.

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build --parallel 2
./build/atlas
ctest --test-dir build --output-on-failure
```

Release:

```bash
cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
cmake --build build-release --parallel 2
ctest --test-dir build-release --output-on-failure
```

Benchmark (run from repository root):

```bash
python3 scripts/generate_benchmark_data.py
./build-release/benchmark_csv
./build-release/benchmark_large_csv
/usr/bin/time -v ./build-release/benchmark_large_csv
```

The generated `data/benchmark_100k.csv` is intentionally ignored by Git. See [development guide](docs/development.md) for reproducibility notes.

## Data contract

Exactly this header is required:

```csv
timestamp,open,high,low,close,volume
2026-10-19,100.00,105.00,99.00,103.00,1250000
```

Rows must have six unquoted fields, valid strictly increasing calendar dates, finite positive prices, coherent OHLC relationships and unsigned integer volume. Errors reject the read; records are returned only on success. The date field represents a daily calendar date, not an exchange session or intraday timestamp.

## Tests and CI

Seven registered CTest suites: `atlas_startup`, `market_bar_validation`, `csv_reader`, `csv_error_handling`, `date_validation`, `csv_chronology`, `csv_column_validation`. GitHub Actions runs builds and tests on Ubuntu 24.04 for both Debug and Release. See [testing details](docs/testing.md). Passing these tests does not imply production readiness.

## Performance snapshot

Historical measurements on ARM64 Kali Linux VM (Release; synthetic inputs):

| Workload | Median time | Median-based throughput |
|---|---:|---:|
| 20,000 repeated reads of five rows | 58.502 ms | 1,709,353 rows/s |
| One 100,000-row file per trial | 24.497 ms | 4,082,107 rows/s |

These are **different workloads**, not an optimization speedup. The large-file process peak RSS was approximately 19–21 MiB in three measured runs. See [performance methodology and results](docs/performance.md); values are historical observations, not guarantees.

## CSV Reader Capacity Optimization

Project Atlas supports optional preallocation of market data
storage through the `capacity_hint` parameter.

### API

```cpp
auto bars = atlas::CsvReader::read(
    "data/benchmark_100k.csv",
    100000
);
```

The default capacity hint is zero, preserving normal
`std::vector` growth and existing caller compatibility.

### Measured Results

A controlled A/B benchmark compared reserved and
unreserved ingestion of the same 100,000-record dataset.

| Metric | Unreserved | Reserved |
|---|---:|---:|
| Median execution time | 24.347 ms | 23.205 ms |
| Median throughput | 4.107M records/s | 4.309M records/s |
| Median peak RSS | 12,648 KiB | 10,000 KiB |

Observed median execution-time reduction: **4.69%**.

Observed median peak RSS reduction: **20.9%**.

Results were measured using a C++20 Release build
inside an ARM64 Kali Linux virtual machine.

The performance improvement is workload-specific.
Peak RSS includes memory used by the entire process.

For full methodology, see [Performance Report](docs/performance.md).

### Reproduce the Benchmark

```bash
python3 scripts/generate_benchmark_data.py

cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
cmake --build build-release --parallel 2

./build-release/benchmark_capacity
```

## Fixed-Size CSV Splitting Optimization

The CSV reader now uses a fixed-size
`std::array<std::string_view, 6>` to represent CSV fields,
replacing a dynamically allocated vector.

This preserves strict six-column parsing and existing
validation behavior.

### Measured End-to-End Results

| Metric | Original vector | Optimized array |
|---|---:|---:|
| Median ingestion time | 23.874 ms | 14.313 ms |
| Median throughput | 4.189M records/s | 6.987M records/s |

The optimized implementation reduced median ingestion
time by **40.05%** in a controlled comparison using
100,000 synthetic records on an ARM64 Kali Linux VM.

### Memory Results

Five separate-process memory comparisons produced:

- Original median peak RSS: 20,932 KiB
- Optimized median peak RSS: 20,256 KiB

The memory results were mixed across individual trials.
We do not claim a reliably established memory improvement.

### Verification

Seven CTest suites pass in both Debug and Release,
including malformed-column and numeric edge-case tests.

See [Performance Report](docs/performance.md) for
methodology and limitations.

## Roadmap checklist

### Phase 0 — Complete
- [x] Linux environment, C++20 compiler and CMake
- [x] Git repository and public GitHub remote
- [x] Initial project structure, README and ignore rules
- [x] Automated startup test and GitHub Actions
- [x] Debug and Release build/test configurations
- [ ] Optional VS Code Remote SSH workflow (postponed; not required for completion)

### Phase 1 — Complete

- [x] Optional CSV reader capacity hint
- [x] Controlled reserved/unreserved timing benchmark
- [x] Separate-process peak memory comparison
- [x] Initial CPU profiling and CSV splitting optimization investigation

- [x] OHLCV data model and validation
- [x] Strict CSV ingestion and diagnostic exceptions
- [x] Calendar validation, duplicate/out-of-order rejection
- [x] LF/CRLF compatibility and regression coverage
- [x] Seven correctness test suites
- [x] Synthetic fixtures and reproducible dataset generator
- [x] Initial small/large-file timing and process memory measurements
- [x] Strengthen numeric and malformed-column regression coverage
- [x] Final Phase 1 verification and documentation review
- [x] Final GitHub Actions Debug and Release verification

### Later phases
- [ ] Phase 2 — Backtesting engine
- [ ] Phase 3 — Execution simulation
- [ ] Phase 4 — Portfolio and risk
- [ ] Phase 5 — Advanced performance engineering
- [ ] Phase 6 — Portfolio release

## Known limitations

No strategy execution, order simulation, portfolio accounting, real-time feeds or exchange connectivity. CSV handling is deliberately narrow: no quoted fields, reordered columns, timezone or intraday timestamps. Entire files are materialized in memory; `double` is unsuitable for exact monetary accounting. No corporate-action handling, trading-calendar validation, streaming, resource limits, or full fuzz/overflow test coverage. Benchmarks use synthetic data in a virtual machine and are not representative of production trading latency. See [architecture](docs/architecture.md).

## Disclaimer

Educational engineering software only; not investment advice, a trading signal service, or a production trading system.
