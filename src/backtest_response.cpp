#include "atlas/backtest_response.hpp"

#include <sstream>
#include <stdexcept>

namespace atlas {
namespace {

const char* signal_name(Signal signal) {
    switch (signal) {
        case Signal::Buy: return "BUY";
        case Signal::Sell: return "SELL";
        case Signal::Hold: return "HOLD";
    }

    throw std::invalid_argument("Invalid strategy signal");
}

// Escape JSON control characters in timestamps.
std::string escape_json(const std::string& value) {
    std::ostringstream out;

    for (const unsigned char ch : value) {
        switch (ch) {
            case '"': out << "\\\""; break;
            case '\\': out << "\\\\"; break;
            case '\n': out << "\\n"; break;
            case '\r': out << "\\r"; break;
            case '\t': out << "\\t"; break;
            default:
                if (ch < 0x20) {
                    const char* hex = "0123456789abcdef";
                    out << "\\u00"
                        << hex[ch >> 4]
                        << hex[ch & 15];
                } else {
                    out << static_cast<char>(ch);
                }
        }
    }

    return out.str();
}

} // namespace

std::string BacktestResponse::serialize(
    const std::vector<SignalEvent>& signals,
    const std::string& portfolio_json
) {
    if (portfolio_json.empty() ||
        portfolio_json.front() != '{') {
        throw std::invalid_argument(
            "Invalid portfolio JSON"
        );
    }

    std::ostringstream out;

    out << "{\"response_version\":1,\"signals\":[";

    for (std::size_t i = 0; i < signals.size(); ++i) {
        const auto& event = signals[i];

        if (i != 0) out << ',';

        out << "{\"index\":" << event.index
            << ",\"timestamp\":\""
            << escape_json(event.timestamp)
            << "\",\"signal\":\""
            << signal_name(event.signal)
            << "\"}";
    }

    out << "],\"portfolio\":" << portfolio_json << '}';

    return out.str();
}

} // namespace atlas
