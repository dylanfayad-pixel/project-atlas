# 24 — Advanced Market Intelligence

## Learning Objectives

Understand how Project Atlas calculates EMA, MACD,
market regimes, and explainable research insights.

## 1. Exponential Moving Average

An EMA assigns more weight to recent prices.

The smoothing factor is:

alpha = 2 / (N + 1)

The initial value uses an N-period SMA.

Unlike SMA, EMA retains information from earlier
observations through recursive smoothing.

## 2. MACD

MACD compares fast and slow exponential averages.

Standard configuration:

- Fast EMA: 12
- Slow EMA: 26
- Signal EMA: 9

The histogram measures the difference between MACD
and its signal line.

A positive histogram is not proof that prices will rise.

## 3. Computational Complexity

The original MACD implementation repeatedly recalculated
historical EMA prefixes.

The optimized version updates the averages once per
observation.

Complexity:

- Original: O(n^2)
- Optimized: O(n)

The latest-value implementation uses constant auxiliary
space.

## 4. Market Regimes

A market regime is a descriptive classification of
historical conditions.

Atlas currently evaluates:

- Price and moving-average alignment
- Annualized historical volatility
- Data sufficiency

Trend and volatility are classified independently.

## 5. Explainable Research Insights

Atlas generates descriptions from explicit rules
rather than a language model.

Each explanation should correspond to a measurable
condition or insufficient-data limitation.

This improves reproducibility and testability.

## 6. Validation

Unit tests cover:

- EMA initialization
- EMA recursive weighting
- MACD signal availability
- MACD numerical equivalence
- Bullish, bearish, sideways regimes
- High historical volatility
- Insufficient observations
- Research explanation generation
- React dashboard rendering

## 7. Interview Questions

1. Why does EMA react faster than SMA?
2. Why does MACD require a warm-up period?
3. What is the difference between MACD and its histogram?
4. How can MACD be calculated in linear time?
5. Why should trend and volatility be classified separately?
6. Why are deterministic explanations easier to test?
7. What limitations arise from fixed volatility thresholds?
8. Why do historical indicators not establish profitability?

## 8. Further Learning

Suggested topics to study:

- Time-series analysis and exponential smoothing
- Numerical stability in recursive algorithms
- Financial return distributions
- Volatility estimation
- Market regime modeling
- Property-based testing
