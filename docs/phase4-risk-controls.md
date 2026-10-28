# Project Atlas — Phase 4.2 Risk Controls

## Status

Phase 4.2 entry risk controls are implemented locally.
GitHub release verification remains pending.

## Purpose

Risk controls constrain simulated position entry
before execution.

They complement the Phase 4.1 risk analytics module.

## Execution Configuration

The simulator supports:

- `commission_per_trade`
- `slippage_bps`
- `max_entry_allocation`
- `max_entry_exposure`

All configurations are validated before simulation.

## Entry Allocation

`max_entry_allocation` specifies the maximum fraction
of available cash committed to a BUY.

The allocation budget includes commission.

A zero allocation prevents opening a position.

A default value of 1.0 preserves the original
all-in behavior.

## Entry Exposure

`max_entry_exposure` limits the position's market value
as a fraction of post-trade equity.

The calculation uses the next bar's opening price,
after accounting for commission and adverse slippage.

The simulator calculates the maximum permitted
quantity under both allocation and exposure limits.

The smaller permitted quantity determines the BUY.

## Accounting

A BUY deducts its fill cost and commission from cash.

A SELL adds net proceeds to existing cash.

This is important for partially allocated positions:
uninvested cash must not disappear when selling.

Portfolio equity is calculated as:

    equity = cash + shares * closing_price

Execution costs are aggregated from recorded fills.

## Execution Timing

Signals are generated at a bar close.

Eligible signals execute at the next bar's open.

The final bar cannot generate a later execution.

## Current Limitations

- Single asset.
- Long-only.
- Fractional shares.
- No leverage.
- No automatic rebalancing.
- No continuous exposure enforcement.
- No drawdown-triggered trading restrictions.
- No stop-loss or take-profit execution policy.
- No real brokerage integration.
- No live order execution.

Market appreciation may increase exposure above
the configured entry limit after a position opens.

## Tests

The dedicated regression suites are:

- `position_sizing`
- `exposure_limits`

They verify:

- Configurable allocation percentages.
- Commission-aware entry budgets.
- Slippage-aware entry exposure.
- Residual cash preservation.
- SELL accounting reconciliation.
- Zero allocation and zero exposure.
- Invalid configuration rejection.
- Market-driven exposure changes.
- Extreme slippage boundaries.
- Full allocation behavior.
- Equity and execution-cost reconciliation.

The Phase 4.2 working tree registers 23 CTest suites.

## Research Interpretation

Risk controls do not guarantee profitability.

Limiting entry exposure can reduce capital committed
to a position, but does not eliminate market risk.

Backtest results depend on data quality,
execution assumptions, strategy behavior,
and the market conditions tested.
