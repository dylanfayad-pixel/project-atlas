#pragma once

#include "atlas/historical_replay.hpp"
#include "atlas/strategy.hpp"

#include <cstddef>
#include <string>
#include <vector>

namespace atlas {

// Records a strategy decision for a historical market bar.
// A signal is not an executed trade.
struct SignalEvent {
    std::size_t index;
    std::string timestamp;
    Signal signal;
};

// Coordinates market replay and strategy evaluation.
// Execution and portfolio accounting will be added later.
class BacktestRunner {
public:
    // Resets the strategy, replays bars, and collects decisions.
    // Input must already be validated and chronologically ordered.
    static std::vector<SignalEvent> run(
        const std::vector<MarketBar>& bars,
        Strategy& strategy
    );
};

} // namespace atlas
