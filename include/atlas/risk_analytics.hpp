#pragma once

#include "atlas/portfolio_simulator.hpp"

#include <cstddef>
#include <optional>
#include <vector>

namespace atlas {

// Explicit sampling assumptions prevent accidental
// annualization of irregular or synthetic observations.
struct RiskConfig {
    double periods_per_year = 252.0;
    double risk_free_rate_per_period = 0.0;

    // Minimum acceptable return per observation.
    // This is separate from the Sharpe risk-free rate.
    double target_return_per_period = 0.0;
};

struct RiskMetrics {
    std::size_t return_observations = 0;

    // Percentage, not decimal return.
    std::optional<double> annualized_volatility_pct;

    // Undefined for insufficient or zero-variance returns.
    std::optional<double> sharpe_ratio;

    // Full-observation downside deviation, annualized.
    std::optional<double> downside_deviation_pct;

    // Undefined when downside deviation is zero.
    std::optional<double> sortino_ratio;
};

class RiskAnalyzer {
public:
    // Uses consecutive closing-equity observations.
    // The first observation is a baseline, not a return.
    // N equity observations produce N - 1 returns.
    static std::vector<double> periodic_returns(
        const PortfolioResult& portfolio
    );

    // Computes risk metrics from an existing simulation.
    // Undefined statistics are represented by std::nullopt.
    static RiskMetrics analyze(
        const PortfolioResult& portfolio,
        const RiskConfig& config = {}
    );
};

} // namespace atlas
