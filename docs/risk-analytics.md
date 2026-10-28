# Project Atlas — Risk Analytics

## Status

Phase 4.1 implementation is undergoing release verification.

## Purpose

Risk analytics evaluates the variability and downside
characteristics of simulated portfolio returns.

It complements the existing PerformanceAnalyzer rather
than replacing its net profit, return, or drawdown metrics.

## Implementation

- `include/atlas/risk_analytics.hpp`
- `src/risk_analytics.cpp`
- `tests/test_risk_analytics.cpp`

## Return Sampling

For consecutive closing-equity observations:

r_t = E_t / E_(t-1) - 1

The first observation establishes the baseline.

N equity observations produce N - 1 periodic returns.

Initial capital is validated but is not counted as
an additional completed return period.

The current implementation assumes observations are
equally spaced when calculating annualized metrics.

It does not verify actual calendar spacing.

## Risk Configuration

`periods_per_year` controls annualization.

`risk_free_rate_per_period` is the periodic rate
subtracted when calculating the Sharpe ratio.

`target_return_per_period` is the minimum acceptable
periodic return used for downside deviation and Sortino.

All three settings must be finite.

`periods_per_year` must be positive.

Default annualization is 252 periods per year.

This default must not be interpreted as proof that
the underlying data contains daily trading observations.

## Annualized Volatility

Sample variance uses N - 1 in the denominator.

Annualized volatility:

sample_standard_deviation * sqrt(periods_per_year)

The public metric is expressed as a percentage.

## Sharpe Ratio

Sharpe ratio:

(mean_return - risk_free_rate_per_period)
    / sample_standard_deviation
    * sqrt(periods_per_year)

Sharpe is undefined when sample standard deviation
is zero or fewer than two returns exist.

## Downside Deviation

Downside deviation uses all return observations,
including those above the target.

For each return, the downside shortfall is:

min(0, return - target_return_per_period)

Downside deviation is the square root of the
mean squared shortfall.

The result is annualized using sqrt(periods_per_year)
and expressed as a percentage.

## Sortino Ratio

Sortino ratio:

(mean_return - target_return_per_period)
    / downside_deviation
    * sqrt(periods_per_year)

Sortino is undefined when downside deviation is zero
or fewer than two returns exist.

## Numerical Safety

The implementation uses extended-precision intermediate
calculations for variance and downside risk.

Public metrics remain double-precision values.

Invalid capital, malformed equity observations,
invalid configurations, and unrepresentable results
are rejected explicitly.

## Insufficient Data

The API represents undefined metrics using
`std::optional<double>`.

Undefined values should not be displayed as zero.

## Testing

Run:

    ctest --test-dir build --output-on-failure
    ctest --test-dir build-release --output-on-failure

The risk analytics suite covers:

- Hand-calculated periodic returns.
- Sample volatility.
- Sharpe ratio.
- Downside deviation.
- Sortino ratio.
- Nonzero downside targets.
- Risk-free rate adjustments.
- Flat portfolios.
- Insufficient observations.
- Portfolio depletion.
- Invalid configuration.
- Non-finite observations.
- Extreme numerical inputs.

## Current Limitations

- No calendar-frequency verification.
- No benchmark-relative risk metrics yet.
- No confidence intervals or statistical significance.
- No serial-correlation adjustment to Sharpe.
- No portfolio risk-control policies yet.
- No risk metrics in the frontend JSON contract yet.
- No evidence of reliably profitable strategies.

The current synthetic demonstrations are suitable
for deterministic engineering tests, not for
claims about real-market strategy performance.
