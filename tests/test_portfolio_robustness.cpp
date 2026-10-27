// Regression tests for invalid portfolio simulation inputs.

#include "atlas/portfolio_simulator.hpp"

#include <cmath>
#include <iostream>
#include <limits>
#include <stdexcept>
#include <vector>

namespace {

void require(bool condition, const char* message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

// Verify that malformed input is rejected before simulation.
template <typename Exception, typename Function>
void expect_failure(Function operation, const char* message) {
    bool rejected = false;

    try {
        operation();
    } catch (const Exception&) {
        rejected = true;
    }

    require(rejected, message);
}

} // namespace

int main() {
    try {
        using atlas::MarketBar;
        using atlas::Signal;
        using atlas::SignalEvent;
        using atlas::PortfolioSimulator;

        const std::vector<MarketBar> valid_bars{
            {"2026-10-19", 10, 10, 10, 10, 1000},
            {"2026-10-20", 10, 10, 10, 10, 1000}
        };

        const std::vector<SignalEvent> valid_signals{
            {0, "2026-10-19", Signal::Buy},
            {1, "2026-10-20", Signal::Hold}
        };

        // Reject a zero opening price.
        auto invalid_price = valid_bars;
        invalid_price[1].open = 0.0;

        expect_failure<std::invalid_argument>(
            [&] {
                (void)PortfolioSimulator::run(
                    invalid_price, valid_signals
                );
            },
            "Zero opening price accepted"
        );

        // Reject non-finite market prices.
        auto invalid_nan = valid_bars;
        invalid_nan[1].close =
            std::numeric_limits<double>::quiet_NaN();

        expect_failure<std::invalid_argument>(
            [&] {
                (void)PortfolioSimulator::run(
                    invalid_nan, valid_signals
                );
            },
            "NaN market price accepted"
        );

        // Reject duplicate timestamps.
        auto duplicate_bars = valid_bars;
        auto duplicate_signals = valid_signals;

        duplicate_bars[1].timestamp = "2026-10-19";
        duplicate_signals[1].timestamp = "2026-10-19";

        expect_failure<std::invalid_argument>(
            [&] {
                (void)PortfolioSimulator::run(
                    duplicate_bars, duplicate_signals
                );
            },
            "Duplicate timestamps accepted"
        );

        // Reject enum values outside the supported signal set.
        auto invalid_signals = valid_signals;
        invalid_signals[0].signal =
            static_cast<Signal>(99);

        expect_failure<std::invalid_argument>(
            [&] {
                (void)PortfolioSimulator::run(
                    valid_bars, invalid_signals
                );
            },
            "Invalid signal accepted"
        );

        // Extremely small prices can cause share calculations
        // to overflow even when the input price is finite.
        auto overflow_bars = valid_bars;
        overflow_bars[1].open =
            std::numeric_limits<double>::min();
        overflow_bars[1].low =
            std::numeric_limits<double>::min();

        expect_failure<std::overflow_error>(
            [&] {
                (void)PortfolioSimulator::run(
                    overflow_bars, valid_signals,
                    10000.0
                );
            },
            "Non-finite share quantity accepted"
        );

        std::cout << "Portfolio robustness tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Portfolio robustness test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
