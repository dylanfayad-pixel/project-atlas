# Phase 6.3 — Advanced Market Intelligence

## Status

Implemented and verified locally. Public deployment
and updated GitHub Actions verification are pending.

## Overview

Phase 6.3 expands Atlas Intelligence with technical
indicators, historical market regime classification,
and deterministic research explanations.

The implementation operates on validated daily OHLCV
observations without executing simulated trades.

## Technical Indicators

### Exponential Moving Average

EMA uses:

alpha = 2 / (period + 1)

EMA[t] = alpha * close[t] + (1 - alpha) * EMA[t-1]

The initial EMA is seeded using the first period's
simple moving average.

Implemented periods:

- EMA 12
- EMA 26

### MACD

MACD = EMA 12 - EMA 26

Signal = EMA 9 of available MACD observations

Histogram = MACD - Signal

The implementation uses a single-pass calculation
with linear time complexity and constant auxiliary
space for the latest indicator values.

The first MACD value requires 26 observations.
The first signal and histogram require 34 observations.

## Market Regime Classification

### Trend

At least 50 daily observations are required.

Bullish:
- Latest close > SMA 20
- SMA 20 > SMA 50

Bearish:
- Latest close < SMA 20
- SMA 20 < SMA 50

Sideways/mixed:
- Neither bullish nor bearish alignment

### Volatility

At least 50 daily observations are required.

- High: annualized historical volatility >= 30%
- Normal: annualized historical volatility < 30%

The 30% threshold is an initial research convention,
not a universally accepted market classification.

## Automated Research Insights

The research insights engine generates deterministic
explanations from calculated historical metrics.

Current insight categories:

- Historical trend
- Historical volatility
- RSI momentum
- Insufficient-data limitations

RSI interpretation uses conventional thresholds:

- RSI >= 70: elevated momentum
- RSI <= 30: depressed momentum
- Otherwise: within conventional range

The system does not use an AI model to generate
these explanations.

## Application Integration

Market Overview:
- Historical market metrics
- Market regime classification
- Automated research insights
- Candlestick chart

Technical Indicators:
- SMA 20 and SMA 50
- RSI 14
- EMA 12 and EMA 26
- MACD, signal, histogram

Risk Intelligence:
- Historical volatility
- Maximum closing-price drawdown
- Historical price return
- Market regime classification

## Verification

Latest reported local results:

- 228 frontend tests passed across 28 suites.
- Application TypeScript passed.
- ESLint passed.
- Production frontend build passed.
- Git whitespace checks passed.

Numerical testing includes comparison of optimized
MACD against a slower reference implementation.

This reference shares the project's EMA convention;
independent third-party numerical validation remains
future work.

## Limitations

- Indicators are historical measurements, not forecasts.
- Trend classification uses fixed moving-average rules.
- Volatility classification uses a fixed 30% threshold.
- Market regimes do not establish trading profitability.
- Price returns may exclude dividends and adjustments.
- Daily volatility assumes 252 trading days annually.
- Drawdown uses closing prices, not intraday lows.
- Missing data and irregular sampling require additional
  validation before broader production use.
- Current calculations operate on one active dataset.
- Screening and multi-instrument comparisons are not
  yet implemented.

## Next Milestones

- Independent numerical reference fixtures.
- Configurable regime thresholds.
- Multi-instrument market screening.
- Comparative analytics and rankings.
- Portfolio-level risk intelligence.
- Improved data provenance and quality reporting.
- Performance benchmarks for large datasets.
- Professional terminal UI refinement.
