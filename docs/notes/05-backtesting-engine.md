# 05 — Historical Backtesting Engine

## What Is Backtesting?

Backtesting evaluates a trading strategy using
historical market observations.

It helps researchers study how a strategy would have
behaved under specified simulation assumptions.

## Historical Replay

Atlas processes historical market bars sequentially.

The strategy receives the current bar rather than
the complete future dataset through its callback.

Source: `src/historical_replay.cpp`

## Backtest Runner

The `BacktestRunner` resets a strategy, replays the
market data, and records the resulting signals.

Each signal includes:

- Bar index
- Timestamp
- BUY, SELL, or HOLD decision

## Signal Versus Execution

A BUY signal indicates that a strategy wants to buy.

An executed trade records the simulated purchase.

These are different events.

## Next-Bar Execution

Atlas currently generates a signal after observing
the current bar and executes it at the next bar's open.

Example:

Day 8: BUY signal at the close.

Day 9: BUY execution at the opening price.

This avoids using the same closing price to fill an
order decided using that close.

## Current Execution Assumptions

- Long-only positions.
- Fractional shares.
- No leverage.
- Zero commissions.
- Zero slippage.
- Entire available cash invested on BUY.
- Entire position sold on SELL.
- No automatic liquidation at the final bar.

These assumptions are simplified and not representative
of real-world order execution.

## Look-Ahead Bias

Look-ahead bias occurs when a simulation uses information
that would not have been available at decision time.

Preventing it is essential for credible backtesting.

## Interview Practice

1. What is historical replay?
2. Why reset a strategy before each run?
3. Why separate signals from execution?
4. What is look-ahead bias?
5. Why execute at the next bar's open?
6. What limitations does this execution model have?

## Source Code

- `src/historical_replay.cpp`
- `src/backtest_runner.cpp`
- `src/portfolio_simulator.cpp`
- `tests/test_backtest_runner.cpp`
