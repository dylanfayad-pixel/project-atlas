#pragma once

#include "atlas/performance_metrics.hpp"
#include "atlas/portfolio_simulator.hpp"
#include "atlas/risk_analytics.hpp"

#include <string>

namespace atlas {

// Serializes calculated portfolio results for web consumers.
// The output is JSON text; this class does not run strategies.
class PortfolioJsonExporter {
public:
    static std::string serialize(
        const PortfolioResult& portfolio,
        const PerformanceMetrics& metrics,
        const std::string& strategy_name,
        int schema_version = 1
    );

    // Exports a complete cost-aware portfolio with
    // quantitative risk and risk-control reporting.
    // Legacy v1/v2 serialization remains unchanged.
    static std::string serialize_v3(
        const PortfolioResult& portfolio,
        const PerformanceMetrics& metrics,
        const RiskMetrics& risk_metrics,
        const RiskConfig& risk_config,
        const ExecutionConfig& execution_config,
        const std::string& strategy_name
    );
};

} // namespace atlas
