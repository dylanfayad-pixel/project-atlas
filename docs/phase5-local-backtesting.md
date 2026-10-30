# Phase 5.5 — Local Historical Backtesting

## Status

Implemented and locally verified.

Public production deployment is not included in this milestone.

## Objective

Allow users to import validated historical OHLCV data,
configure a strategy, execute the existing C++ quantitative
engine, and inspect real simulated results through Atlas
Terminal.

## Architecture

```text
Research Setup
    |
    v
Validated OHLCV Dataset
    |
    v
Backtest Configuration
    |
    v
React Backtest Controller
    |
    v
POST /local-backtest
    |
    v
Vite Development Proxy
    |
    v
Python HTTP Adapter
    |
    v
C++ Backtest CLI
    |
    v
Historical Strategy Evaluation
    |
    v
Portfolio Simulation and Risk Analytics
    |
    v
JSON Response
    |
    v
Runtime Validation
    |
    v
Backtests Results Dashboard
```

## Supported Strategies

- Buy & Hold
- SMA Crossover

## Configurable Parameters

- Starting capital
- Fixed commission per executed fill
- Adverse slippage in basis points
- Fast and slow SMA periods

SMA periods apply to the SMA Crossover strategy.

## Historical Execution

Strategy decisions are generated from historical
observations.

Eligible orders execute using the following bar's
opening price.

Signals and executed fills are distinct events.

The simulator supports fractional shares and simplified
long-only portfolio accounting.

## Local HTTP API

Development endpoint:

POST /local-backtest

Vite forwards this request to:

http://127.0.0.1:8765/backtest

The request contains validated OHLCV observations and
strategy configuration.

The Python adapter validates requests, creates an
isolated temporary CSV, invokes the C++ CLI, and
returns its JSON output.

## Response Contract

The response contains:

- response_version: 1
- signals
- portfolio

The portfolio uses JSON schema version 3.

The response includes equity history, executed fills,
performance metrics, risk statistics, and applicable
risk-control reporting.

## Reproducible Example

A five-observation synthetic Buy & Hold test used:

- Initial capital: $10,000
- Commission: $0
- Slippage: 0 basis points
- Strategy: Buy & Hold

Observed results:

- Final equity: approximately $9,902.91
- Total return: approximately -0.97%
- Executed trades: 1

This is a functional integration example, not evidence
of statistical significance or profitable performance.

## Local Development

From the repository root:

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build --parallel 2
python3 services/backtest/server.py
```

In a separate terminal:

```bash
cd frontend
npm ci
npm run dev
```

The Python service listens on loopback port 8765.

Restart the Python process after editing its source.
Vite does not automatically reload the Python service.

## Verification

```bash
ctest --test-dir build --output-on-failure
python3 services/backtest/test_server.py
cd frontend
npm run test
npx tsc --noEmit -p tsconfig.app.json
npx tsc --noEmit -p tsconfig.api.json
npm run lint
npm run build
```

The most recently reported local frontend suite passed
180 tests.

The previously reported C++ suite passed 28 tests,
and the Python HTTP suite passed 8 tests.

Release verification must be repeated after changes.

## Safety and Limitations

- Local development-only HTTP service.
- No production-hosted C++ execution backend.
- No real brokerage connectivity.
- No live order execution.
- Daily OHLCV observations only.
- Maximum 10,000 bars per HTTP request.
- Maximum 2 MiB request body.
- Five-second C++ execution timeout.
- Simplified next-bar execution assumptions.
- Fractional-share portfolio accounting.
- Floating-point monetary calculations.
- No order-book, market-impact, or partial-fill model.
- No demonstrated profitable trading strategy.
- No guarantee of future profitability.

The current local adapter is not suitable for direct
public internet exposure.

## Future Work

- Improved terminal navigation.
- Guided Demo redesign.
- Explainable BUY/SELL signal visualization.
- Additional strategies.
- Out-of-sample and walk-forward evaluation.
- Risk-aware signal filtering.
- More historical data timeframes.
- Secure production execution architecture.
