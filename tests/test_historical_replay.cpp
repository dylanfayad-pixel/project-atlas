#include "atlas/historical_replay.hpp"

#include <cstddef>
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

        std::size_t processed = 0;

        atlas::HistoricalReplay::run(
            bars,
            [&](const atlas::MarketBar& bar,
                std::size_t index) {
                require(index == processed,
                        "Incorrect replay index");

                require(bar.timestamp ==
                            bars[processed].timestamp,
                        "Incorrect replay order");

                ++processed;
            }
        );

        require(processed == bars.size(),
                "Not all bars were replayed");

        std::size_t empty_calls = 0;

        atlas::HistoricalReplay::run(
            {},
            [&](const atlas::MarketBar&, std::size_t) {
                ++empty_calls;
            }
        );

        require(empty_calls == 0,
                "Empty replay invoked callback");

        bool rejected = false;

        try {
            atlas::HistoricalReplay::run(
                bars,
                atlas::HistoricalReplay::Callback{}
            );
        } catch (const std::invalid_argument&) {
            rejected = true;
        }

        require(rejected,
                "Missing callback was accepted");

        std::cout
            << "Historical replay tests passed!\n";

        return 0;
    } catch (const std::exception& error) {
        std::cerr
            << "Historical replay test failed: "
            << error.what() << '\n';
        return 1;
    }
}
