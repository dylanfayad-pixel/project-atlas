# 15 — Position Sizing and Exposure

## Why Position Sizing Matters

A trading strategy can identify an entry signal
without specifying how much capital to invest.

Position sizing determines the amount committed.

A smaller position can reduce the portfolio's
sensitivity to price movements.

## Entry Allocation

Entry allocation limits the fraction of available
cash committed to a new position.

Example:

Starting cash: $10,000

Allocation: 25%

Total entry budget: $2,500

Commission: $5

Available purchase value: $2,495

The remaining $7,500 stays in cash.

## Entry Exposure

Exposure measures the fraction of portfolio equity
represented by the market value of a position.

Exposure = Position market value / Portfolio equity

Atlas evaluates entry exposure at the next bar's
opening reference price.

Commission and slippage affect the calculation.

## Allocation vs. Exposure

Allocation limits the initial spending budget.

Exposure limits the position's market value relative
to post-trade equity.

These constraints are related but not identical.

## Changing Exposure

Suppose a position initially represents 25%
of portfolio equity.

If its market price increases while cash remains
unchanged, the exposure percentage can increase.

Atlas does not currently rebalance automatically.

## Cash Accounting

When selling a position, the simulator must add
net proceeds to existing cash.

Replacing the cash balance with sale proceeds
would incorrectly discard uninvested capital.

## Risk Limitations

Position sizing and exposure limits cannot
guarantee profitable trading.

They constrain entry behavior under the
simulator's execution assumptions.

## Source Code

- `include/atlas/portfolio_simulator.hpp`
- `src/portfolio_simulator.cpp`
- `tests/test_position_sizing.cpp`
- `tests/test_exposure_limits.cpp`

## Interview Questions

1. What is position sizing?
2. How does allocation differ from exposure?
3. Why does commission affect available quantity?
4. Why does slippage affect exposure?
5. Why can exposure grow after a position opens?
6. Why must SELL preserve uninvested cash?
7. What is the difference between entry limits
   and continuous risk enforcement?

## Further Reading

- [Risk-controls engineering guide](../phase4-risk-controls.md)
- [Risk analytics](../risk-analytics.md)
