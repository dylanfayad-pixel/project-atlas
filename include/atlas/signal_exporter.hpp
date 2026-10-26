#pragma once

#include "atlas/backtest_runner.hpp"

#include <string>
#include <vector>

namespace atlas {

// Exports strategy signal events to a CSV file.
// This format can later be consumed by analytics tools.
class SignalExporter {
public:
    // Writes one row per event, including its timestamp and signal.
    // Throws an exception if the output file cannot be written.
    static void write_csv(
        const std::string& filepath,
        const std::vector<SignalEvent>& events
    );
};

} // namespace atlas
