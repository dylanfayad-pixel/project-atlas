#include "atlas/portfolio_json_exporter.hpp"
#include "atlas/portfolio_simulator.hpp"
#include "atlas/performance_metrics.hpp"
#include "atlas/risk_analytics.hpp"

#include <iostream>
#include <vector>

int main() {
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

    std::cout << PortfolioJsonExporter::serialize_v3(
        portfolio,
        performance,
        risk,
        risk_config,
        execution,
        "Phase 4.4 Smoke Test"
    );
}
