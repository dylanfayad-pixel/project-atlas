#pragma once

#include "atlas/market_bar.hpp"

namespace atlas {

// Represents the decision made by a trading strategy.
// These are signals only; they do not execute real orders.
enum class Signal {
    Hold,
    Buy,
    Sell
};

// Base interface for historical trading strategies.
// Each strategy receives one market bar at a time.
class Strategy {
public:
    virtual ~Strategy() = default;

    // Reset internal state before starting a new simulation.
    virtual void reset() = 0;

    // Process the current market bar and return a signal.
    // The interface does not provide future market bars.
    virtual Signal on_bar(const MarketBar& bar) = 0;
};

} // namespace atlas
