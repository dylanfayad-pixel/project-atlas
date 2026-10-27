# 12 — Demonstrating Project Atlas

## Demonstration Goal

Show how Project Atlas transforms historical
market data into strategy signals, simulated
portfolio activity, and visual performance results.

## Before the Demonstration

From the repository root:

```bash
cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
cmake --build build-release --parallel 2
ctest --test-dir build-release --output-on-failure
```

Start the frontend:

```bash
cd frontend
npm ci
npm run dev
```

Open the local address printed by Vite.

## Demonstration Script

### 1. Introduce the Project

"Atlas is a C++ quantitative research platform
with a React dashboard for historical strategy analysis."

### 2. Show the Architecture

Explain the flow from market-data validation
to strategy signals, portfolio simulation,
performance metrics, and JSON export.

### 3. Show the Strategy Demonstration

From the repository root:

```bash
./build-release/atlas_backtest_demo
```

Explain the BUY, SELL, and HOLD signals.

### 4. Show the Portfolio Demonstration

```bash
./build-release/atlas_portfolio_demo
```

Explain next-bar execution, cash, shares,
equity, and return.

### 5. Show the Strategy Comparison

```bash
./build-release/atlas_strategy_comparison
```

Explain why comparing against Buy-and-Hold
provides a baseline.

### 6. Show Atlas Terminal

Open the React application.

Demonstrate the navigation, market chart,
Backtests page, equity curve, and trade history.

### 7. Show Testing

```bash
ctest --test-dir build-release --output-on-failure
```

Explain the automated test suites and CI workflow.

## Current Demonstration Results

SMA crossover:

- Starting capital: $10,000
- Final equity: $4,000
- Return: -60%
- Maximum drawdown: 60%

Buy-and-Hold:

- Final equity: approximately $4,444.44
- Return: approximately -55.56%

These results come from a synthetic 12-bar dataset.

## What to Explain About the Website

The current website displays static data exported
by the C++ engine.

It does not yet provide a live backend API
for running arbitrary visitor-selected backtests.

## Closing Explanation

"The project demonstrates how I approach systems
engineering, quantitative modeling, testing,
performance optimization, and full-stack development.

My next goals are realistic execution modeling,
larger historical datasets, and a public API."

## Common Demonstration Mistakes

- Claiming simulated trades are real trades.
- Presenting synthetic results as real-market performance.
- Confusing signals with executed fills.
- Claiming historical returns guarantee future profits.
- Demonstrating untested functionality.
