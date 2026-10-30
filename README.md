# Project Atlas

**C++20 quantitative research and backtesting engine with a React and TypeScript dashboard.**

Project Atlas is an educational systems-engineering project for validating market data, evaluating historical strategies, simulating simplified portfolio execution, and analyzing performance. The repository contains a C++ computation engine and a browser-based Atlas Terminal interface.

> **Research disclaimer:** Atlas is not a production trading system. Demonstration results use synthetic data and simplified execution assumptions. Historical results do not guarantee future profitability.

## Status

| Phase | Status | Capability |
|---|---|---|
| Phase 0 — Foundation | Complete | C++20, CMake, Git, CI |
| Phase 1 — Market data | Complete | CSV ingestion and validation |
| Phase 2 — Historical research | Complete | Strategies, replay, portfolio simulation |
| Phase 3 — Execution realism | Complete | Commission and slippage modeling |
| Phase 4 — Portfolio and risk | Complete | Risk metrics, controls, JSON v3 |
| Phase 5 — Research terminal | In progress | Local backtesting, data import, dashboard |
| Phase 6 — Public release | Planned | Secure hosted execution and deployment |

## Current Atlas Terminal Status — Phase 5.6

Phase 5.5 local historical backtesting is complete.

Phase 5.6 adds containerized backend infrastructure,
a same-origin API gateway, production authentication,
and deployment preparation.

These capabilities are verified locally. Public
production execution remains pending.

See [Phase 5.6 production infrastructure](
docs/phase5-production-infrastructure.md).


Atlas Terminal now supports local historical backtesting
through the existing C++ quantitative engine.

### Implemented locally

- Daily OHLCV CSV uploads and manual entry.
- Validated research datasets and instrument metadata.
- Interactive candlestick and volume charts.
- Buy & Hold and SMA Crossover strategies.
- Editable capital, commission, slippage, and SMA settings.
- Automatic navigation to Backtests after execution.
- Python HTTP adapter and C++ backtesting CLI.
- Actual historical signals, simulated fills, and equity curves.
- Portfolio returns, drawdowns, and risk analytics.
- Dataset-bound result isolation and request cancellation.
- Explicit separation of synthetic Demo Mode.

### Latest local verification

- 28 CTest suites passed.
- 15 Python HTTP integration tests passed.
- 195 standard frontend Vitest tests passed.
- Frontend and API TypeScript passed.
- ESLint passed.
- Production frontend build passed.
- Real authenticated gateway-to-Docker-to-C++ integration verified locally.

These are local verification results. GitHub Actions
must be checked after publishing the release.

### Public deployment

Public preview:

https://project-atlas-two-rho.vercel.app

The local Python/C++ backtesting service is not yet
deployed as a production backend.

The hosted preview must not be described as supporting
the local backtesting workflow until independently
verified.

The historical market-data provider remains
unconfigured in production.

### Research limitations

Atlas is an educational quantitative research platform.

Backtests use simplified execution assumptions and
do not guarantee profitable trading decisions.

Five-bar examples are integration smoke tests, not
statistically meaningful strategy evaluations.

See [Phase 5.5 engineering documentation](
docs/phase5-local-backtesting.md).

## Features

### Market data
- C++20 OHLCV data model.
- Strict six-column CSV ingestion using `std::from_chars`.
- Price, numeric, date, and chronology validation.
- LF and CRLF handling.
- CSV capacity and fixed-size field-splitting experiments.

### Strategy research
- Sequential historical market replay.
- Reusable strategy interface.
- Buy-and-Hold and simple moving-average crossover strategies.
- BUY, SELL, and HOLD signals.
- Next-bar portfolio simulation.
- Cash, shares, trades, and equity observations.
- Net profit, total return, and maximum drawdown calculations.
- Strategy comparison demonstration.
- CSV signal and JSON portfolio export.

### Atlas Terminal
- React and TypeScript dashboard.
- Market-data visualization and signal history.
- Portfolio metric cards, equity curve, and simulated trade table.
- Runtime validation of portfolio JSON.
- Lazy-loaded charts to reduce the initial JavaScript bundle.

