#include "atlas/risk_analytics.hpp"

#include <cmath>
#include <iostream>
#include <limits>
#include <stdexcept>
#include <vector>

namespace {

void require(bool condition, const char* message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

bool near(double actual, double expected, double tolerance = 1e-9) {
    return std::abs(actual - expected) <= tolerance;
}

template <typename Function>
void require_invalid(Function function, const char* message) {
    bool rejected = false;

    try {
        function();
    } catch (const std::invalid_argument&) {
        rejected = true;
    }

    require(rejected, message);
}

atlas::PortfolioResult make_portfolio(
    double initial_capital,
    const std::vector<double>& equity
) {
    atlas::PortfolioResult portfolio{};
    portfolio.initial_capital = initial_capital;
    portfolio.final_equity =
        equity.empty() ? initial_capital : equity.back();

    for (std::size_t i = 0; i < equity.size(); ++i) {
        portfolio.equity_curve.push_back({
            i,
            "Period " + std::to_string(i + 1),
            equity[i],
            0.0,
            equity[i]
        });
    }

    return portfolio;
}

} // namespace

int main() {
    try {
        // Returns are +10%, -10%, and +20%.
        const auto portfolio = make_portfolio(
            100.0,
            {100.0, 110.0, 99.0, 118.8}
        );

        const auto returns =
            atlas::RiskAnalyzer::periodic_returns(portfolio);

        require(returns.size() == 3, "Wrong return count");
        require(near(returns[0], 0.10), "Wrong first return");
        require(near(returns[1], -0.10), "Wrong second return");
        require(near(returns[2], 0.20), "Wrong third return");

        // Sample mean = 0.0666666667.
        // Sample standard deviation = sqrt(0.0233333333).
        const double expected_stddev =
            std::sqrt(0.023333333333333334);

        atlas::RiskConfig config{};
        config.periods_per_year = 4.0;

        const auto metrics =
            atlas::RiskAnalyzer::analyze(portfolio, config);

        require(metrics.return_observations == 3,
                "Wrong observation count");

        require(metrics.annualized_volatility_pct.has_value(),
                "Missing volatility");

        require(metrics.sharpe_ratio.has_value(),
                "Missing Sharpe ratio");

        const double expected_volatility =
            expected_stddev * 2.0 * 100.0;

        const double expected_sharpe =
            (1.0 / 15.0) / expected_stddev * 2.0;

        require(
            near(*metrics.annualized_volatility_pct,
                 expected_volatility),
            "Incorrect annualized volatility"
        );

        require(
            near(*metrics.sharpe_ratio, expected_sharpe),
            "Incorrect Sharpe ratio"
        );

        // Downside deviation uses all three return periods.
        const double expected_downside =
            std::sqrt(0.01 / 3.0);

        require(
            metrics.downside_deviation_pct.has_value(),
            "Missing downside deviation"
        );

        require(
            metrics.sortino_ratio.has_value(),
            "Missing Sortino ratio"
        );

        require(
            near(*metrics.downside_deviation_pct,
                 expected_downside * 2.0 * 100.0),
            "Incorrect downside deviation"
        );

        const double expected_sortino =
            (1.0 / 15.0) / expected_downside * 2.0;

        require(
            near(*metrics.sortino_ratio, expected_sortino),
            "Incorrect Sortino ratio"
        );

        // The risk-free rate must reduce excess return.
        config.risk_free_rate_per_period = 0.01;

        const auto adjusted =
            atlas::RiskAnalyzer::analyze(portfolio, config);

        const double adjusted_sharpe =
            (1.0 / 15.0 - 0.01) /
            expected_stddev * 2.0;

        require(
            near(*adjusted.sharpe_ratio, adjusted_sharpe),
            "Risk-free rate was not applied correctly"
        );

        // Constant equity has zero volatility and no
        // mathematically defined Sharpe ratio.
        const auto flat = make_portfolio(
            100.0,
            {100.0, 100.0, 100.0}
        );

        const auto flat_metrics =
            atlas::RiskAnalyzer::analyze(flat);

        require(
            near(*flat_metrics.annualized_volatility_pct, 0.0),
            "Flat portfolio volatility should be zero"
        );

        require(
            !flat_metrics.sharpe_ratio.has_value(),
            "Flat portfolio Sharpe should be undefined"
        );

        require(
            flat_metrics.downside_deviation_pct.has_value() &&
            near(*flat_metrics.downside_deviation_pct, 0.0),
            "Flat portfolio downside deviation should be zero"
        );

        require(
            !flat_metrics.sortino_ratio.has_value(),
            "Flat portfolio Sortino should be undefined"
        );

        // Fewer than two returns cannot estimate sample variance.
        const auto short_series = make_portfolio(
            100.0,
            {100.0, 110.0}
        );

        const auto short_metrics =
            atlas::RiskAnalyzer::analyze(short_series);

        require(
            !short_metrics.annualized_volatility_pct.has_value(),
            "One return unexpectedly produced volatility"
        );

        require(
            !short_metrics.sharpe_ratio.has_value(),
            "One return unexpectedly produced Sharpe"
        );

        // Invalid inputs must fail explicitly.
        require_invalid(
            [] {
                auto invalid = make_portfolio(0.0, {100.0});
                (void)atlas::RiskAnalyzer::analyze(invalid);
            },
            "Zero starting capital was accepted"
        );

        require_invalid(
            [] {
                auto invalid = make_portfolio(
                    100.0, {100.0, -1.0}
                );
                (void)atlas::RiskAnalyzer::analyze(invalid);
            },
            "Negative equity was accepted"
        );

        require_invalid(
            [&portfolio] {
                atlas::RiskConfig invalid{};
                invalid.periods_per_year = 0.0;
                (void)atlas::RiskAnalyzer::analyze(
                    portfolio, invalid
                );
            },
            "Zero annualization was accepted"
        );

        // A nonzero target changes downside deviation.
        atlas::RiskConfig target_config{};
        target_config.periods_per_year = 4.0;
        target_config.target_return_per_period = 0.05;

        const auto targeted =
            atlas::RiskAnalyzer::analyze(
                portfolio, target_config
            );

        // Returns: +10%, -10%, +20%.
        // Shortfalls below 5%: 0, 15%, 0.
        const double targeted_downside =
            std::sqrt(0.15 * 0.15 / 3.0);

        require(
            targeted.downside_deviation_pct.has_value(),
            "Missing targeted downside deviation"
        );

        require(
            near(*targeted.downside_deviation_pct,
                 targeted_downside * 200.0),
            "Incorrect nonzero-target downside deviation"
        );

        const double targeted_sortino =
            (1.0 / 15.0 - 0.05) /
            targeted_downside * 2.0;

        require(
            targeted.sortino_ratio.has_value() &&
            near(*targeted.sortino_ratio, targeted_sortino),
            "Incorrect nonzero-target Sortino"
        );

        // A final loss of all capital is a valid -100% return.
        const auto depleted = make_portfolio(
            100.0,
            {100.0, 0.0}
        );

        const auto depleted_returns =
            atlas::RiskAnalyzer::periodic_returns(depleted);

        require(
            depleted_returns.size() == 1 &&
            near(depleted_returns.front(), -1.0),
            "Final portfolio depletion was not handled"
        );

        // A return following zero equity is undefined.
        require_invalid(
            [] {
                const auto invalid = make_portfolio(
                    100.0, {100.0, 0.0, 10.0}
                );
                (void)atlas::RiskAnalyzer::periodic_returns(
                    invalid
                );
            },
            "Recovery after zero equity was accepted"
        );

        // Invalid downside targets must be rejected.
        require_invalid(
            [&portfolio] {
                atlas::RiskConfig invalid{};
                invalid.target_return_per_period =
                    std::numeric_limits<double>::infinity();

                (void)atlas::RiskAnalyzer::analyze(
                    portfolio, invalid
                );
            },
            "Infinite downside target was accepted"
        );

        // Empty equity curves cannot establish returns.
        const auto empty = make_portfolio(100.0, {});

        const auto empty_metrics =
            atlas::RiskAnalyzer::analyze(empty);

        require(
            empty_metrics.return_observations == 0 &&
            !empty_metrics.sharpe_ratio.has_value() &&
            !empty_metrics.sortino_ratio.has_value(),
            "Empty portfolio produced risk ratios"
        );


        // Large but finite equity values should not
        // automatically invalidate return calculations.
        const auto large = make_portfolio(
            1e150,
            {1e150, 1.1e150, 0.99e150, 1.188e150}
        );

        const auto large_metrics =
            atlas::RiskAnalyzer::analyze(large, config);

        require(
            large_metrics.sharpe_ratio.has_value() &&
            std::isfinite(*large_metrics.sharpe_ratio),
            "Large finite equity produced invalid Sharpe"
        );

        // NaN equity must never enter the return series.
        require_invalid(
            [] {
                const auto invalid = make_portfolio(
                    100.0,
                    {100.0,
                     std::numeric_limits<double>::quiet_NaN()}
                );

                (void)atlas::RiskAnalyzer::analyze(invalid);
            },
            "NaN equity was accepted"
        );

        // A non-finite risk-free rate must be rejected.
        require_invalid(
            [&portfolio] {
                atlas::RiskConfig invalid{};
                invalid.risk_free_rate_per_period =
                    std::numeric_limits<double>::infinity();

                (void)atlas::RiskAnalyzer::analyze(
                    portfolio, invalid
                );
            },
            "Infinite risk-free rate was accepted"
        );

        // Extreme targets must not silently generate
        // non-finite public risk metrics.
        {
            atlas::RiskConfig extreme{};
            extreme.periods_per_year = 252.0;
            extreme.target_return_per_period =
                std::numeric_limits<double>::max();

            bool safe = false;

            try {
                const auto result =
                    atlas::RiskAnalyzer::analyze(
                        portfolio, extreme
                    );

                safe =
                    result.downside_deviation_pct.has_value() &&
                    std::isfinite(
                        *result.downside_deviation_pct
                    ) &&
                    (!result.sortino_ratio.has_value() ||
                     std::isfinite(*result.sortino_ratio));
            } catch (const std::overflow_error&) {
                safe = true;
            }

            require(
                safe,
                "Extreme target produced unsafe metrics"
            );
        }

        std::cout << "Risk analytics tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Risk analytics test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
