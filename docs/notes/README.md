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

| [14 — Risk Analytics](14-risk-analytics.md) | Volatility, Sharpe, downside deviation and Sortino |

| [15 — Position Sizing and Exposure](15-position-sizing-and-exposure.md) | Entry allocation, exposure limits and cash accounting |

| [16 — Drawdown Circuit Breakers](16-drawdown-circuit-breakers.md) | High-water marks, trading halts, liquidation and gap risk |

| [17 — Risk Reporting and JSON v3](17-risk-reporting-and-json-v3.md) | Versioned contracts, risk events and frontend validation |

| [18 — Docker](18-docker-and-containerization.md) | Container images, builds and isolation |
| [19 — HTTP Gateways](19-http-services-and-api-gateways.md) | HTTP services, routing and API gateways |
| [20 — Production Security](20-production-security.md) | Authentication, TLS and abuse protection |
| [21 — Cloud Deployment](21-cloud-deployment.md) | Railway, Vercel and production configuration |
| [22 — CI/CD](22-production-ci-cd.md) | Automated verification and release engineering |

## How to Use These Notes

1. Read the simple explanation first.
2. Examine the referenced source code.
3. Run the relevant demonstration or test.
4. Practice explaining the concept without reading.
5. Review the interview questions.

## Current Project Status

- Phases 0–4: Complete.
- Phase 5.5: Local historical backtesting complete.
- Phase 5.6: Production infrastructure in progress.
- C++: 28 CTest suites passed in the latest reported baseline.
- Python HTTP: 15 tests passed.
- Standard frontend: 195 Vitest tests passed.
- Authenticated gateway-to-C++ integration: Passed.
- Production deployment: Pending.
- Updated GitHub Actions verification: Pending.

These are reported local verification results, not
evidence that the public deployment works.

## Important Limitations

Atlas is an educational quantitative research platform.

The C++ engine supports historical strategy evaluation,
simulated portfolio execution, and risk analytics.

Atlas supports local C++ backtesting through a Python
HTTP service and Node.js API gateway.

The public website has not yet been verified against
a deployed production C++ backend.

The current simulator uses simplified next-bar fills,
fractional shares, and floating-point accounting.

No independently validated profitable strategy has
been demonstrated.

Historical backtesting does not guarantee future returns.

## Future Research Roadmap

Planned improvements include:

- Ticker-symbol historical market-data retrieval.
- Additional market-data sources and file formats.
- More trading strategies and configurable parameters.
- Automated strategy comparison and ranking.
- Out-of-sample and walk-forward evaluation.
- Risk-adjusted profitability analysis.
- Explainable historical BUY and SELL markers.
- Professional Atlas Terminal redesign.
- Explicit NO QUALIFYING STRATEGY recommendations.

See the [Phase 5.6 engineering documentation](
../phase5-production-infrastructure.md).