Atlas Terminal supports browser-local daily OHLCV CSV imports alongside static synthetic demonstration fixtures. Uploaded data can be submitted to the C++ engine through the local development HTTP adapter. A production-hosted backtesting API has not yet been deployed.

### Execution realism — Phase 3

- Configurable fixed commission per executed fill.
- Configurable adverse slippage in basis points.
- Commission-aware position sizing and cash accounting.
- Per-fill and aggregate execution-cost reporting.
- Versioned portfolio JSON schemas v1 and v2.
- Validated execution-cost analytics in Atlas Terminal.
- C++ to JSON v2 integration verification.
- Synthetic cost-aware demonstration using $5 per fill and 10 bps slippage.

The execution model remains simplified. It does not model order
books, partial fills, market impact, exchange fees, or real orders.

See [Phase 3 engineering notes](docs/phase3-execution.md).

### Risk analytics — Phase 4

The C++ risk analytics module currently calculates:

- Periodic returns from consecutive closing-equity observations.
- Annualized sample volatility.
- Sharpe ratio.
- Annualized downside deviation.
- Sortino ratio.

Risk configuration supports explicit periods per year,
periodic risk-free rates, and periodic downside targets.

Undefined ratios are represented with `std::optional`.

The Phase 4.1 risk analytics module is implemented and verified.
These metrics are exported through JSON v3 and displayed
in Atlas Terminal using synthetic demonstration data.

Annualization assumes equally spaced observations.
Synthetic demonstration timestamps do not establish
real-market annualized performance.

See [risk analytics engineering](docs/risk-analytics.md).

### Entry risk controls — Phase 4.2

The C++ portfolio simulator now supports:

- Configurable maximum entry allocation.
- Configurable maximum entry exposure.
- Commission-aware entry budgets.
- Slippage-aware exposure calculations.
- Preservation of uninvested cash after SELL.
- Explicit validation of invalid risk configurations.

Both entry limits default to 100%, preserving the
original all-in execution behavior.

Entry exposure is measured using post-trade equity
at the next bar's opening reference price.

The simulator does not automatically rebalance
positions when market movement increases exposure.

These controls are implemented in C++ but are not
yet configurable through Atlas Terminal.

See [Phase 4.2 risk controls](docs/phase4-risk-controls.md).

### Drawdown safeguards — Phase 4.3

The C++ simulator supports a configurable, close-observed
drawdown circuit breaker.

- Tracks the historical closing-equity high-water mark.
- Blocks subsequent BUY signals after a threshold breach.
- Optionally attempts liquidation at the next bar's open.
- Preserves ordinary strategy SELL execution.
- Applies existing commissions and adverse slippage.
- Remains latched for the rest of the simulation.

The default threshold of 1.0 disables the safeguard.

Market gaps and rejected liquidation attempts can cause
losses beyond the configured threshold.

JSON v3 exports risk-control events for Atlas Terminal.
Legacy JSON v1/v2 contracts remain unchanged.

See [Phase 4.3 drawdown controls](docs/phase4-drawdown-controls.md).

## Architecture

```text
OHLCV CSV
   |
   v
CSV Reader + Validation
   |
   v
Historical Replay
   |
   v
Strategy Interface
   |
   v
BUY / SELL / HOLD Signals
   |
   v
Portfolio Simulator
   |
   v
Performance Metrics
   |
   v
JSON Exporter
   |
   v
Static JSON Fixture
   |
   v
React + TypeScript Dashboard
```

## Repository Map

```text
include/atlas/       Public C++ interfaces
src/                 C++ implementations and demonstrations
tests/               CTest regression suites
benchmarks/          CSV and performance experiments
scripts/             Reproducible verification utilities
data/                Synthetic sample market data
frontend/            React + TypeScript Atlas Terminal
docs/                Engineering documentation
docs/notes/          Learning and interview preparation
.github/workflows/   GitHub Actions CI
```

## Requirements

- CMake 3.20 or newer.
- A C++20 compiler.
- Python 3 for portfolio JSON integration verification.
- Node.js and npm for the frontend.

## Build and Test the C++ Engine

From the repository root:

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build --parallel 2
ctest --test-dir build --output-on-failure

cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
cmake --build build-release --parallel 2
ctest --test-dir build-release --output-on-failure
```

Run the demonstrations:

```bash
./build-release/atlas_backtest_demo
./build-release/atlas_portfolio_demo
./build-release/atlas_strategy_comparison
```

Verify the portfolio JSON contract:

```bash
python3 scripts/verify_portfolio_json.py \
  --executable build-release/atlas_portfolio_demo
```

## Run Atlas Terminal

```bash
cd frontend
npm ci
npm run test
npm run lint
npm run build
npm run dev
```

Open the local URL printed by Vite. Start the local Python backtest service separately to execute user-selected strategies. Synthetic Demo Mode remains distinct from real local research.

See [frontend setup](frontend/README.md).

## Testing and CI

The latest reported local baseline is 195 standard frontend Vitest tests, 15 Python HTTP tests, and 28 CTest suites. The authenticated gateway-to-Docker integration test also passed. Debug and Release CTest and the updated GitHub Actions workflow must be verified before the Phase 5.6 release.

The GitHub Actions workflow is configured for C++ Debug, C++ Release, and frontend tests/lint/build. Verify the workflow on GitHub after pushing changes.

See [testing documentation](docs/testing.md).

## Performance

The project contains reproducible CSV ingestion and field-splitting experiments. Their results apply to the recorded synthetic workloads and environment and should not be interpreted as universal production performance.

Frontend lazy loading reduced the reported uncompressed initial JavaScript bundle from 593.43 kB to 236.89 kB. This is a bundle-size result, not a measured page-load-time improvement.

See [performance documentation](docs/performance.md).

## Learning Notes

The [Project Atlas learning guide](docs/notes/README.md) contains 17 numbered topic guides covering project architecture, C++, market data, strategies, backtesting, accounting, frontend development, JSON integration, testing, performance, interviews, and project demonstrations.

## Engineering Documentation

- [Architecture](docs/architecture.md)
- [Development setup](docs/development.md)
- [Testing and CI](docs/testing.md)
- [Performance and benchmarks](docs/performance.md)
- [Portfolio JSON schema and API boundary](docs/api.md)

## Current Limitations

- The frontend supports local historical backtesting through a Python/C++ adapter. The public deployment does not yet provide this execution service.
- Data and strategy demonstrations are educational and use synthetic input.
- Execution uses simplified next-bar fills, fractional shares, configurable fixed commissions, and adverse slippage. Order-book liquidity and market impact are not modeled.
- The simulator is not a production brokerage or order-routing system.
- Financial calculations use floating-point values; they are not exact decimal monetary accounting.
- There is no claim of an independently validated profitable strategy.
- Corporate actions, comprehensive trading calendars, resource isolation, and full fuzz testing remain outside the current implementation.

## Roadmap

1. Phase 2 completed: historical replay, strategy evaluation, portfolio simulation, JSON integration, frontend, documentation, and CI verification.
2. Improve execution modeling and financial realism.
3. Expand portfolio and risk analysis.
4. Perform larger-scale research and performance engineering.
5. Implement and secure a backend API.
6. Deploy a public, documented, reproducible Atlas Terminal.

## Disclaimer

Educational engineering and quantitative research software only. Not investment advice, a trading signal service, or a production trading system.

## Phase 4.4 — Risk Reporting and Dashboard

Phase 4.4 integrates quantitative risk reporting with
the Atlas Terminal frontend.

Implemented capabilities:

- Versioned JSON schema v3.
- Quantitative risk metrics and sampling configuration.
- Historical portfolio exposure observations.
- Drawdown breach and liquidation event reporting.
- C++ exporter event-to-trade reconciliation.
- Python integration verification.
- TypeScript runtime schema validation.
- Risk analytics cards and exposure visualization.
- Risk-control event history.

The active dashboard portfolio fixture is generated
by the C++ engine and contains synthetic data.

The browser does not execute C++ directly.

Local Phase 4.4 verification passed 27 CTest suites
in Debug and Release and 28 frontend Vitest tests.

GitHub Actions verification for this milestone is pending.

See [Phase 4.4 risk reporting](docs/phase4-risk-reporting.md).
