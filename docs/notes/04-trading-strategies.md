# 04 — Trading Strategies

## What Is a Trading Strategy?

A trading strategy is a set of rules that determines
when to buy, sell, or hold an asset.

Atlas separates strategy decisions from simulated execution.

## Trading Signals

Atlas defines three signals:

- BUY: Request entry into a long position.
- SELL: Request exit from a long position.
- HOLD: Make no new trading decision.

A signal is not an executed order.

## Buy-and-Hold

Buy-and-Hold generates an initial BUY signal and then
continues holding the position.

It provides a useful baseline for strategy comparisons.

## Simple Moving Average

A simple moving average, or SMA, is the arithmetic mean
of recent closing prices.

Formula:

SMA = Sum of the last N closing prices / N

Example:

Prices: 10, 12, 14

Three-period SMA:

(10 + 12 + 14) / 3 = 12

## SMA Crossover

Atlas currently supports a short-period and long-period SMA.

A bullish crossover occurs when the short SMA crosses
above the long SMA.

A bearish crossover occurs when the short SMA crosses
below the long SMA.

The current demonstration uses periods of 3 and 5.

## Why Strategies Can Lose Money

Moving averages are lagging indicators.

A strategy may enter after a price increase and exit
after a decline.

Atlas's 12-day synthetic example loses money under
the current execution assumptions.

This demonstrates strategy behavior, not profitability.

## Avoiding Overfitting

Overfitting occurs when strategy parameters are selected
to perform well on historical data but fail on unseen data.

Reliable research requires separate development and
out-of-sample evaluation periods.

## Interview Practice

1. What is a trading signal?
2. What is an SMA?
3. Why do moving averages lag?
4. What is overfitting?
5. Why compare strategies against Buy-and-Hold?

## Source Code

- `include/atlas/strategy.hpp`
- `include/atlas/buy_and_hold_strategy.hpp`
- `include/atlas/sma_crossover_strategy.hpp`
- `tests/test_sma_strategy.cpp`
