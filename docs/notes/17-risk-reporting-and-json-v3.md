# 17 — Risk Reporting and JSON v3

## What We Built

Project Atlas now exports portfolio risk information
through JSON schema v3 and displays it in Atlas Terminal.

## Why Versioned JSON Matters

A versioned schema allows new features without
silently changing existing consumer expectations.

- v1: Original portfolio results.
- v2: Execution costs.
- v3: Risk analytics, exposure, and risk events.

Older consumers can continue using their supported
schema versions.

## Serialization

Serialization converts C++ data structures into
a machine-readable JSON document.

The exporter must reject invalid numerical values
because JSON does not support NaN or infinity.

Undefined quantitative statistics use null.

## Cross-Language Validation

The reporting pipeline crosses three languages:

- C++ generates the simulation results.
- Python independently parses generated JSON.
- TypeScript validates data before browser rendering.

Independent parsing catches problems that may be
missed by tests inspecting only C++ structures.

## Risk Events Versus Trades

A risk event records a decision or outcome.

A trade records an executed fill.

A drawdown breach does not itself execute a trade.

A liquidation rejection must not be represented
as a successful SELL.

## Look-Ahead Bias

The drawdown circuit breaker observes closing equity.

It cannot liquidate at an opening price that occurred
before the breach was detected.

Optional liquidation is attempted at the next open.

## Exposure

Portfolio exposure is the position's market value
divided by total portfolio equity.

An entry exposure limit applies at the BUY fill.

Market movement can subsequently change exposure.

## Quantitative Risk Interpretation

Sharpe and Sortino ratios depend on sampling
frequency and return observations.

Short synthetic samples can produce extreme
annualized statistics.

These values are useful for testing formulas but
not for demonstrating a profitable strategy.

## Interview Questions

1. Why use a versioned JSON contract?
2. How do you preserve backward compatibility?
3. Why should a frontend validate C++ output?
4. What is the difference between an event and a fill?
5. How can a backtest accidentally introduce look-ahead bias?
6. Why can drawdown exceed a configured threshold?
7. Why are annualized ratios unstable with small samples?

## Practice

Run the JSON v3 integration test:

```bash
ctest --test-dir build \
  -R '^portfolio_json_v3_integration$' \
  --output-on-failure
```

Then inspect:

- src/portfolio_json_exporter.cpp
- src/portfolio_simulator.cpp
- frontend/src/lib/portfolioData.ts
- scripts/verify_portfolio_json_v3.py

## Further Reading

See [Phase 4.4 risk reporting](../phase4-risk-reporting.md).
