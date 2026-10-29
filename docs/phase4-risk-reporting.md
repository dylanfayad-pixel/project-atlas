# Project Atlas — Phase 4.4 Risk Reporting

## Status

Phase 4.4 is implemented and verified locally.

GitHub Actions verification for this milestone is pending.

## Overview

Phase 4.4 extends Project Atlas with versioned risk
reporting and Atlas Terminal visualization.

The system remains a historical research simulator.
It does not execute live trades.

## Architecture

The reporting pipeline is:

1. C++ portfolio simulation.
2. Portfolio risk-control event recording.
3. Quantitative risk analysis.
4. JSON v3 serialization.
5. Python JSON integration verification.
6. TypeScript runtime validation.
7. React dashboard visualization.

The browser loads a previously generated JSON fixture.
It does not invoke the C++ engine through an HTTP API.

## JSON Schema Compatibility

Schema v1 preserves legacy portfolio results.

Schema v2 adds per-fill and aggregate execution costs.

Schema v3 retains the v2 cost fields and adds:

- risk_metrics
- exposure
- risk_controls

The C++ exporter and TypeScript parser retain support
for schemas v1, v2, and v3.

## Quantitative Risk Metrics

The risk reporting contract includes:

- Return observation count.
- Periods per year.
- Periodic risk-free rate.
- Periodic downside target.
- Annualized volatility.
- Sharpe ratio.
- Annualized downside deviation.
- Sortino ratio.

Undefined statistics are represented as JSON null.

Annualization assumes equally spaced observations.
Synthetic timestamps do not establish real-market
annualized performance.

## Portfolio Exposure

Exposure observations contain:

- Historical bar index.
- Timestamp.
- Position exposure fraction.

Maximum observed exposure is reported separately.

Entry exposure limits apply when a BUY executes.
They do not automatically rebalance positions after
market prices change.

## Risk-Control Events

The simulator records:

- DRAWDOWN_BREACH
- LIQUIDATION_EXECUTED
- LIQUIDATION_REJECTED

A drawdown breach is observed at bar close.

Optional liquidation is attempted no earlier than
the following bar's opening price.

An executed liquidation must correspond to a
recorded SELL fill.

A rejected liquidation does not represent an
executed SELL fill.

The circuit breaker remains latched after activation.

## Validation

The C++ exporter validates the supported JSON
contract and selected financial relationships.

The Python integration test executes the C++
JSON v3 generator and validates the resulting JSON.

The TypeScript parser validates schema structure,
financial values, exposure observations, and
risk-event consistency before rendering.

These checks do not establish complete execution
provenance or production trading correctness.

## Reproducible Verification

From the repository root:

```bash
cmake --build build --parallel 2
ctest --test-dir build --output-on-failure

cmake --build build-release --parallel 2
ctest --test-dir build-release --output-on-failure

cd frontend
npx tsc --noEmit -p tsconfig.app.json
npm run test
npm run lint
npm run build
```

During Phase 4.4 release preparation:

- 27 CTest suites passed in Debug.
- 27 CTest suites passed in Release.
- 28 frontend Vitest tests passed.
- TypeScript, ESLint, and production build passed.

## Limitations

- Synthetic demonstration data.
- Simplified next-bar execution.
- No live market feed.
- No brokerage connectivity.
- No public HTTP backtesting API.
- No order-book or market-impact model.
- No continuous exposure rebalancing.
- No automatic circuit-breaker reset.
- Market gaps can exceed drawdown thresholds.
- Short samples can produce unstable annualized
  volatility, Sharpe, and Sortino estimates.

Phase 4.4 is a research reporting milestone,
not a production trading certification.
