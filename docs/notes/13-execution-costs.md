# 13 — Execution Costs and Trading Realism

## What Are Execution Costs?

Execution costs reduce the money available to a strategy.

Two costs currently modeled by Atlas are:

1. Commission — a fee charged for executing a trade.
2. Slippage — the difference between the reference price
   and the simulated execution price.

## Commission

Atlas supports a fixed commission per executed fill.

Example:

Starting cash: $1,000

Commission: $5

Reference buy price: $100

Available purchase budget:

$1,000 - $5 = $995

Without slippage, the simulator can buy 9.95 shares.

## Slippage

Slippage represents an unfavorable execution price.

One basis point equals 0.01%.

Ten basis points equals 0.10%.

For a $100 opening price:

- BUY price with 10 bps slippage: $100.10
- SELL price with 10 bps slippage: $99.90

Atlas applies adverse slippage in both directions.

## Why Costs Affect Profitability

A strategy can appear profitable before trading costs
but become unprofitable after commissions and slippage.

Costs also affect how many shares can be purchased.

Therefore, the difference between zero-cost and
cost-aware final equity is not necessarily equal
to the sum of recorded execution costs.

## Portfolio Equity

Portfolio equity is:

Cash + shares multiplied by current closing price.

The simulator updates cash and shares when an
eligible trade is executed.

## Next-Bar Execution

A strategy generates a signal using historical data.

The signal becomes eligible for execution at the
following bar's opening price.

This helps avoid assuming that a strategy can execute
at a closing price it has only just observed.

It does not eliminate every possible source of
look-ahead bias.

## Current Project Implementation

Relevant files:

- `include/atlas/portfolio_simulator.hpp`
- `src/portfolio_simulator.cpp`
- `src/portfolio_json_exporter.cpp`
- `tests/test_execution_costs.cpp`
- `tests/test_portfolio_json_v2.cpp`
- `scripts/verify_portfolio_json_v2.py`

The frontend displays execution costs when it
receives validated schema v2 portfolio data.

## Important Limitations

Atlas currently uses:

- Synthetic demonstration data.
- Fixed commissions.
- Fixed adverse slippage.
- Fractional shares.
- Long-only execution.
- Floating-point financial arithmetic.

It does not model order books, partial fills,
market impact, or real exchange execution.

## Interview Practice

1. What is the difference between commission and slippage?
2. Why must commission be reserved before buying shares?
3. What does one basis point represent?
4. Why can trading costs change final equity by an amount
   different from the total recorded execution costs?
5. Why do we execute signals at the next bar's opening price?
6. How does Atlas validate cost-aware JSON?
7. What additional features would improve execution realism?

## Further Learning

- C++ reference: https://en.cppreference.com/
- Investopedia: https://www.investopedia.com/
- QuantStart: https://www.quantstart.com/
