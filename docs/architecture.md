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

---

## Phase 2 — Historical Strategy Evaluation

### Current Signal Processing Pipeline

```text
Validated OHLCV MarketBar records
              |
              v
       HistoricalReplay
              |
              v
        Strategy::on_bar
              |
       +------+------+
       |             |
       v             v
 BuyAndHold      SMA Crossover
       |             |
       +------+------+
              |
              v
         SignalEvent
              |
              v
        BacktestRunner
              |
              v
        SignalExporter
              |
              v
      atlas_signals.csv
```

The diagram represents logical responsibilities. The
BacktestRunner orchestrates replay and strategy evaluation;
the strategy implementations are alternatives.

### HistoricalReplay

Files:

- `include/atlas/historical_replay.hpp`
- `src/historical_replay.cpp`

Delivers market bars sequentially using a callback.

The caller is responsible for supplying validated,
chronologically ordered market data.

### Strategy Interface

File: `include/atlas/strategy.hpp`

Defines a reusable strategy contract:

- `reset()` restores initial strategy state.
- `on_bar(const MarketBar&)` processes the current bar.
- `Signal` represents Buy, Sell, or Hold.

The interface provides only the current market bar.
However, it cannot prevent a strategy from accessing
future data through unrelated external references.

### Strategy Implementations

`BuyAndHoldStrategy` emits one Buy signal and then Hold.

`SmaCrossoverStrategy` compares rolling fast and slow
simple moving averages.

The first fully populated window establishes the initial
relationship without generating a trade.

Subsequent changes in that relationship generate
Buy or Sell signals.

### BacktestRunner

Files:

- `include/atlas/backtest_runner.hpp`
- `src/backtest_runner.cpp`

Resets the strategy, coordinates replay, and records
one SignalEvent per processed market bar.

Each SignalEvent contains:

- Zero-based market bar index
- Timestamp
- Buy, Sell, or Hold signal

### SignalExporter

Files:

- `include/atlas/signal_exporter.hpp`
- `src/signal_exporter.cpp`

Exports signal events using the CSV schema:

    index,timestamp,signal

The exporter checks file opening and writing errors.

### Demonstration Executable

`atlas_backtest_demo` processes 12 synthetic price records
using a 3/5 SMA crossover strategy.

The demonstration produces one Buy and one Sell signal
and writes `atlas_signals.csv`.

### Current Architectural Boundary

Phase 2 currently evaluates strategies and records
signals. It does not simulate order execution, track
positions, or calculate financial performance.

Those capabilities require explicit execution timing,
transaction-cost assumptions, portfolio accounting,
and additional correctness tests.
