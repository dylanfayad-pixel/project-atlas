#include "atlas/performance_metrics.hpp"

#include <algorithm>
#include <cmath>
#include <stdexcept>

namespace atlas {

PerformanceMetrics PerformanceAnalyzer::analyze(
    const PortfolioResult& result
) {
    // Starting capital must be meaningful and finite.
    if (!std::isfinite(result.initial_capital) ||
        result.initial_capital <= 0.0) {
        throw std::invalid_argument(
            "Invalid initial capital for performance analysis"
        );
    }

    double peak = result.initial_capital;
    double maximum_drawdown = 0.0;

    // Compare each equity observation with the highest
    // portfolio value observed up to that point.
    for (const auto& point : result.equity_curve) {
        if (!std::isfinite(point.equity) ||
            point.equity < 0.0) {
            throw std::invalid_argument(
                "Invalid equity curve value"
            );
        }

        peak = std::max(peak, point.equity);

        const double drawdown =
            (peak - point.equity) / peak * 100.0;

        maximum_drawdown =
            std::max(maximum_drawdown, drawdown);
    }

    const double net_profit =
        result.final_equity - result.initial_capital;

    const double total_return =
        (result.final_equity / result.initial_capital - 1.0)
        * 100.0;

    if (!std::isfinite(net_profit) ||
        !std::isfinite(total_return)) {
        throw std::overflow_error(
            "Non-finite performance metric"
        );
    }

    return {
        maximum_drawdown,
        net_profit,
        total_return
    };
}

} // namespace atlas
