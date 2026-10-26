#include "atlas/backtest_runner.hpp"

namespace atlas {

std::vector<SignalEvent> BacktestRunner::run(
    const std::vector<MarketBar>& bars,
    Strategy& strategy
) {
    // Every run starts with a fresh strategy state.
    strategy.reset();

    std::vector<SignalEvent> events;

    // Avoid repeated reallocations when collecting signals.
    events.reserve(bars.size());

    // Replay one bar at a time; do not pass future bars.
    HistoricalReplay::run(
        bars,
        [&](const MarketBar& bar, std::size_t index) {
            // Evaluate the strategy using the current bar.
            const Signal signal = strategy.on_bar(bar);

            // Store the decision with its timestamp and index.
            events.push_back({
                index,
                bar.timestamp,
                signal
            });
        }
    );

    return events;
}

} // namespace atlas
