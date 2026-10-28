# Project Atlas — Learning Notes

A practical learning guide to the engineering and quantitative
research concepts used throughout Project Atlas.

These notes are written to help explain, maintain, and
demonstrate the project confidently.

## Recommended Reading Order

| Guide | Topic |
|---|---|
| [01 — Overview](01-project-overview.md) | What Atlas does |
| [02 — C++](02-cpp-fundamentals.md) | Core C++ concepts |
| [03 — Market Data](03-market-data.md) | OHLCV and CSV parsing |
| [04 — Strategies](04-trading-strategies.md) | Signals and moving averages |
| [05 — Backtesting](05-backtesting-engine.md) | Historical replay and execution |
| [06 — Portfolio](06-portfolio-accounting.md) | Cash, equity, P&L and drawdown |
| [07 — Frontend](07-frontend-architecture.md) | React and TypeScript |
| [08 — JSON/API](08-json-and-api.md) | Data exchange and future API |
| [09 — Testing](09-testing-and-ci.md) | CTest, Vitest and GitHub Actions |
| [10 — Performance](10-performance-engineering.md) | Profiling and optimization |
| [11 — Interviews](11-interview-preparation.md) | Technical interview preparation |
| [12 — Demo](12-project-demonstration.md) | How to demonstrate Atlas |

| [13 — Execution Costs](13-execution-costs.md) | Commission, slippage and financial realism |

## How to Use These Notes

1. Read the simple explanation first.
2. Examine the referenced source code.
3. Run the relevant demonstration or test.
4. Practice explaining the concept without reading.
5. Review the interview questions.

## Current Project Status

- Phase 0: Complete
- Phase 1: Complete
- Phase 2: Complete
- Phase 3: Complete
- C++: 20 CTest suites passed locally in Debug and Release
- Frontend: 15 Vitest tests passed locally
- GitHub CI verification for this milestone: Pending

## Important Limitations

Atlas is an educational research project. Its current
portfolio simulation uses synthetic data, fractional shares,
next-bar opening-price fills, and configurable commission and adverse slippage.

The current website loads exported demonstration data.
It does not yet submit backtests to a live backend API.

Historical simulation results do not guarantee profitability.
