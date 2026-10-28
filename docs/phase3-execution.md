# Phase 3 — Realistic Execution Engineering

## Purpose

Phase 3 extends Project Atlas from idealized zero-cost portfolio
simulation to configurable, cost-aware historical execution.

The objective is to measure the effect of execution assumptions
on strategy profitability without claiming real-world fill accuracy.

## Execution model

Signals generated at one bar's close become eligible for
execution at the next bar's opening price.

The simulator currently supports long-only positions, fractional
shares, no leverage, and full-position buys and sells.

### Commission

`commission_per_trade` is a fixed non-negative amount charged
for each successfully executed fill.

A buy reserves commission before calculating its share quantity.

A sell deducts commission from its proceeds.

Unaffordable fills are skipped under the current model.

### Slippage

`slippage_bps` is non-negative adverse price movement.

One basis point equals 0.01%.

For opening price P and slippage s in basis points:

- Buy fill price = P * (1 + s / 10000)
- Sell fill price = P * (1 - s / 10000)

Slippage cost is the executed quantity multiplied by the
adverse difference between the fill price and bar opening price.

### Portfolio accounting

Portfolio equity = cash + shares * current closing price.

Total commission is the sum of commission paid on executed fills.

Total slippage cost is the sum of recorded adverse price differences.

Total execution cost = total commission + total slippage cost.

These cost totals must not be interpreted as the exact difference
between a zero-cost portfolio's final equity and a cost-aware
portfolio's final equity. Costs can change share quantities.

## JSON contracts

Schema v1 preserves the legacy portfolio representation.

Schema v2 adds:

- `total_commission`
- `total_slippage_cost`
- `total_execution_cost`
- `trades[].commission_paid`
- `trades[].slippage_cost`

The frontend validates both schema versions. Execution-cost
analytics are displayed only for schema v2 results.

The current website loads generated demonstration fixtures,
not responses from a live C++ HTTP service.

## Reproduce the demonstration

From the repository root:

```bash
cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
cmake --build build-release --parallel 2
./build-release/atlas_portfolio_demo --cost-demo
```

The cost-aware demonstration writes `atlas_portfolio_v2.json`.

The frontend fixture is:

`frontend/public/data/demo_portfolio_v2.json`

## Automated verification

```bash
ctest --test-dir build-release --output-on-failure

python3 scripts/verify_portfolio_json_v2.py \
  --executable build-release/atlas_portfolio_demo
```

The integration verifier executes the actual C++ demonstration,
parses its JSON, reconciles financial totals, and compares the
generated output with the committed frontend fixture.

## Demonstration results

Synthetic 12-bar SMA crossover, starting with $10,000:

| Metric | Result |
|---|---:|
| Final equity | $3,985.01 |
| Total return | -60.15% |
| Maximum drawdown | 60.15% |
| Total commission | $10.00 |
| Total slippage | $13.98 |
| Total recorded execution cost | $23.98 |

These are rounded presentation values, not exact test fixtures.

## Limitations and future research

- Synthetic demonstration data, not real market history.
- No real orders or broker connectivity.
- No partial fills, order book, market impact, or latency model.
- Fixed commission and slippage assumptions.
- Floating-point financial arithmetic.
- No guarantee of profitable strategies.
- No public user-configurable backtesting API.
- Further adversarial and overflow testing is needed.

Phase 3 implementation was published and verified through
GitHub Actions. Debug, Release, and frontend jobs passed.
This milestone does not establish production trading readiness.
