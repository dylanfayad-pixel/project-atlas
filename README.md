# Project Atlas

**C++20 quantitative trading infrastructure project — Phase 0 complete; Phase 1 in progress.**

Project Atlas is an educational, performance-oriented systems engineering project. Its long-term goal is a reproducible historical trading and backtesting platform. **Today it implements market-data ingestion and validation, not a working trading or backtesting engine.** The `atlas` executable currently prints a startup message; the CSV ingestion API is exercised by tests and benchmarks.

## Status

| Phase | Status | Deliverable |
|---|---|---|
| 0 — Foundation | Complete | Linux/C++20/CMake, GitHub, tests and Debug/Release CI |
| 1 — Market data | In progress | Validated OHLCV CSV ingestion, tests, benchmarks; optimization pending |
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
- Reusable static `atlas_core` library, six CTest suites, Debug/Release GitHub Actions matrix.
- Deterministic sample CSV, generator for a 100,000-row synthetic dataset, two performance benchmarks.

## Architecture

```text
Synthetic or user-provided OHLCV CSV
        |  CsvReader::read(filepath)
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
tests/                          Six automated CTest suites
benchmarks/                     Small-file and large-file benchmarks
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

Six registered CTest suites: `atlas_startup`, `market_bar_validation`, `csv_reader`, `csv_error_handling`, `date_validation`, `csv_chronology`. GitHub Actions runs builds and tests on Ubuntu 24.04 for both Debug and Release. See [testing details](docs/testing.md). Passing these tests does not imply production readiness.

## Performance snapshot

Historical measurements on ARM64 Kali Linux VM (Release; synthetic inputs):

| Workload | Median time | Median-based throughput |
|---|---:|---:|
| 20,000 repeated reads of five rows | 58.502 ms | 1,709,353 rows/s |
| One 100,000-row file per trial | 24.497 ms | 4,082,107 rows/s |

These are **different workloads**, not an optimization speedup. The large-file process peak RSS was approximately 19–21 MiB in three measured runs. See [performance methodology and results](docs/performance.md); values are historical observations, not guarantees.

## Roadmap checklist

### Phase 0 — Complete
- [x] Linux environment, C++20 compiler and CMake
- [x] Git repository and public GitHub remote
- [x] Initial project structure, README and ignore rules
- [x] Automated startup test and GitHub Actions
- [x] Debug and Release build/test configurations
- [ ] Optional VS Code Remote SSH workflow (postponed; not required for completion)

### Phase 1 — In progress
- [x] OHLCV data model and validation
- [x] Strict CSV ingestion and diagnostic exceptions
- [x] Calendar validation, duplicate/out-of-order rejection
- [x] LF/CRLF compatibility and regression coverage
- [x] Six correctness test suites
- [x] Synthetic fixtures and reproducible dataset generator
- [x] Initial small/large-file timing and process memory measurements
- [ ] Profile and experimentally evaluate allocation/parse optimizations
- [ ] Strengthen edge-case and robustness coverage
- [ ] Final Phase 1 verification and documentation review

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
