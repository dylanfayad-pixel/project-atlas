# Project Atlas — System Architecture

## Phase 5.6 — Current Backtesting Architecture

The current implementation supports authenticated,
containerized historical backtesting locally.

```text
React Atlas Terminal
        |
        v
POST /api/backtest
        |
        v
Node.js API Gateway
        |
        | Service credential
        v
Python HTTP Adapter (Docker)
        |
        v
C++20 Backtesting CLI
        |
        v
Historical Replay and Strategy Evaluation
        |
        v
Portfolio Simulation and Risk Analytics
        |
        v
Versioned Financial JSON
        |
        v
Gateway and Browser Validation
```

Development uses a Vite proxy from `/api/backtest`
to the local Python service.

Production is designed to use Vercel for the gateway
and a managed container host for the backend.

The public backend has not yet been deployed.

The gateway validates successful financial responses.
The Python service validates requests and executes
the existing C++ CLI.

Authentication is required when the backend runs
with `ATLAS_BACKTEST_ENV=production`.

See [Phase 5.6 infrastructure](
phase5-production-infrastructure.md).


## Overview

Project Atlas is a C++20 historical quantitative
research engine with a React and TypeScript frontend.

The system separates market-data validation, historical
strategy evaluation, portfolio execution, risk analytics,
JSON serialization, and visualization.

Phase 5.5 introduces local browser-to-C++ backtesting.

## Historical Phase 5.5 Local Execution Architecture

```text
React Research Setup
    |
    v
Validated Historical OHLCV Dataset
    |
    v
Shared Backtest Controller
    |
    v
POST /local-backtest
    |
    v
Vite Development Proxy
    |
    v
Python HTTP Adapter (127.0.0.1:8765)
    |
    v
C++ Backtest CLI
    |
    v
Historical Replay + Strategy
    |
    v
Portfolio Simulation + Risk Analytics
    |
    v
JSON Response (response_version 1)
    |
    v
TypeScript Runtime Validation
    |
    v
Atlas Backtests Dashboard
```

The local HTTP service is development-only.

It is not a public production backtesting API.

The C++ engine remains responsible for financial
calculations; the Python adapter handles request
validation and process execution.

Signals are distinct from executed simulated trades.

See [Phase 5.5 local backtesting](
phase5-local-backtesting.md).

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

All three versions are supported by the frontend parser.

See [JSON contract](api.md).

## Phase 4 — Risk Analytics

The new `RiskAnalyzer` operates on an existing
`PortfolioResult` without modifying the execution engine.

Implementation:

- `include/atlas/risk_analytics.hpp`
- `src/risk_analytics.cpp`

It computes periodic returns, annualized volatility,
Sharpe ratio, downside deviation, and Sortino ratio.

The first closing-equity observation is the baseline.
Subsequent observations produce periodic returns.

Risk configuration includes annualization frequency,
periodic risk-free rate, and periodic downside target.

Undefined statistics use `std::optional<double>`.

JSON v3 exposes these metrics through the React frontend.

The implementation does not validate calendar spacing
and does not establish real-market profitability.

See [risk analytics](risk-analytics.md).

## Phase 4.2 — Entry Risk Controls

The portfolio simulator now supports configurable
entry allocation and entry exposure limits.

`ExecutionConfig` contains:

- `commission_per_trade`
- `slippage_bps`
- `max_entry_allocation`
- `max_entry_exposure`

The entry allocation limit constrains the amount
of cash committed to a new BUY, including commission.

The entry exposure limit constrains the position's
opening-price market value relative to post-trade
portfolio equity.

The simulator calculates the maximum permitted
quantity under both constraints and selects
the smaller quantity.

SELL execution adds net proceeds to existing cash,
preserving uninvested capital.

These policies apply only when entering a position.

The simulator does not automatically rebalance
positions after market-driven exposure changes.

See [Phase 4.2 risk controls](phase4-risk-controls.md).

## Phase 4.3 — Drawdown Circuit Breaker

The portfolio simulator maintains a closing-equity
high-water mark initialized to starting capital.

Each historical bar follows this sequence:

1. Process eligible previous-close signals at the open.
2. Apply execution costs and entry risk constraints.
3. Mark the portfolio to the current closing price.
4. Update the historical closing-equity peak.
5. Detect and latch any configured drawdown breach.

A breach cannot affect an earlier execution.

After activation, new BUY signals are blocked.
Optional liquidation is attempted at the next open
using the existing cost-aware SELL execution path.

The breaker never automatically resets.

The risk state is currently internal to the simulator.
No drawdown-event history is exported in JSON v1/v2.

See [drawdown controls](phase4-drawdown-controls.md).

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

The frontend connects to the C++ engine through a
local Python HTTP adapter in development.

## Testing and Continuous Integration

The Phase 3 milestone registered 20 CTest suites. The latest reported Phase 5.6 baseline contains 28.

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

## Phase 4.4 — Risk Reporting Architecture

Phase 4.4 extends the historical research pipeline:

```text
PortfolioSimulator
        |
        +--> Executed fills and equity observations
        |
        +--> Drawdown and liquidation events
        |
        v
RiskAnalyzer
        |
        v
PortfolioJsonExporter (schema v3)
        |
        v
Static JSON demonstration fixture
        |
        v
TypeScript runtime validation
        |
        v
Atlas Terminal risk dashboard
```

The dashboard displays quantitative risk metrics,
historical exposure, and risk-control events.

Python independently validates generated JSON v3
during integration testing.

At the Phase 4.4 milestone, the frontend did not invoke the C++ engine through an HTTP API. Phase 5.5 subsequently introduced local HTTP execution.

See [Phase 4.4 risk reporting](phase4-risk-reporting.md).

## Phase 5.2 — Shared Research Session Architecture

Atlas Terminal uses application-level React state to
maintain the active research dataset.

```text
ResearchSetup
    |
    | validated daily OHLCV bars
    v
App.tsx / ResearchSession
    |
    +--> SessionIdentity
    |
    +--> Overview
    |
    +--> Strategies
    |
    +--> Market Data / CandlestickChart
    |
    +--> Backtests
```

InstrumentEditor validates user-provided ticker and
exchange metadata.

SessionIdentity displays the active dataset identity,
historical coverage, timeframe, and provenance.

WorkspaceContent prevents unrelated synthetic
demonstration results from appearing as results
for an uploaded dataset.

The browser can request local C++ backtests through
the Python HTTP adapter.

Session state is not persisted across page reloads.

See [Phase 5.2 engineering documentation](
phase5-integrated-workspace.md).

## Phase 5.3 — Research Session Isolation

Atlas separates three research conditions:

1. No active dataset.
2. Validated market data without backtest results.
3. Explicit synthetic demonstration mode.

App.tsx owns research-session and demo state.

WorkspaceContent renders the selected workspace
according to the active session.

Historical provider interfaces are implemented
separately from browser research state.

The production market-data endpoint remains
unconfigured.

See [Phase 5.3 documentation](
phase5-data-first-workspace.md).
