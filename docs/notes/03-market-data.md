# 03 — Market Data Engineering

## What Is Market Data?

Market data describes historical or current market activity.

Atlas currently focuses on daily OHLCV records.

## OHLCV Explained

| Field | Meaning |
|---|---|
| Open | Price at the beginning of the period |
| High | Highest price during the period |
| Low | Lowest price during the period |
| Close | Price at the end of the period |
| Volume | Traded quantity during the period |

Example:

```text
2026-10-19,100,105,99,103,1000
```

This represents a market bar with an opening price of
100, a high of 105, a low of 99, a close of 103,
and volume of 1000.

## CSV Parsing

CSV stands for Comma-Separated Values.

Atlas reads a strict six-column CSV format and converts
each row into a `MarketBar`.

Source: `src/csv_reader.cpp`

## Validation

Atlas checks that:

- Prices are positive and finite.
- The high is not below the low.
- The high is at least the open and close.
- The low is at most the open and close.
- Dates are valid calendar dates.
- Daily timestamps are strictly increasing.
- Every row has exactly six fields.

Zero volume is permitted.

## Why Validation Matters

Incorrect data can produce misleading trading signals
and unreliable financial calculations.

A backtesting engine must reject malformed input rather
than silently generate results from it.

## Performance Engineering

Atlas evaluated two important optimizations:

1. Reserving vector capacity before ingestion.
2. Using fixed-size storage for six CSV fields.

Both were measured using controlled synthetic benchmarks.

See `docs/performance.md` for recorded results and limitations.

## Interview Practice

1. What is OHLCV?
2. Why reject NaN and infinity?
3. What is `std::from_chars`?
4. Why require chronological data?
5. What is the difference between parsing and validation?

## Source Code

- `src/csv_reader.cpp`
- `include/atlas/market_bar_validator.hpp`
- `include/atlas/date_validator.hpp`

## Learning Resources

- https://en.cppreference.com/
