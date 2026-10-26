// Project Atlas: historical strategy signal demonstration.
// This program generates signals; it does not execute trades.

#include "atlas/backtest_runner.hpp"
#include "atlas/sma_crossover_strategy.hpp"
#include "atlas/signal_exporter.hpp"

#include <cstddef>
#include <iostream>
#include <vector>

namespace {

// Convert a trading signal into readable terminal output.
const char* signal_name(atlas::Signal signal) {
    switch (signal) {
        case atlas::Signal::Buy:
            return "BUY";
        case atlas::Signal::Sell:
            return "SELL";
        case atlas::Signal::Hold:
            return "HOLD";
    }

    return "UNKNOWN";
}

} // namespace

int main() {
    // Synthetic prices create bullish and bearish crossovers.
    const std::vector<double> prices{
        10, 9, 8, 7, 6, 7, 8, 9, 10, 8, 6, 4
    };

    std::vector<atlas::MarketBar> bars;
    bars.reserve(prices.size());

    // Construct deterministic market bars for the demonstration.
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

    // A 3-day fast average and 5-day slow average.
    atlas::SmaCrossoverStrategy strategy(3, 5);

    // Replay historical data and collect strategy decisions.
    const auto events = atlas::BacktestRunner::run(
        bars,
        strategy
    );

    std::cout << "====================================\n";
    std::cout << "PROJECT ATLAS - STRATEGY DEMO\n";
    std::cout << "====================================\n";
    std::cout << "Strategy: SMA Crossover (3 / 5)\n\n";

    std::cout << "DAY\tPRICE\tSIGNAL\n";

    for (const auto& event : events) {
        std::cout
            << event.timestamp << '\t'
            << prices[event.index] << '\t'
            << signal_name(event.signal) << '\n';
    }

    // Export signals for later analysis and visualization.
    atlas::SignalExporter::write_csv(
        "atlas_signals.csv",
        events
    );

    std::cout << "\nSignals exported to atlas_signals.csv\n";
    std::cout << "Simulation complete.\n";
    std::cout << "Signals only - no orders executed.\n";

    return 0;
}
