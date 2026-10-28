#include "atlas/performance_metrics.hpp"
#include "atlas/portfolio_json_exporter.hpp"
#include "atlas/portfolio_simulator.hpp"

#include <iostream>
#include <stdexcept>
#include <string>

namespace {

void require(bool condition, const char* message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

void contains(const std::string& json,
              const std::string& field) {
    require(json.find(field) != std::string::npos,
            "Required JSON field missing");
}

} // namespace

int main() {
    try {
        atlas::PortfolioResult portfolio{};

        portfolio.initial_capital = 1000.0;
        portfolio.final_equity = 1100.0;
        portfolio.total_return_pct = 10.0;

        // Two synthetic fills with known transaction costs.
        portfolio.trades.push_back({
            0, "Day 1", atlas::Signal::Buy,
            100.1, 5.0, 2.0, 0.5
        });

        portfolio.trades.push_back({
            1, "Day 2", atlas::Signal::Sell,
            110.0, 5.0, 2.0, 0.5
        });

        portfolio.total_commission = 4.0;
        portfolio.total_slippage_cost = 1.0;

        // This fixture checks serialization, not a complete
        // execution simulation.
        atlas::PerformanceMetrics metrics{};

        const auto v2 =
            atlas::PortfolioJsonExporter::serialize(
                portfolio, metrics, "Test Strategy", 2
            );

        contains(v2, "\"schema_version\": 2");
        contains(v2, "\"total_commission\": 4");
        contains(v2, "\"total_slippage_cost\": 1");
        contains(v2, "\"total_execution_cost\": 5");
        contains(v2, "\"commission_paid\": 2");
        contains(v2, "\"slippage_cost\": 0.5");

        // The original schema must not expose v2 fields.
        const auto v1 =
            atlas::PortfolioJsonExporter::serialize(
                portfolio, metrics, "Test Strategy", 1
            );

        contains(v1, "\"schema_version\": 1");

        require(
            v1.find("\"total_execution_cost\"") ==
                std::string::npos,
            "Version 1 unexpectedly contains v2 fields"
        );

        // Invalid schema versions must be rejected.
        bool rejected = false;

        try {
            (void)atlas::PortfolioJsonExporter::serialize(
                portfolio, metrics, "Test Strategy", 99
            );
        } catch (const std::invalid_argument&) {
            rejected = true;
        }

        require(rejected, "Unsupported schema was accepted");

        // Inconsistent aggregate costs must be rejected.
        portfolio.total_commission = 100.0;
        rejected = false;

        try {
            (void)atlas::PortfolioJsonExporter::serialize(
                portfolio, metrics, "Test Strategy", 2
            );
        } catch (const std::invalid_argument&) {
            rejected = true;
        }

        require(rejected, "Inconsistent cost totals accepted");

        std::cout << "Portfolio JSON v2 tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Portfolio JSON v2 test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
