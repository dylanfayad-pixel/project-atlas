# Project Atlas

**High-Performance Quantitative Trading and Backtesting Engine**

Project Atlas is a C++20 software engineering project focused on
building a modular, testable, and performance-oriented quantitative
trading simulation system.

The project is being developed incrementally, with an emphasis on
correctness, reproducibility, software architecture, and benchmarking.

## Project Status

**Phase 0 — Development Environment and Project Foundation**

Current functionality:
- C++20 application skeleton
- CMake build configuration
- Compiler warnings enabled
- Successful Linux compilation and execution

Trading, backtesting, and risk-management functionality are planned
but have not yet been implemented.

## Planned Architecture

1. Market Data Engine
   - Historical data ingestion
   - Data validation
   - Timestamped market events

2. Strategy Engine
   - Trading signal generation
   - Configurable strategies

3. Execution Simulator
   - Simulated order execution
   - Transaction costs and slippage

4. Portfolio and Risk Engine
   - Position tracking
   - Profit and loss calculations
   - Risk metrics

5. Analytics and Benchmarking
   - Backtesting statistics
   - Execution performance
   - Latency and throughput measurements

## Technology Stack

- C++20
- CMake
- GCC / G++
- Linux
- Git and GitHub

Planned additions include Python, automated testing,
continuous integration, and performance benchmarking.

## Build Instructions

Requirements:
- C++20-compatible compiler
- CMake 3.20 or newer

Configure:

    cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug

Build:

    cmake --build build

Run:

    ./build/atlas

## Engineering Principles

- Correctness before optimization
- Modular and maintainable architecture
- Automated testing
- Reproducible experiments
- Measured performance improvements
- Clear technical documentation

## Development Roadmap

- [x] Phase 0: Initial C++ application and build system
- [ ] Phase 0: Repository documentation and CI
- [ ] Phase 1: Market data processing
- [ ] Phase 2: Backtesting engine
- [ ] Phase 3: Order execution simulation
- [ ] Phase 4: Portfolio and risk analytics
- [ ] Phase 5: Performance optimization
- [ ] Phase 6: Professional release

## Disclaimer

Project Atlas is an educational software engineering project.
It does not provide financial advice or guarantee trading profits.

## Market Data Engine — Phase 1

Project Atlas includes an initial historical OHLCV CSV reader.

### Supported CSV Format

The reader expects this exact column order:

    timestamp,open,high,low,close,volume

Example:

    2026-10-19,100.00,105.00,99.00,103.00,1250000

The included `data/sample_ohlcv.csv` contains five synthetic
market records for deterministic testing.

### Implemented Functionality

- Strict six-column CSV parsing
- Numeric conversion using std::from_chars
- OHLCV price validation
- Rejection of malformed numeric values
- Error reporting with CSV line numbers for invalid records
- Reusable atlas_core static library

### Current Limitations

- Only the exact six-column CSV schema is supported.
- Quoted CSV fields are not supported.
- Timestamps are stored as strings and are not yet calendar-validated.
- Chronological ordering and duplicate timestamps are not yet checked.
- Prices currently use double rather than fixed-point integers.
- The reader loads records into memory rather than streaming them.
- The parser is not yet production-ready.

### Automated Tests

Run:

    cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
    cmake --build build
    ctest --test-dir build --output-on-failure

Current test suites:

1. Application startup
2. Market bar validation
3. Valid CSV loading
4. CSV error handling

Performance benchmarking and additional edge-case testing
are planned.
