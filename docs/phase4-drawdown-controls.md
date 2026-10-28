# Project Atlas — Phase 4.3 Drawdown Safeguards

## Status

Implemented and verified locally in Debug and Release.
GitHub Actions verification remains pending.

## Purpose

The drawdown circuit breaker restricts simulated
trading after a portfolio experiences a configured
loss relative to its historical closing-equity peak.

It complements entry allocation, exposure limits,
and statistical risk analytics.

## Configuration

The C++ `ExecutionConfig` includes:

- `max_drawdown_fraction`
- `liquidate_on_drawdown`

`max_drawdown_fraction` accepts finite values
greater than zero and at most 1.0.

A value of 1.0 disables the circuit breaker.

When enabled, the threshold represents a fraction
of the portfolio's historical closing-equity peak.

`liquidate_on_drawdown` defaults to false.

## High-Water Mark

The high-water mark begins at initial capital.

After each historical bar closes, Atlas updates
the peak using the observed closing equity.

Drawdown is calculated as:

    drawdown = (peak_equity - equity) / peak_equity

The circuit breaker activates when the observed
drawdown reaches or exceeds the configured threshold.

## Execution Timing

Strategy signals are generated at bar close and
normally execute at the next bar's opening price.

Drawdown detection occurs after the current
bar's closing equity is calculated.

A breach cannot trigger execution using an
earlier opening price.

If liquidation is enabled, Atlas attempts to
sell the existing position at the next bar's open.

If the breach occurs on the final bar, no later
execution is possible.

## Circuit Breaker Behavior

Once activated, the circuit breaker remains active
for the remainder of the simulation.

Subsequent BUY signals are blocked.

Existing positions remain open when automatic
liquidation is disabled.

Ordinary strategy SELL signals remain permitted.

If automatic liquidation is enabled, the existing
SELL execution logic handles the exit.

## Execution Costs

Forced liquidation uses the same commission and
adverse slippage assumptions as ordinary SELL fills.

Net proceeds are added to existing cash.

If sale proceeds cannot cover commission, the
simulator rejects the fill and preserves the
open position.

Rejected fills do not charge commission.

## Gap Risk

The configured threshold is an activation trigger,
not a guaranteed maximum loss.

A market gap between breach detection and the
next available opening price can increase losses.

## Current Limitations

- Single-asset, long-only simulation.
- Fractional shares.
- No leverage.
- Close-observed drawdown detection.
- No intrabar drawdown monitoring.
- No automatic circuit-breaker reset.
- No guarantee of liquidation.
- No brokerage integration.
- No live execution.
- No circuit-breaker event metadata in JSON v1/v2.
- No interactive drawdown controls in Atlas Terminal.

## Verification

The `drawdown_controls` CTest suite covers:

- Threshold activation.
- Next-bar liquidation timing.
- Optional liquidation.
- Permanent BUY restrictions.
- Final-bar breaches.
- Invalid configuration rejection.
- Commission and slippage accounting.
- Exact and below-threshold behavior.
- Market-gap losses.
- Unaffordable liquidation.
- Ordinary strategy exits after activation.

The Phase 4.3 working tree registers
24 CTest suites.

All 24 passed locally in Debug and Release.

## Related Documentation

- [Risk controls](phase4-risk-controls.md)
- [Risk analytics](risk-analytics.md)
- [Testing](testing.md)
