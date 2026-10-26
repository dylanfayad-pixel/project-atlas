#pragma once

#include "atlas/market_bar.hpp"

#include <cstddef>
#include <functional>
#include <vector>

namespace atlas {

// Delivers historical market bars sequentially to a consumer.
// The caller must supply validated, chronologically ordered data.
class HistoricalReplay {
public:
    // Receives the current bar and its zero-based position.
    // Only the current bar is provided through this API.
    using Callback = std::function<void(
        const MarketBar&,
        std::size_t
    )>;

    // Invokes the callback once per bar, in input order.
    // Empty input is valid; an empty callback is rejected.
    static void run(
        const std::vector<MarketBar>& bars,
        const Callback& callback
    );
};

} // namespace atlas
