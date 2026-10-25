#pragma once

#include "atlas/market_bar.hpp"

#include <algorithm>
#include <cmath>

namespace atlas {

inline bool is_valid_market_bar(const MarketBar& bar) {
    if (bar.timestamp.empty()) {
        return false;
    }

    if (!std::isfinite(bar.open) ||
        !std::isfinite(bar.high) ||
        !std::isfinite(bar.low) ||
        !std::isfinite(bar.close)) {
        return false;
    }

    if (bar.open <= 0.0 ||
        bar.high <= 0.0 ||
        bar.low <= 0.0 ||
        bar.close <= 0.0) {
        return false;
    }

    if (bar.high < bar.low) {
        return false;
    }

    if (bar.high < std::max(bar.open, bar.close)) {
        return false;
    }

    if (bar.low > std::min(bar.open, bar.close)) {
        return false;
    }

    return true;
}

} // namespace atlas
