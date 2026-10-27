# 02 — C++ Fundamentals in Project Atlas

## What Is C++?

C++ is a compiled programming language that provides
fine-grained control over memory, performance, and data structures.

Atlas uses C++20 for its quantitative computation engine.

## Important Concepts

### Structures

A struct groups related information.

Atlas uses `MarketBar` to store OHLCV market data.

Source: `include/atlas/market_bar.hpp`

```cpp
struct MarketBar {
    std::string timestamp;
    double open;
    double high;
    double low;
    double close;
    std::uint64_t volume;
};
```

### Classes

Classes group data and behavior into reusable components.

For example, `PortfolioSimulator` provides a static `run()`
method for simulating portfolio activity.

### Vectors

`std::vector` stores a dynamically sized sequence of elements.

Atlas uses vectors to store market bars, signals,
executed trades, and equity observations.

### References

A reference lets a function access an existing object.

`const std::vector<MarketBar>&` avoids copying the entire
dataset and prevents modification through that reference.

### Virtual Functions

Virtual functions allow different strategy implementations
to share a common interface.

Atlas uses the `Strategy` base class so the backtest runner
can evaluate multiple strategies without knowing their
specific implementations.

### RAII

Resource Acquisition Is Initialization ties resource
ownership to object lifetime.

Atlas uses standard library containers and streams that
manage their resources automatically.

### Exceptions

Exceptions communicate errors that prevent an operation
from completing correctly.

Atlas rejects invalid market data and invalid portfolio
simulation inputs using exceptions.

## Why C++ for Quantitative Development?

C++ is useful when predictable performance, efficient
memory usage, and systems-level control matter.

Atlas uses it to practice these engineering principles.
The project does not yet demonstrate production
low-latency trading performance.

## Interview Practice

1. What is the difference between a struct and a class?
2. Why use a const reference instead of copying a vector?
3. How does virtual dispatch work?
4. What does RAII mean?
5. Why reserve vector capacity?
6. When should a function throw an exception?

## Source Code

- `include/atlas/market_bar.hpp`
- `include/atlas/strategy.hpp`
- `include/atlas/portfolio_simulator.hpp`
- `src/portfolio_simulator.cpp`

## Learning Resources

- https://www.learncpp.com/
- https://en.cppreference.com/
