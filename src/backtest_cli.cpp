#include "atlas/backtest_response.hpp"
#include "atlas/backtest_runner.hpp"
#include "atlas/buy_and_hold_strategy.hpp"
#include "atlas/csv_reader.hpp"
#include "atlas/performance_metrics.hpp"
#include "atlas/portfolio_json_exporter.hpp"
#include "atlas/portfolio_simulator.hpp"
#include "atlas/risk_analytics.hpp"
#include "atlas/sma_crossover_strategy.hpp"

#include <cmath>
#include <exception>
#include <filesystem>
#include <set>
#include <iostream>
#include <limits>
#include <memory>
#include <stdexcept>
#include <string>
#include <vector>

namespace {

struct CliConfig {
    std::string csv_path;
    std::string strategy;
    double capital = 10000.0;
    double commission = 0.0;
    double slippage_bps = 0.0;
    std::size_t fast = 3;
    std::size_t slow = 5;
};

// Reject malformed, negative, infinite, and trailing input.
double parse_number(const std::string& text) {
    std::size_t consumed = 0;
    const double value = std::stod(text, &consumed);

    if (consumed != text.size() || !std::isfinite(value)) {
        throw std::invalid_argument("Invalid numeric argument");
    }

    return value;
}

std::size_t parse_period(const std::string& text) {
    if (text.empty() || text.find_first_not_of("0123456789") !=
                            std::string::npos) {
        throw std::invalid_argument("Invalid SMA period");
    }

    const unsigned long long value = std::stoull(text);

    if (value == 0 || value > 100000) {
        throw std::invalid_argument("SMA period out of range");
    }

    return static_cast<std::size_t>(value);
}

// Parse an allowlisted set of command-line options.
CliConfig parse_args(int argc, char* argv[]) {
    if (argc < 3) {
        throw std::invalid_argument(
            "Usage: atlas_backtest_cli <csv> <strategy> "
            "[--capital N] [--commission N] "
            "[--slippage-bps N] [--fast N] [--slow N]"
        );
    }

    CliConfig config;
    config.csv_path = argv[1];
    config.strategy = argv[2];

    std::set<std::string> seen_options;

    for (int i = 3; i < argc; i += 2) {
        if (i + 1 >= argc) {
            throw std::invalid_argument("Missing option value");
        }

        const std::string option = argv[i];
        const std::string value = argv[i + 1];

        if (!seen_options.insert(option).second) {
            throw std::invalid_argument(
                "Duplicate CLI option: " + option
            );
        }

        if (option == "--capital") {
            config.capital = parse_number(value);
        } else if (option == "--commission") {
            config.commission = parse_number(value);
        } else if (option == "--slippage-bps") {
            config.slippage_bps = parse_number(value);
        } else if (option == "--fast") {
            config.fast = parse_period(value);
        } else if (option == "--slow") {
            config.slow = parse_period(value);
        } else {
            throw std::invalid_argument("Unsupported CLI option");
        }
    }

    if (config.capital <= 0.0 ||
        config.commission < 0.0 ||
        config.slippage_bps < 0.0 ||
        config.slippage_bps >= 10000.0 ||
        config.fast >= config.slow) {
        throw std::invalid_argument(
            "Invalid backtest configuration"
        );
    }

    return config;
}

std::unique_ptr<atlas::Strategy> create_strategy(
    const CliConfig& config
) {
    if (config.strategy == "buy-and-hold") {
        return std::make_unique<atlas::BuyAndHoldStrategy>();
    }

    if (config.strategy == "sma-crossover") {
        return std::make_unique<atlas::SmaCrossoverStrategy>(
            config.fast,
            config.slow
        );
    }

    throw std::invalid_argument("Unsupported strategy");
}

} // namespace

int main(int argc, char* argv[]) {
    try {
        const auto config = parse_args(argc, argv);

        // Reject oversized files before loading observations.
        // This bounds the amount of input accepted by the CLI.
        constexpr std::uintmax_t max_csv_bytes =
            16ULL * 1024ULL * 1024ULL;

        const auto csv_bytes =
            std::filesystem::file_size(config.csv_path);

        if (csv_bytes > max_csv_bytes) {
            throw std::invalid_argument(
                "CSV exceeds the 16 MiB input limit"
            );
        }

        const auto bars = atlas::CsvReader::read(
            config.csv_path
        );

        // Bound the amount of work performed by one request.
        constexpr std::size_t max_bars = 100000;

        if (bars.empty() || bars.size() > max_bars) {
            throw std::invalid_argument(
                "Dataset must contain 1 to 100000 bars"
            );
        }

        auto strategy = create_strategy(config);

        const auto signals =
            atlas::BacktestRunner::run(bars, *strategy);

        atlas::ExecutionConfig execution{};
        execution.commission_per_trade = config.commission;
        execution.slippage_bps = config.slippage_bps;

        const auto portfolio =
            atlas::PortfolioSimulator::run(
                bars,
                signals,
                config.capital,
                execution
            );

        const auto performance =
            atlas::PerformanceAnalyzer::analyze(portfolio);

        const atlas::RiskConfig risk_config{};

        const auto risk =
            atlas::RiskAnalyzer::analyze(
                portfolio,
                risk_config
            );

        const auto portfolio_json =
            atlas::PortfolioJsonExporter::serialize_v3(
                portfolio,
                performance,
                risk,
                risk_config,
                execution,
                config.strategy
            );

        std::cout << atlas::BacktestResponse::serialize(
            signals,
            portfolio_json
        ) << '\n';

        return 0;
    } catch (const std::exception& error) {
        std::cerr << "Backtest error: "
                  << error.what() << '\n';
        return 1;
    }
}
