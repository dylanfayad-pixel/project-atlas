# Project Atlas — Architecture

## Current Scope

Project Atlas currently implements a C++20 historical
market-data ingestion and validation library.

The backtesting engine, execution simulator, portfolio
accounting, and risk engine are future development phases.

The `atlas` executable currently provides a startup check.

## Data Processing Pipeline

Historical OHLCV CSV
    |
    v
CsvReader::read(filepath, capacity_hint)
    |
    v
Strict six-column parsing
    |
    v
Numeric conversion using std::from_chars
    |
    v
Calendar and chronological validation
    |
    v
OHLCV relationship validation
    |
    v
std::vector<MarketBar>

## Core Components

### MarketBar

Defined in `include/atlas/market_bar.hpp`.

Stores a date string, four double-precision OHLC prices,
and unsigned 64-bit volume.

### MarketBar Validator

Defined in `include/atlas/market_bar_validator.hpp`.

Rejects non-finite or nonpositive prices and inconsistent
OHLC relationships. Zero volume is permitted.

### Date Validator

Defined in `include/atlas/date_validator.hpp`.

Uses C++20 calendar types to validate YYYY-MM-DD dates.

This is calendar validation, not exchange-session validation.

### CSV Reader

Defined in `include/atlas/csv_reader.hpp` and
`src/csv_reader.cpp`.

Responsibilities:

- Strict six-column CSV ingestion
- LF and CRLF compatibility
- Numeric conversion
- Calendar validation
- Chronological ordering
- Duplicate timestamp rejection
- OHLCV validation
- Line-numbered diagnostic exceptions

## Performance-Oriented Design

### Fixed-Size CSV Splitting

The parser uses:

    std::array<std::string_view, 6>

This replaces a dynamically allocated vector of field views.

The schema is fixed at six fields, allowing the parser
to avoid a separate dynamic field-buffer allocation
for each row.

### Optional Capacity Reservation

CsvReader::read accepts an optional capacity_hint.

When greater than zero, the reader calls vector::reserve
before appending validated records.

The default remains zero for backward compatibility.

### Performance Evidence

The fixed-size splitter reduced median ingestion time
by 40.05% in the documented 100,000-record experiment.

Capacity reservation reduced median ingestion time
by 4.69% in an earlier experiment.

These are separate experiments and their percentages
must not be added together.

See performance.md for methodology and limitations.

## Build Architecture

- atlas_core: reusable static C++ library
- atlas: startup executable
- CTest: seven automated test suites
- Benchmarks: separate performance executables
- profile_csv: optional profiling workload

Enable profiling with:

    -DATLAS_BUILD_PROFILING=ON

## Current Limitations

- No backtesting or strategy execution
- No order execution simulation
- No portfolio or risk engine
- No streaming CSV ingestion
- No quoted CSV fields
- No intraday timestamps or timezones
- No exchange trading-calendar validation
- No fixed-point monetary representation
- Entire CSV datasets are materialized in memory

## Future Architecture

Market data -> historical event replay -> strategy
signals -> simulated execution -> portfolio and
risk accounting -> analytics.

Future phases must address look-ahead bias, execution
timing, transaction costs, slippage, and reproducibility.
