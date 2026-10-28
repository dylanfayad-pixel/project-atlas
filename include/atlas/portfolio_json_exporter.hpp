#pragma once

#include "atlas/performance_metrics.hpp"
#include "atlas/portfolio_simulator.hpp"

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
};

} // namespace atlas
