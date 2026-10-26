#include "atlas/signal_exporter.hpp"

#include <fstream>
#include <stdexcept>

namespace atlas {
namespace {

// Convert the signal enum into a stable CSV value.
const char* signal_to_string(Signal signal) {
    switch (signal) {
        case Signal::Buy:
            return "BUY";
        case Signal::Sell:
            return "SELL";
        case Signal::Hold:
            return "HOLD";
    }

    throw std::invalid_argument("Unknown trading signal");
}

} // namespace

void SignalExporter::write_csv(
    const std::string& filepath,
    const std::vector<SignalEvent>& events
) {
    std::ofstream file(filepath);

    if (!file.is_open()) {
        throw std::runtime_error(
            "Cannot open signal output file: " + filepath
        );
    }

    // Write a consistent header for downstream consumers.
    file << "index,timestamp,signal\n";

    for (const auto& event : events) {
        file << event.index << ','
             << event.timestamp << ','
             << signal_to_string(event.signal) << '\n';
    }

    // Detect errors that may occur during buffered writes.
    file.flush();

    if (!file) {
        throw std::runtime_error(
            "Failed writing signal output: " + filepath
        );
    }
}

} // namespace atlas
