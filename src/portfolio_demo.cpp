#include "atlas/backtest_runner.hpp"
#include "atlas/portfolio_simulator.hpp"
#include "atlas/performance_metrics.hpp"
#include "atlas/portfolio_json_exporter.hpp"
#include <fstream>
#include <stdexcept>
#include "atlas/sma_crossover_strategy.hpp"

#include <array>
#include <string>
#include <iomanip>
#include <iostream>
#include <vector>

int main(int argc, char* argv[]) {
    // Preserve the original demonstration unless cost mode
    // is explicitly requested.
    if (argc > 2 ||
        (argc == 2 && std::string(argv[1]) != "--cost-demo")) {
        std::cerr << "Usage: atlas_portfolio_demo [--cost-demo]\n";
        return 1;
    }

    const bool cost_demo = argc == 2;
    atlas::ExecutionConfig config{};

    if (cost_demo) {
        config.commission_per_trade = 5.0;
        config.slippage_bps = 10.0;
    }

    // Synthetic closing prices from the existing SMA demo.
    constexpr std::array<double, 12> prices{
        10, 9, 8, 7, 6, 7, 8, 9, 10, 8, 6, 4
    };

    std::vector<atlas::MarketBar> bars;
    bars.reserve(prices.size());

    // This demonstration uses identical OHLC prices per bar.
    // It is not representative of real intraday price movement.
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

    // Generate historical signals using the existing strategy.
    atlas::SmaCrossoverStrategy strategy(3, 5);

    const auto signals =
        atlas::BacktestRunner::run(bars, strategy);

    // Execute signals at the following bar's opening price.
    const auto result = atlas::PortfolioSimulator::run(
        bars,
        signals,
        10000.0,
        config
    );

    // Calculate portfolio performance from the equity curve.
    const auto metrics =
        atlas::PerformanceAnalyzer::analyze(result);

    std::cout << std::fixed << std::setprecision(2);

    std::cout << "====================================\n";
    std::cout << "PROJECT ATLAS - PORTFOLIO DEMO\n";
    std::cout << "====================================\n\n";

    std::cout << "Strategy: SMA Crossover (3 / 5)\n";
    std::cout << "Starting capital: $"
              << result.initial_capital << "\n\n";

    std::cout << "EXECUTED TRADES\n";

    for (const auto& trade : result.trades) {
        const char* side =
            trade.side == atlas::Signal::Buy
                ? "BUY"
                : "SELL";

        std::cout << trade.timestamp
                  << " | " << side
                  << " | Price: $" << trade.price
                  << " | Shares: " << trade.quantity
                  << '\n';
    }

    std::cout << "\nPORTFOLIO SUMMARY\n";

    std::cout << "Final equity: $"
              << result.final_equity << '\n';

    std::cout << "Net profit: $"
              << metrics.net_profit << '\n';

    std::cout << "Total return: "
              << metrics.total_return_pct << "%\n";

    std::cout << "Maximum drawdown: "
              << metrics.maximum_drawdown_pct << "%\n";

    if (cost_demo) {
        std::cout << "Total commission: $"
                  << result.total_commission << '\n';
        std::cout << "Total slippage: $"
                  << result.total_slippage_cost << '\n';
    }

    // Export calculated results for the Atlas Terminal frontend.
    const auto json = atlas::PortfolioJsonExporter::serialize(
        result,
        metrics,
        "SMA Crossover (3/5)",
        cost_demo ? 2 : 1
    );

    const std::string output_path = cost_demo
        ? "atlas_portfolio_v2.json"
        : "atlas_portfolio.json";

    std::ofstream output(output_path);

    if (!output.is_open()) {
        throw std::runtime_error("Cannot create portfolio JSON");
    }

    output << json;
    output.close();

    if (!output) {
        throw std::runtime_error("Failed to write portfolio JSON");
    }

    std::cout << "\nPortfolio JSON exported to "
              << output_path << '\n';

    std::cout << "\nSynthetic data only.\n";
    std::cout << "No real orders were executed.\n";

    return 0;
}
