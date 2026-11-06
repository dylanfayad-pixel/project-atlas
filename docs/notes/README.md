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

| [23 — Market Intelligence Analytics](23-market-intelligence-analytics.md) | Returns, volatility, drawdown, SMA and RSI |

| [24 — Advanced Market Intelligence](24-advanced-market-intelligence.md) | EMA, MACD, market regimes, explainable insights |

| [25 — Multi-Instrument Research](25-multi-instrument-research.md) | Dataset collections, aligned comparisons, screening, and ranking |

## How to Use These Notes

1. Read the simple explanation first.
2. Examine the referenced source code.
3. Run the relevant demonstration or test.
4. Practice explaining the concept without reading.
5. Review the interview questions.

## Current Project Status

**Atlas Intelligence v1.0 release candidate**

- Historical C++20 quantitative engineering foundation retained.
- Five active browser-based research workspaces.
- Validated CSV uploads and manual OHLCV entry.
- Independent multi-instrument research collection.
- Technical indicators, market regimes, and research insights.
- Shared-date comparisons and historical risk analytics.
- Quantitative screening and eligibility-aware rankings.
- 294 frontend tests passed across 35 suites.
- Application and API TypeScript passed.
- ESLint and production frontend build passed.
- Public release verification remains pending.

The active research interface does not require
the historical C++ backtesting service.

See [v1.0 release candidate documentation](
../phase6-release-candidate.md).

---

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

## Atlas Intelligence Release Priorities

The current v1.0 release candidate focuses on:

- Final accessibility and keyboard verification.
- Responsive desktop, tablet, and mobile testing.
- Complete documentation consistency.
- GitHub Actions verification.
- Public deployment and end-to-end acceptance testing.

Future enhancements may include automatic market-data
retrieval, additional financial data sources, and
portfolio concentration analytics. These are not
represented as implemented v1.0 functionality.

Legacy backtesting guides remain available as
historical engineering documentation.

See [Phase 6 engineering documentation](
../phase6-market-intelligence.md).
