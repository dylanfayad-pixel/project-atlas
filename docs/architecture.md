# Project Atlas — System Architecture

## Overview

Project Atlas is a C++20 quantitative research and
historical backtesting engine with a React and TypeScript
frontend called Atlas Terminal.

The system separates market-data processing, strategy
evaluation, simulated execution, performance analysis,
serialization, and visualization.

The current website uses static demonstration fixtures.
It does not yet provide a live HTTP backtesting API.

## System Pipeline

```text
Historical OHLCV CSV
        |
        v
CsvReader + MarketBar Validation
        |
        v
HistoricalReplay
        |
        v
Strategy / BacktestRunner
        |
        v
BUY / SELL / HOLD Signals
        |
        v
PortfolioSimulator
        |
        +--> Commission and Slippage
        |
        v
Cash, Shares, Executed Fills, Equity
        |
        v
PerformanceAnalyzer
        |
        v
PortfolioJsonExporter
        |
        v
Versioned JSON (v1 / v2)
        |
        v
React + TypeScript Atlas Terminal
```

The pipeline describes logical processing responsibilities.
The current frontend reads exported fixtures rather than
calling the C++ engine through an HTTP service.

## Market Data Layer

### MarketBar

`include/atlas/market_bar.hpp`

Represents OHLCV observations using double-precision
prices and unsigned volume.

### CsvReader

`src/csv_reader.cpp`

Responsibilities:

- Strict six-column CSV ingestion.
- Numeric conversion using `std::from_chars`.
- Date and chronological validation.
- OHLCV relationship validation.
- LF and CRLF compatibility.
- Diagnostic exceptions.

The reader currently materializes complete datasets
in memory and does not implement streaming ingestion.

## Historical Strategy Evaluation

### HistoricalReplay

Delivers market bars sequentially.

### Strategy Interface

Defines reusable strategy behavior and reset semantics.

Current strategies include:

- Buy-and-Hold.
- SMA crossover.

### BacktestRunner

Coordinates strategy evaluation and produces
historical BUY, SELL, and HOLD signals.

Signals are distinct from executed trades.

## Portfolio Execution

Implementation:

`src/portfolio_simulator.cpp`

The simulator supports:

- Long-only positions.
- Fractional shares.
- No leverage.
- Next-bar opening-price fills.
- Configurable fixed commissions.
- Configurable adverse slippage.
- Cash and position accounting.
- Equity observations.
- Per-fill execution-cost records.

The simulator does not model order books, partial fills,
market impact, latency, or actual exchange execution.

## Financial Metrics

Implementation:

`src/performance_metrics.cpp`

Calculates:

- Net profit.
- Total percentage return.
- Maximum drawdown.

The simulator additionally records:

- Total commission.
- Total slippage cost.

Total recorded execution costs are not necessarily
equal to the difference between cost-aware and
zero-cost final equity.

## JSON Serialization

Implementation:

`src/portfolio_json_exporter.cpp`

Schema v1 preserves the legacy portfolio contract.

Schema v2 adds aggregate and per-fill execution costs.

Both versions are supported by the frontend parser.

See [JSON contract](api.md).

## Atlas Terminal

Technology:

- React
- TypeScript
- Vite
- Recharts
- Vitest
- ESLint

The dashboard displays historical demonstration data,
portfolio metrics, equity curves, simulated fills,
and schema v2 execution costs.

The current frontend is not connected to a live
C++ HTTP backend.

## Testing and Continuous Integration

CMake registers 20 CTest suites.

The tests cover market-data validation, historical
replay, strategy behavior, portfolio accounting,
JSON serialization, and integration.

GitHub Actions builds and tests Debug and Release
configurations on Ubuntu.

Frontend checks include Vitest, TypeScript compilation,
ESLint, and production builds.

See [testing documentation](testing.md).

## Performance Engineering

The repository includes synthetic CSV benchmarks,
capacity-reservation experiments, fixed-size CSV
splitting, and profiling investigations.

Historical measurements and their limitations are
documented in [performance.md](performance.md).

Performance results are workload- and environment-specific.

## Future Architecture

Planned capabilities include:

- Broader portfolio and risk controls.
- Real historical market-data integration.
- Out-of-sample strategy evaluation.
- Additional execution realism.
- Secure backend API.
- Public Atlas Terminal deployment.
- Larger-scale profiling and performance engineering.

## Current Limitations

- Synthetic demonstration data.
- No public HTTP backtesting API.
- No live market feeds or real orders.
- No market-impact or order-book simulation.
- No exact fixed-point monetary accounting.
- No comprehensive corporate-action handling.
- No full fuzz or adversarial testing.
- No demonstrated reliably profitable strategy.

Atlas is educational research software, not a
production brokerage or trading platform.
