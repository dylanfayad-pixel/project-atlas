# 11 — Project Atlas Interview Preparation

## Your 30-Second Introduction

"I built Project Atlas, a C++20 quantitative research
and backtesting platform with a React dashboard.

It validates market data, evaluates trading strategies,
simulates simplified next-bar execution, and calculates
portfolio performance metrics.

I implemented automated testing, performance benchmarks,
and JSON integration between the C++ engine and frontend."

## Your 60-Second Explanation

"Project Atlas started as a C++ market-data processing
project and evolved into a historical strategy
evaluation platform.

I designed reusable interfaces for trading strategies,
implemented sequential historical replay, and separated
signal generation from portfolio execution.

The portfolio simulator tracks cash, shares, trades,
and equity, while a separate analytics module calculates
returns and maximum drawdown.

I also built a React and TypeScript dashboard that
displays the exported results.

The project uses CMake, CTest, Vitest, and GitHub Actions
for testing and continuous integration."

## Technical Questions

### Why C++?

C++ provides control over memory, data structures,
and execution performance.

It is useful for learning systems engineering
principles relevant to quantitative development.

### Why Separate Strategies from Execution?

Strategies decide what action to request.

Execution determines when and how a simulated
trade is filled.

Separating them improves modularity and testing.

### What Is Look-Ahead Bias?

Using future information when making a historical
trading decision.

Atlas processes observations sequentially and
uses next-bar opening prices for simulated fills.

### Why Is the SMA Demo Losing Money?

The synthetic dataset is unfavorable to the
SMA crossover strategy.

Its purpose is to verify calculations rather
than demonstrate profitability.

### How Do You Know the Results Are Correct?

Atlas has unit and regression tests, C++ Debug
and Release verification, JSON integration tests,
and frontend validation tests.

These provide evidence for tested behavior,
not proof that every possible input is correct.

### What Would You Improve Next?

More realistic execution costs, stronger accounting
checks, larger historical datasets, out-of-sample
evaluation, and a public backend API.

## Important Interview Advice

Never claim the system executes real trades.

Never claim a profitable strategy has been discovered.

Distinguish implemented functionality from
planned improvements.

Be prepared to explain engineering tradeoffs
and limitations.

## Practice Checklist

- Explain the architecture without notes.
- Describe one important C++ design decision.
- Walk through a BUY and SELL execution.
- Calculate return and drawdown manually.
- Explain the testing strategy.
- Demonstrate the React dashboard.
- Discuss limitations and future improvements.
