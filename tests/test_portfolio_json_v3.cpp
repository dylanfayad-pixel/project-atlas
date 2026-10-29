#include "atlas/performance_metrics.hpp"
#include "atlas/portfolio_json_exporter.hpp"
#include "atlas/portfolio_simulator.hpp"
#include "atlas/risk_analytics.hpp"

#include <cmath>
#include <iostream>
#include <limits>
#include <stdexcept>
#include <string>
#include <vector>

namespace {

void require(bool condition, const char* message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

template <typename Function>
void expect_invalid(Function operation) {
    bool rejected = false;

    try {
        operation();
    } catch (const std::invalid_argument&) {
        rejected = true;
    }

    require(rejected, "Invalid JSON v3 input was accepted");
}

bool contains(const std::string& text,
              const std::string& value) {
    return text.find(value) != std::string::npos;
}

} // namespace

int main() {
    try {
        using namespace atlas;

        const std::vector<MarketBar> bars{
            {"Day 1", 100, 100, 100, 100, 1000},
            {"Day 2", 100, 100, 100, 100, 1000},
            {"Day 3", 80, 80, 80, 80, 1000},
            {"Day 4", 70, 70, 70, 70, 1000}
        };

        const std::vector<SignalEvent> signals{
            {0, "Day 1", Signal::Buy},
            {1, "Day 2", Signal::Hold},
            {2, "Day 3", Signal::Hold},
            {3, "Day 4", Signal::Hold}
        };

        ExecutionConfig execution{};
        execution.max_drawdown_fraction = 0.20;
        execution.liquidate_on_drawdown = true;

        const auto portfolio = PortfolioSimulator::run(
            bars, signals, 10000.0, execution
        );

        const auto performance =
            PerformanceAnalyzer::analyze(portfolio);

        RiskConfig risk_config{};
        const auto risk =
            RiskAnalyzer::analyze(portfolio, risk_config);

        const auto serialize = [&](
            const PortfolioResult& p,
            const RiskMetrics& r,
            const RiskConfig& rc,
            const ExecutionConfig& ec
        ) {
            return PortfolioJsonExporter::serialize_v3(
                p, performance, r, rc, ec, "Risk Test"
            );
        };

        // Valid v3 output retains the cost-aware v2 fields.
        {
            const auto json = serialize(
                portfolio, risk, risk_config, execution
            );

            require(contains(json, "\"schema_version\": 3"),
                    "Missing v3 schema version");

            require(contains(json, "\"total_execution_cost\""),
                    "Missing execution cost reporting");

            require(contains(json, "\"risk_metrics\""),
                    "Missing risk metrics");

            require(contains(json, "\"exposure\""),
                    "Missing exposure reporting");

            require(contains(json, "\"risk_controls\""),
                    "Missing risk controls");

            require(contains(json, "DRAWDOWN_BREACH"),
                    "Missing breach event");

            require(contains(json, "LIQUIDATION_EXECUTED"),
                    "Missing liquidation event");
        }

        // Existing v1/v2 serialization must remain available.
        {
            const auto v1 = PortfolioJsonExporter::serialize(
                portfolio, performance, "Legacy", 1
            );

            const auto v2 = PortfolioJsonExporter::serialize(
                portfolio, performance, "Legacy", 2
            );

            require(contains(v1, "\"schema_version\": 1"),
                    "Legacy v1 changed");

            require(contains(v2, "\"schema_version\": 2"),
                    "Legacy v2 changed");

            require(!contains(v2, "\"risk_controls\""),
                    "v2 unexpectedly contains v3 reporting");
        }

        // Risk metrics must agree with the equity curve.
        {
            auto invalid = risk;
            invalid.return_observations += 1;

            expect_invalid([&] {
                (void)serialize(
                    portfolio, invalid, risk_config, execution
                );
            });
        }

        // Non-finite present statistics are invalid.
        {
            auto invalid = risk;
            invalid.sharpe_ratio =
                std::numeric_limits<double>::infinity();

            expect_invalid([&] {
                (void)serialize(
                    portfolio, invalid, risk_config, execution
                );
            });
        }

        // Invalid risk sampling assumptions are rejected.
        {
            auto invalid = risk_config;
            invalid.periods_per_year = 0.0;

            expect_invalid([&] {
                (void)serialize(
                    portfolio, risk, invalid, execution
                );
            });
        }

        // Invalid execution reporting limits are rejected.
        {
            auto invalid = execution;
            invalid.max_entry_exposure = 1.5;

            expect_invalid([&] {
                (void)serialize(
                    portfolio, risk, risk_config, invalid
                );
            });
        }

        // Risk events must refer to valid equity observations.
        {
            auto invalid = portfolio;
            invalid.risk_events[0].index = 100;

            expect_invalid([&] {
                (void)serialize(
                    invalid, risk, risk_config, execution
                );
            });
        }

        // Duplicate breach events must be rejected.
        {
            auto invalid = portfolio;
            invalid.risk_events.insert(
                invalid.risk_events.begin() + 1,
                invalid.risk_events.front()
            );

            expect_invalid([&] {
                (void)serialize(
                    invalid, risk, risk_config, execution
                );
            });
        }

        // Invalid equity accounting cannot create
        // impossible long-only exposure.
        {
            auto invalid = portfolio;
            invalid.equity_curve[1].cash = 20000.0;

            expect_invalid([&] {
                (void)serialize(
                    invalid, risk, risk_config, execution
                );
            });
        }


        // A disabled circuit breaker cannot report
        // drawdown activation events.
        {
            auto invalid = execution;
            invalid.max_drawdown_fraction = 1.0;

            expect_invalid([&] {
                (void)serialize(
                    portfolio, risk, risk_config, invalid
                );
            });
        }

        // Automatic liquidation events cannot be reported
        // when that execution policy is disabled.
        {
            auto invalid = execution;
            invalid.liquidate_on_drawdown = false;

            expect_invalid([&] {
                (void)serialize(
                    portfolio, risk, risk_config, invalid
                );
            });
        }

        // A reported breach must meet the configured
        // drawdown threshold.
        {
            auto invalid = execution;
            invalid.max_drawdown_fraction = 0.50;

            expect_invalid([&] {
                (void)serialize(
                    portfolio, risk, risk_config, invalid
                );
            });
        }


        // A successful risk-liquidation event must correspond
        // to an actual SELL fill at the same bar.
        {
            auto invalid = portfolio;

            // Preserve the event but remove its corresponding
            // trade to simulate inconsistent reporting.
            invalid.trades.pop_back();

            // Keep cost totals consistent with remaining fills
            // so the test isolates event-to-trade reconciliation.
            invalid.total_commission = 0.0;
            invalid.total_slippage_cost = 0.0;

            expect_invalid([&] {
                (void)serialize(
                    invalid, risk, risk_config, execution
                );
            });
        }


        // A rejected liquidation event cannot coexist with
        // an executed SELL fill at the same bar.
        {
            auto invalid = portfolio;

            require(invalid.risk_events.size() == 2,
                    "Expected breach and liquidation events");

            require(
                invalid.risk_events[1].type ==
                    RiskEventType::LiquidationExecuted,
                "Expected successful liquidation baseline"
            );

            // Deliberately contradict the actual SELL fill.
            invalid.risk_events[1].type =
                RiskEventType::LiquidationRejected;

            expect_invalid([&] {
                (void)serialize(
                    invalid, risk, risk_config, execution
                );
            });
        }

        std::cout << "Portfolio JSON v3 tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Portfolio JSON v3 test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
