#include "atlas/historical_replay.hpp"

#include <stdexcept>

namespace atlas {

void HistoricalReplay::run(
    const std::vector<MarketBar>& bars,
    const Callback& callback
) {
    // A missing callback cannot process market events.
    if (!callback) {
        throw std::invalid_argument(
            "Historical replay requires a callback"
        );
    }

    // Deliver each market bar exactly once in input order.
    // The callback can update a strategy's internal state.
    for (std::size_t index = 0; index < bars.size(); ++index) {
        callback(bars[index], index);
    }
}

} // namespace atlas
