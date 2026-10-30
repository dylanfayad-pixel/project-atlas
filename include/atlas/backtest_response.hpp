#pragma once

#include "atlas/backtest_runner.hpp"

#include <string>
#include <vector>

namespace atlas {

// Wraps portfolio JSON v3 with historical strategy decisions.
// Signals are not executed trades.
class BacktestResponse {
public:
    static std::string serialize(
        const std::vector<SignalEvent>& signals,
        const std::string& portfolio_json
    );
};

} // namespace atlas
