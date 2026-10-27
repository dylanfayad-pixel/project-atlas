#pragma once

#include "atlas/portfolio_simulator.hpp"

#include <vector>

namespace atlas {

// Summary statistics calculated from a simulated equity curve.
struct PerformanceMetrics {
    double maximum_drawdown_pct;
    double net_profit;
    double total_return_pct;
};

class PerformanceAnalyzer {
public:
    // Calculates performance metrics without modifying
    // the underlying portfolio simulation.
    static PerformanceMetrics analyze(
        const PortfolioResult& result
    );
};

} // namespace atlas
