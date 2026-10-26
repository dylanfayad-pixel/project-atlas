#include "atlas/sma_crossover_strategy.hpp"

#include <iostream>
#include <stdexcept>
#include <vector>

namespace {

void require(bool condition, const char* message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

// Create a valid synthetic market bar at a given price.
atlas::MarketBar make_bar(double price) {
    return {
        "2026-10-19",
        price,
        price,
        price,
        price,
        1000
    };
}

} // namespace

int main() {
    try {
        atlas::SmaCrossoverStrategy strategy(3, 5);

        // Prices initially decline, then rise, then decline.
        const std::vector<double> prices{
            10, 9, 8, 7, 6,
            7, 8, 9, 10,
            8, 6, 4
        };

        std::vector<atlas::Signal> signals;

        for (double price : prices) {
            signals.push_back(
                strategy.on_bar(make_bar(price))
            );
        }

        require(signals.size() == prices.size(),
                "Incorrect signal count");

        // A crossover above the slow average should buy.
        require(signals[7] == atlas::Signal::Buy,
                "Expected bullish crossover");

        // A later crossover below should sell.
        require(signals[10] == atlas::Signal::Sell,
                "Expected bearish crossover");

        // The bearish crossover happens only once.
        require(
            signals[11] == atlas::Signal::Hold,
            "Duplicate bearish signal generated"
        );

        // Reset should restore initial warm-up behavior.
        strategy.reset();

        require(
            strategy.on_bar(make_bar(10)) ==
                atlas::Signal::Hold,
            "Reset did not clear price history"
        );

        // Invalid moving-average windows must be rejected.
        bool rejected = false;

        try {
            atlas::SmaCrossoverStrategy invalid(5, 3);
        } catch (const std::invalid_argument&) {
            rejected = true;
        }

        require(rejected, "Invalid SMA periods accepted");

        std::cout << "SMA strategy tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "SMA strategy test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
