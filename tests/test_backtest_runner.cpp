#include "atlas/backtest_runner.hpp"
#include "atlas/buy_and_hold_strategy.hpp"

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

        // The first run should generate Buy, Hold, Hold.
        const auto first =
            atlas::BacktestRunner::run(bars, strategy);

        require(first.size() == 3, "Incorrect event count");

        require(first[0].signal == atlas::Signal::Buy,
                "Expected Buy on first bar");

        require(first[1].signal == atlas::Signal::Hold,
                "Expected Hold on second bar");

        require(first[2].signal == atlas::Signal::Hold,
                "Expected Hold on third bar");

        // Running again should produce identical decisions.
        const auto second =
            atlas::BacktestRunner::run(bars, strategy);

        require(second.size() == first.size(),
                "Repeated run changed event count");

        for (std::size_t i = 0; i < first.size(); ++i) {
            require(first[i].index == second[i].index,
                    "Replay index changed");

            require(first[i].timestamp == second[i].timestamp,
                    "Replay timestamp changed");

            require(first[i].signal == second[i].signal,
                    "Strategy result changed");
        }

        // Empty input should produce no signals.
        const auto empty =
            atlas::BacktestRunner::run({}, strategy);

        require(empty.empty(), "Empty replay produced events");

        std::cout << "Backtest runner tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Backtest runner test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
