# 14 — Risk Analytics

## Purpose

Risk analytics helps evaluate the uncertainty and
downside behavior of historical portfolio returns.

A strategy can generate a positive return while
experiencing substantial volatility and drawdowns.

## Periodic Returns

For consecutive closing-equity observations:

Return = Current equity / Previous equity - 1

Example:

Previous equity: $10,000

Current equity: $10,500

Return: 5%

The first equity observation establishes the baseline.

## Volatility

Volatility measures variation in periodic returns.

Atlas uses sample standard deviation and annualizes
it using the square root of periods per year.

Higher volatility means greater return variability,
not necessarily greater downside risk.

## Sharpe Ratio

Sharpe compares average excess return with
the standard deviation of returns.

Sharpe = (Mean return - Risk-free rate)
         / Standard deviation

Atlas annualizes this ratio when the observation
frequency is configured appropriately.

## Downside Deviation

Downside deviation measures returns below a
specified minimum acceptable return.

Atlas uses the full-observation convention,
including periods without downside shortfalls
in the denominator.

## Sortino Ratio

Sortino compares average return above a target
with downside deviation.

Unlike Sharpe, it does not penalize upside
variability through its denominator.

## Why Undefined Metrics Matter

A constant return series has zero sample volatility.

Dividing by zero would make Sharpe undefined.

Similarly, Sortino is undefined when downside
deviation is zero.

Atlas represents undefined statistics using
`std::optional<double>`.

Undefined does not mean zero.

## Important Annualization Assumption

Atlas defaults to 252 periods per year.

This is a common convention for daily equity-market
observations, but the module does not verify
timestamp spacing.

Annualizing synthetic observations does not
establish real-world annualized performance.

## Source Code

- `include/atlas/risk_analytics.hpp`
- `src/risk_analytics.cpp`
- `tests/test_risk_analytics.cpp`

## Interview Practice

1. What does volatility measure?
2. How does Sharpe differ from Sortino?
3. Why use sample standard deviation?
4. What is downside deviation?
5. Why is a zero-volatility Sharpe undefined?
6. What does annualization assume?
7. Why can a profitable strategy still be risky?
8. Why are synthetic results insufficient to
   establish real-world profitability?

## Further Reading

- [Risk engineering documentation](../risk-analytics.md)
- [Portfolio accounting](06-portfolio-accounting.md)
