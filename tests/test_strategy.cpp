#include "atlas/buy_and_hold_strategy.hpp"
#include "atlas/historical_replay.hpp"

#include <iostream>
#include <stdexcept>
#include <vector>

namespace {

void require(bool condition, const char* message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

} // namespace

int main() {
    try {
        const std::vector<atlas::MarketBar> bars{
            {"2026-10-19", 100, 105, 99, 103, 1000},
            {"2026-10-20", 103, 108, 102, 107, 1200},
            {"2026-10-21", 107, 110, 104, 106, 1100}
        };

        atlas::BuyAndHoldStrategy strategy;
        std::vector<atlas::Signal> signals;

        // Replay historical bars through the strategy.
        atlas::HistoricalReplay::run(
            bars,
            [&](const atlas::MarketBar& bar, std::size_t) {
                signals.push_back(strategy.on_bar(bar));
            }
        );

        require(signals.size() == 3,
                "Incorrect signal count");

        require(signals[0] == atlas::Signal::Buy,
                "First signal should be Buy");

        require(signals[1] == atlas::Signal::Hold,
                "Second signal should be Hold");

        require(signals[2] == atlas::Signal::Hold,
                "Third signal should be Hold");

        // Reset must make the strategy reusable.
        strategy.reset();

        require(
            strategy.on_bar(bars[0]) == atlas::Signal::Buy,
            "Reset did not restore initial state"
        );

        std::cout << "Strategy tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Strategy test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
