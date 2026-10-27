#include "atlas/portfolio_simulator.hpp"

#include <cmath>
#include <iostream>
#include <stdexcept>
#include <vector>

namespace {

void require(bool condition, const char* message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

bool near(double actual, double expected) {
    return std::abs(actual - expected) < 1e-8;
}

} // namespace

int main() {
    try {
        // A BUY at the first close executes at the second open.
        // A SELL at the second close executes at the third open.
        const std::vector<atlas::MarketBar> bars{
            {"2026-10-19", 10, 10, 10, 10, 1000},
            {"2026-10-20", 10, 12, 10, 12, 1000},
            {"2026-10-21", 12, 12, 12, 12, 1000}
        };

        const std::vector<atlas::SignalEvent> signals{
            {0, "2026-10-19", atlas::Signal::Buy},
            {1, "2026-10-20", atlas::Signal::Sell},
            {2, "2026-10-21", atlas::Signal::Hold}
        };

        const auto result = atlas::PortfolioSimulator::run(
            bars, signals, 1000.0
        );

        require(result.trades.size() == 2,
                "Expected two executed trades");

        require(result.equity_curve.size() == 3,
                "Expected three equity observations");

        require(near(result.trades[0].price, 10.0),
                "Incorrect buy execution price");

        require(near(result.trades[1].price, 12.0),
                "Incorrect sell execution price");

        require(near(result.final_equity, 1200.0),
                "Incorrect final equity");

        require(near(result.total_return_pct, 20.0),
                "Incorrect portfolio return");

        // Empty input preserves starting capital.
        const auto empty = atlas::PortfolioSimulator::run(
            {}, {}, 1000.0
        );

        require(near(empty.final_equity, 1000.0),
                "Empty simulation changed capital");

        // A losing scenario must produce a negative return.
        const std::vector<atlas::MarketBar> falling{
            {"2026-10-19", 10, 10, 10, 10, 1000},
            {"2026-10-20", 10, 10, 8, 8, 1000},
            {"2026-10-21", 8, 8, 8, 8, 1000}
        };

        const auto loss = atlas::PortfolioSimulator::run(
            falling, signals, 1000.0
        );

        require(near(loss.final_equity, 800.0),
                "Incorrect losing-trade equity");

        require(near(loss.total_return_pct, -20.0),
                "Incorrect losing-trade return");

        // Invalid capital must not start a simulation.
        bool rejected = false;

        try {
            (void)atlas::PortfolioSimulator::run(
                bars, signals, -100.0
            );
        } catch (const std::invalid_argument&) {
            rejected = true;
        }

        require(rejected, "Negative capital was accepted");

        std::cout << "Portfolio simulator tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Portfolio simulator test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
