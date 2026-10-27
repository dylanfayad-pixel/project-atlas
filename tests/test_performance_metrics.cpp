#include "atlas/performance_metrics.hpp"

#include <cmath>
#include <iostream>
#include <stdexcept>

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
        atlas::PortfolioResult result{};

        result.initial_capital = 10000.0;
        result.final_equity = 13000.0;

        // Portfolio peaks at 12000, falls to 9000,
        // and later recovers to 13000.
        result.equity_curve = {
            {0, "Day 1", 10000, 0, 10000},
            {1, "Day 2", 11000, 0, 11000},
            {2, "Day 3", 12000, 0, 12000},
            {3, "Day 4", 9000, 0, 9000},
            {4, "Day 5", 10500, 0, 10500},
            {5, "Day 6", 13000, 0, 13000}
        };

        const auto metrics =
            atlas::PerformanceAnalyzer::analyze(result);

        require(
            near(metrics.maximum_drawdown_pct, 25.0),
            "Incorrect maximum drawdown"
        );

        require(
            near(metrics.net_profit, 3000.0),
            "Incorrect net profit"
        );

        require(
            near(metrics.total_return_pct, 30.0),
            "Incorrect total return"
        );

        // An unchanged portfolio should have no drawdown.
        atlas::PortfolioResult flat{};
        flat.initial_capital = 1000.0;
        flat.final_equity = 1000.0;
        flat.equity_curve = {
            {0, "Day 1", 1000, 0, 1000},
            {1, "Day 2", 1000, 0, 1000}
        };

        const auto flat_metrics =
            atlas::PerformanceAnalyzer::analyze(flat);

        require(
            near(flat_metrics.maximum_drawdown_pct, 0.0),
            "Flat portfolio produced drawdown"
        );

        std::cout << "Performance metrics tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Performance metrics test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
