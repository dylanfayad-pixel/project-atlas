# 16 — Drawdown Circuit Breakers

## What Is Drawdown?

Drawdown measures the decline from a portfolio's
historical peak equity.

Example:

Peak equity: $12,000

Current equity: $9,600

Drawdown: 20%

## High-Water Mark

A high-water mark is the highest equity value
observed so far.

Atlas initializes the peak at starting capital.

The peak updates after each bar closes.

## Circuit Breakers

A circuit breaker restricts trading after a
specified risk threshold is reached.

Atlas uses a permanently latched circuit breaker
during each simulation.

Once activated, it blocks future BUY signals.

## Liquidation

Atlas can optionally attempt liquidation after
a drawdown breach.

The execution occurs at the next available
bar's opening price.

The simulator applies its existing commission
and slippage assumptions.

## Look-Ahead Bias

Look-ahead bias occurs when a backtest uses
information that was not yet available.

A drawdown observed at today's close cannot
justify execution at today's opening price.

Atlas avoids this by reacting on later bars.

## Gap Risk

A portfolio may breach a 20% threshold at close
and suffer a larger loss before the next open.

The threshold does not guarantee a maximum loss.

## Rejected Liquidation

A forced SELL may be rejected if gross proceeds
cannot cover commission.

The position remains open and no rejected-fill
commission is charged.

## Current Limitations

- No intrabar drawdown monitoring.
- No automatic breaker reset.
- No guaranteed maximum loss.
- No live order execution.
- No exported circuit-breaker event history.

## Source Code

- `include/atlas/portfolio_simulator.hpp`
- `src/portfolio_simulator.cpp`
- `tests/test_drawdown_controls.cpp`

## Interview Questions

1. What is a portfolio high-water mark?
2. How is drawdown calculated?
3. Why must drawdown detection use past data only?
4. Why does liquidation occur at the next open?
5. Can a circuit breaker guarantee a maximum loss?
6. What happens when liquidation is rejected?
7. How does a permanently latched breaker differ
   from one that automatically resets?

## Further Reading

- [Drawdown engineering guide](../phase4-drawdown-controls.md)
- [Risk analytics](../risk-analytics.md)
