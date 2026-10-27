#include "atlas/portfolio_json_exporter.hpp"

#include <iostream>
#include <limits>
#include <stdexcept>
#include <string>

namespace {

void require(bool condition, const char* message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

// Verify that an operation rejects invalid input.
template <typename Exception, typename Function>
void expect_failure(Function operation, const char* message) {
    bool rejected = false;

    try {
        operation();
    } catch (const Exception&) {
        rejected = true;
    }

    require(rejected, message);
}

} // namespace

int main() {
    try {
        atlas::PortfolioResult portfolio{};
        portfolio.initial_capital = 1000.0;
        portfolio.final_equity = 1200.0;
        portfolio.total_return_pct = 20.0;

        portfolio.equity_curve = {
            {0, "Day 1", 1000, 0, 1000},
            {1, "Day 2", 1200, 0, 1200}
        };

        portfolio.trades = {
            {1, "Day 2", atlas::Signal::Sell, 12, 100}
        };

        const atlas::PerformanceMetrics metrics{
            0.0,
            200.0,
            20.0
        };

        // Verify expected fields are serialized.
        const auto json =
            atlas::PortfolioJsonExporter::serialize(
                portfolio,
                metrics,
                "Test Strategy"
            );

        require(
            json.find("\"schema_version\": 1") !=
                std::string::npos,
            "Missing JSON schema version"
        );

        require(
            json.find("\"final_equity\": 1200") !=
                std::string::npos,
            "Missing final equity"
        );

        require(
            json.find("\"side\": \"SELL\"") !=
                std::string::npos,
            "Missing serialized trade"
        );

        // Special characters must not corrupt JSON strings.
        const auto escaped =
            atlas::PortfolioJsonExporter::serialize(
                portfolio,
                metrics,
                "Test \"Quoted\" Strategy"
            );

        require(
            escaped.find("\\\"Quoted\\\"") !=
                std::string::npos,
            "Strategy name was not escaped"
        );

        // JSON cannot represent NaN or infinity.
        auto invalid = portfolio;
        invalid.final_equity =
            std::numeric_limits<double>::quiet_NaN();

        expect_failure<std::invalid_argument>(
            [&] {
                (void)atlas::PortfolioJsonExporter::serialize(
                    invalid, metrics, "Invalid"
                );
            },
            "NaN final equity was accepted"
        );

        // Reject invalid enum values in trade records.
        invalid = portfolio;
        invalid.trades[0].side =
            static_cast<atlas::Signal>(99);

        expect_failure<std::invalid_argument>(
            [&] {
                (void)atlas::PortfolioJsonExporter::serialize(
                    invalid, metrics, "Invalid"
                );
            },
            "Invalid trade signal was accepted"
        );

        std::cout << "Portfolio JSON exporter tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Portfolio JSON exporter test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
