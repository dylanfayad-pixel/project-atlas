#include "atlas/risk_analytics.hpp"

#include <cmath>
#include <limits>
#include <stdexcept>

namespace atlas {

std::vector<double> RiskAnalyzer::periodic_returns(
    const PortfolioResult& portfolio
) {
    if (!std::isfinite(portfolio.initial_capital) ||
        portfolio.initial_capital <= 0.0) {
        throw std::invalid_argument("Invalid initial capital");
    }

    const auto& curve = portfolio.equity_curve;

    std::vector<double> returns;

    if (curve.empty()) {
        return returns;
    }

    // Validate the baseline even when there are no returns.
    if (!std::isfinite(curve.front().equity) ||
        curve.front().equity < 0.0) {
        throw std::invalid_argument(
            "Invalid initial equity observation"
        );
    }

    if (curve.size() == 1) {
        return returns;
    }

    returns.reserve(curve.size() - 1);

    // The first closing-equity observation establishes
    // the baseline. It is not a completed return period.
    double previous = curve.front().equity;

    for (std::size_t i = 1; i < curve.size(); ++i) {
        const double current = curve[i].equity;

        if (!std::isfinite(current) || current < 0.0) {
            throw std::invalid_argument(
                "Invalid portfolio equity observation"
            );
        }

        if (previous <= 0.0) {
            throw std::invalid_argument(
                "Cannot calculate return after zero equity"
            );
        }

        const double value = current / previous - 1.0;

        if (!std::isfinite(value)) {
            throw std::overflow_error(
                "Non-finite periodic return"
            );
        }

        returns.push_back(value);
        previous = current;
    }

    return returns;
}

RiskMetrics RiskAnalyzer::analyze(
    const PortfolioResult& portfolio,
    const RiskConfig& config
) {
    if (!std::isfinite(config.periods_per_year) ||
        config.periods_per_year <= 0.0 ||
        !std::isfinite(config.risk_free_rate_per_period) ||
        !std::isfinite(config.target_return_per_period)) {
        throw std::invalid_argument(
            "Invalid risk analytics configuration"
        );
    }

    const auto returns = periodic_returns(portfolio);

    RiskMetrics result{};
    result.return_observations = returns.size();

    // Sample variance requires at least two observations.
    if (returns.size() < 2) {
        return result;
    }

    // Welford's algorithm calculates sample variance
    // using extended-precision intermediate values.
    long double mean = 0.0L;
    long double m2 = 0.0L;
    std::size_t count = 0;

    for (const double value : returns) {
        ++count;

        const long double observation =
            static_cast<long double>(value);

        const long double delta = observation - mean;
        mean += delta / static_cast<long double>(count);

        const long double delta2 = observation - mean;
        m2 += delta * delta2;

        if (!std::isfinite(mean) || !std::isfinite(m2)) {
            throw std::overflow_error(
                "Non-finite return variance"
            );
        }
    }

    const long double variance =
        m2 / static_cast<long double>(count - 1);

    const long double standard_deviation =
        std::sqrt(variance);

    const long double annualization =
        std::sqrt(
            static_cast<long double>(
                config.periods_per_year
            )
        );

    const long double volatility =
        standard_deviation * annualization * 100.0L;

    if (!std::isfinite(volatility) ||
        volatility >
            static_cast<long double>(
                std::numeric_limits<double>::max()
            )) {
        throw std::overflow_error(
            "Non-finite annualized volatility"
        );
    }

    result.annualized_volatility_pct =
        static_cast<double>(volatility);

    // Zero sample volatility makes Sharpe undefined.
    if (standard_deviation > 0.0L) {
        const long double sharpe =
            (mean -
             static_cast<long double>(
                 config.risk_free_rate_per_period
             )) /
            standard_deviation * annualization;

        if (!std::isfinite(sharpe) ||
            std::abs(sharpe) >
                static_cast<long double>(
                    std::numeric_limits<double>::max()
                )) {
            throw std::overflow_error(
                "Non-finite Sharpe ratio"
            );
        }

        result.sharpe_ratio = static_cast<double>(sharpe);
    }

    // Use extended precision for intermediate downside
    // calculations to reduce overflow and cancellation risk.
    long double scale = 0.0L;
    long double scaled_squares = 0.0L;

    for (const double value : returns) {
        const long double shortfall =
            static_cast<long double>(
                config.target_return_per_period
            ) - static_cast<long double>(value);

        if (shortfall <= 0.0L) {
            continue;
        }

        if (scale < shortfall) {
            const long double ratio =
                scale == 0.0L ? 0.0L : scale / shortfall;

            scaled_squares =
                1.0L + scaled_squares * ratio * ratio;

            scale = shortfall;
        } else {
            const long double ratio = shortfall / scale;
            scaled_squares += ratio * ratio;
        }
    }

    const long double downside =
        scale == 0.0L
            ? 0.0L
            : scale * std::sqrt(
                scaled_squares /
                static_cast<long double>(returns.size())
            );

    const long double annualized_downside =
        downside *
        static_cast<long double>(annualization) * 100.0L;

    if (!std::isfinite(annualized_downside) ||
        annualized_downside >
            static_cast<long double>(
                std::numeric_limits<double>::max()
            )) {
        throw std::overflow_error(
            "Non-finite downside deviation"
        );
    }

    result.downside_deviation_pct =
        static_cast<double>(annualized_downside);

    if (downside > 0.0L) {
        const long double sortino =
            (static_cast<long double>(mean) -
             static_cast<long double>(
                 config.target_return_per_period
             )) /
            downside *
            static_cast<long double>(annualization);

        if (!std::isfinite(sortino) ||
            std::abs(sortino) >
                static_cast<long double>(
                    std::numeric_limits<double>::max()
                )) {
            throw std::overflow_error(
                "Non-finite Sortino ratio"
            );
        }

        result.sortino_ratio =
            static_cast<double>(sortino);
    }

    return result;
}

} // namespace atlas
