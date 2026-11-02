# 23 — Market Intelligence Analytics

## Objective

Understand how Project Atlas calculates historical
financial statistics from validated daily OHLCV data.

## Key Concepts

### Price Return

Price return measures the change in closing price:

Return = (Final Close / Initial Close - 1) * 100

It excludes dividends unless prices are adjusted
to incorporate them.

### Historical Volatility

Daily simple returns are calculated from consecutive
closing prices.

Annualized volatility uses sample standard deviation
multiplied by the square root of 252.

### Maximum Drawdown

Maximum drawdown measures the largest historical
percentage decline from a previous closing-price peak.

### Simple Moving Average

SMA is the arithmetic mean of the most recent
N closing prices.

### Relative Strength Index

RSI measures relative upward and downward price
movements using Wilder smoothing.

RSI is a descriptive momentum indicator, not a
guaranteed prediction of future price movement.

## Implementation

Frontend:

- src/lib/marketAnalytics.ts
- src/components/MarketIntelligence.tsx

Tests:

- src/lib/marketAnalytics.test.ts
- src/components/MarketIntelligence.test.tsx
- src/App.test.tsx

## Learning Exercises

1. Calculate the return from 100 to 120.
2. Calculate the drawdown from 120 to 90.
3. Explain why volatility requires multiple returns.
4. Explain why RSI can be unavailable for short datasets.
5. Explain the difference between price return and
   total shareholder return.

## Interview Questions

1. Why use sample rather than population deviation?
2. What assumptions are involved in annualization?
3. How should missing observations be handled?
4. Why is deterministic financial analysis testable?
5. Why don't historical indicators prove profitability?
