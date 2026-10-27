#include "atlas/backtest_runner.hpp"
#include "atlas/buy_and_hold_strategy.hpp"
#include "atlas/performance_metrics.hpp"
#include "atlas/portfolio_simulator.hpp"
#include "atlas/sma_crossover_strategy.hpp"

#include <array>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

namespace {

// Build a deterministic dataset shared by both strategies.
// OHLC values are identical because this is a synthetic test.
std::vector<atlas::MarketBar> make_bars() {
    constexpr std::array<double, 12> prices{
        10, 9, 8, 7, 6, 7, 8, 9, 10, 8, 6, 4
    };

    std::vector<atlas::MarketBar> bars;
    bars.reserve(prices.size());

    for (std::size_t i = 0; i < prices.size(); ++i) {
        const double price = prices[i];

        bars.push_back({
            "Day " + std::to_string(i + 1),
            price,
            price,
            price,
            price,
            1000
        });
    }

    return bars;
}

// Evaluate each strategy using the same portfolio assumptions.
void evaluate(
    const std::string& name,
    const std::vector<atlas::MarketBar>& bars,
    atlas::Strategy& strategy
) {
    // Generate signals before simulating order execution.
    const auto signals =
        atlas::BacktestRunner::run(bars, strategy);

    const auto portfolio =
        atlas::PortfolioSimulator::run(
            bars,
            signals,
            10000.0
        );

    // Calculate performance from the simulated equity curve.
    const auto metrics =
        atlas::PerformanceAnalyzer::analyze(portfolio);

    std::cout << std::left << std::setw(22) << name
              << std::right << std::setw(15)
              << portfolio.final_equity
              << std::setw(15) << metrics.total_return_pct
              << std::setw(15) << metrics.maximum_drawdown_pct
              << std::setw(12) << portfolio.trades.size()
              << '\n';
}

} // namespace

int main() {
    const auto bars = make_bars();

    atlas::BuyAndHoldStrategy buy_and_hold;
    atlas::SmaCrossoverStrategy sma(3, 5);

    std::cout << std::fixed << std::setprecision(2);

    std::cout << "====================================\n";
    std::cout << "PROJECT ATLAS - STRATEGY COMPARISON\n";
    std::cout << "====================================\n\n";

    std::cout << "Synthetic data | Starting capital: $10000\n\n";

    std::cout << std::left << std::setw(22) << "Strategy"
              << std::right << std::setw(15) << "Final Equity"
              << std::setw(15) << "Return %"
              << std::setw(15) << "Max DD %"
              << std::setw(12) << "Fills"
              << '\n';

    evaluate("Buy and Hold", bars, buy_and_hold);
    evaluate("SMA Crossover (3/5)", bars, sma);

    std::cout << "\nSynthetic demonstration only.\n";
    std::cout << "No fees, slippage, or real orders.\n";

    return 0;
}
