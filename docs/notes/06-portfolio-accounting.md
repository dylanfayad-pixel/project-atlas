# 06 — Portfolio Accounting and Risk

## What Is a Portfolio?

A portfolio represents the cash and financial positions
held by an investor or simulated trading system.

Atlas currently models one long position at a time.

## Starting Capital

Starting capital is the amount of simulated money
available before trading begins.

The current demonstration starts with $10,000.

## Cash

Cash is money not currently invested in the asset.

## Shares

Shares represent the quantity of the asset held.

Atlas currently allows fractional shares.

## Portfolio Equity

Equity is the total current value of the portfolio.

Formula:

Equity = Cash + (Shares x Current Price)

Example:

Cash = $2,000

Shares = 100

Current price = $50

Equity = 2,000 + (100 x 50) = $7,000

## Net Profit

Net Profit = Final Equity - Starting Capital

Atlas demonstration:

$4,000 - $10,000 = -$6,000

## Total Return

Total Return = (Final Equity / Starting Capital - 1) x 100

Atlas demonstration:

(4,000 / 10,000 - 1) x 100 = -60%

## Maximum Drawdown

Maximum drawdown measures the largest percentage decline
from a previous portfolio equity peak.

Example:

Peak equity = $12,000

Later equity = $9,000

Drawdown = (12,000 - 9,000) / 12,000 x 100

Maximum drawdown = 25%

Atlas reports maximum drawdown as a positive percentage.

## Why Risk Matters

A strategy may generate profits while experiencing
large temporary losses.

Return alone does not describe the risk involved.

## Current Limitations

Atlas currently uses `double` for financial values.

This is acceptable for the educational prototype but
does not provide exact decimal monetary accounting.

Fees, slippage, advanced position sizing, and
risk limits are not yet implemented.

## Interview Practice

1. What is portfolio equity?
2. What is the difference between cash and equity?
3. How is total return calculated?
4. What does maximum drawdown measure?
5. Why is `double` imperfect for exact money?
6. Why should risk be evaluated alongside returns?

## Source Code

- `src/portfolio_simulator.cpp`
- `src/performance_metrics.cpp`
- `tests/test_portfolio_simulator.cpp`
- `tests/test_performance_metrics.cpp`
